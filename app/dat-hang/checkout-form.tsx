"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { changeCartQuantity, useCart } from "../lib/cart";
import type { Product } from "../lib/products";
import { createClient, hasSupabaseConfig } from "../lib/supabase-browser";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function CheckoutForm({ products }: { products: Product[] }) {
  const { cart, ready, storageUnavailable } = useCart();
  const submitting = useRef(false);
  const request = useRef<{ key: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [orderId, setOrderId] = useState("");

  const items = products.filter(({ id }) => cart[id] > 0);
  const missingIds = Object.keys(cart).filter(
    (id) => !products.some((product) => product.id === id),
  );
  const hasMissingPrice = items.some(({ price_vnd }) => price_vnd === null);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price_vnd ?? 0) * cart[item.id],
    0,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      submitting.current ||
      !items.length ||
      missingIds.length ||
      hasMissingPrice
    )
      return;

    if (!hasSupabaseConfig) {
      setMessage("Chưa có cấu hình kết nối để đặt hàng.");
      return;
    }

    const fields = new FormData(event.currentTarget);
    const payload = {
      p_recipient_name: String(fields.get("name") ?? "").trim(),
      p_recipient_phone: String(fields.get("phone") ?? "").trim(),
      p_shipping_address: String(fields.get("address") ?? "").trim(),
      p_cart: Object.fromEntries(items.map(({ id }) => [id, cart[id]])),
    };

    submitting.current = true;
    setBusy(true);
    setMessage("");
    setNeedsLogin(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNeedsLogin(true);
        setMessage("Bạn cần đăng nhập để đặt hàng.");
        return;
      }

      const key = JSON.stringify([user.id, payload]);
      if (request.current?.key !== key) {
        request.current = { key, id: crypto.randomUUID() };
      }

      const { data, error } = await supabase.rpc("create_order", {
        p_request_id: request.current.id,
        ...payload,
      });

      if (error) {
        setMessage(
          error.code === "P0001"
            ? error.message
            : "Chưa xác nhận được kết quả. Bạn có thể thử lại với thông tin hiện tại.",
        );
        return;
      }

      if (typeof data === "string" && data) {
        setOrderId(data);
      } else {
        setMessage(
          "Chưa nhận được mã đơn. Bạn có thể thử lại với thông tin hiện tại.",
        );
      }
    } catch {
      setMessage(
        "Chưa xác nhận được kết quả. Bạn có thể thử lại với thông tin hiện tại.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (orderId) {
    return (
      <section className="mt-6 rounded-2xl bg-green-50 p-5" role="status">
        <h2 className="font-bold">Đã tạo đơn hàng</h2>
        <p className="mt-2 break-all">Mã đơn {orderId}</p>
        <p className="mt-2">Trạng thái: Chờ thanh toán</p>
        <Link href={`/don-hang/${orderId}`} className="bloomie-button mt-4">
          Xem chi tiết đơn hàng
        </Link>
      </section>
    );
  }

  if (!ready) return <p className="mt-4">Đang tải giỏ hàng…</p>;
  if (storageUnavailable) {
    return (
      <p role="alert" className="mt-4">
        Trình duyệt chưa cho phép đọc giỏ hàng.
      </p>
    );
  }

  if (missingIds.length > 0) {
    return (
      <div className="mt-4 space-y-3">
        <p>Giỏ có sản phẩm không còn hiển thị trong danh mục.</p>
        <button
          type="button"
          className="bloomie-button"
          onClick={() => {
            try {
              for (const id of missingIds) changeCartQuantity(id, -cart[id]);
            } catch {
              setMessage("Chưa cập nhật được giỏ hàng. Bạn thử lại nhé.");
            }
          }}
        >
          Bỏ sản phẩm không còn trong danh mục
        </button>
        {message && <p role="alert">{message}</p>}
      </div>
    );
  }

  if (!items.length || hasMissingPrice) {
    return (
      <p className="mt-4">
        {hasMissingPrice
          ? "Giỏ có sản phẩm chưa có giá."
          : "Giỏ hàng đang trống."}{" "}
        <Link href="/gio-hang" className="underline">
          Về giỏ hàng
        </Link>
      </p>
    );
  }

    return (
    <form
      onSubmit={submit}
      className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <fieldset
        disabled={busy}
        className="min-w-0 space-y-6 rounded-[28px] border border-[#e2eadc] bg-white p-5 shadow-sm sm:p-7"
      >
        <section className="space-y-4" aria-labelledby="recipient-title">
          <h2 id="recipient-title" className="flex items-center gap-3 text-lg font-bold">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e8f1dd] text-sm text-[#245c45]">
              1
            </span>
            Thông tin người nhận
          </h2>

          <label className="block text-sm font-semibold">
            Tên người nhận
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={120}
              placeholder="Ví dụ: Nguyễn Văn An"
              className="bloomie-field mt-2 font-normal"
            />
          </label>

          <label className="block text-sm font-semibold">
            Số điện thoại
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              minLength={8}
              maxLength={25}
              placeholder="Nhập số điện thoại liên hệ"
              className="bloomie-field mt-2 font-normal"
            />
          </label>
        </section>

        <section className="space-y-4 border-t border-[#e2eadc] pt-6" aria-labelledby="address-title">
          <h2 id="address-title" className="flex items-center gap-3 text-lg font-bold">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e8f1dd] text-sm text-[#245c45]">
              2
            </span>
            Địa chỉ nhận học liệu
          </h2>

          <label className="block text-sm font-semibold">
            Địa chỉ giao hàng
            <textarea
              name="address"
              autoComplete="street-address"
              required
              maxLength={500}
              rows={3}
              placeholder="Số nhà, tên đường, phường/xã và tỉnh/thành phố"
              className="bloomie-field mt-2 py-3 font-normal"
            />
          </label>
        </section>

        <section className="space-y-4 border-t border-[#e2eadc] pt-6" aria-labelledby="payment-title">
          <h2 id="payment-title" className="flex items-center gap-3 text-lg font-bold">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e8f1dd] text-sm text-[#245c45]">
              3
            </span>
            Phương thức thanh toán
          </h2>

          <div className="rounded-2xl border border-[#88aa94] bg-[#f0f6eb] px-4 py-3">
            <p className="font-bold text-[#245c45]">✓ Ví giả lập Bloomie</p>
            <p className="mt-1 text-sm leading-6 text-[#52645a]">
              Sau khi xác nhận đơn, bạn có thể thanh toán bằng số dư giả lập
              trên trang chi tiết đơn hàng.
            </p>
          </div>
        </section>
      </fieldset>

      <section
        aria-labelledby="order-summary-title"
        className="min-w-0 rounded-[28px] border border-[#dce8d4] bg-[#e8f1dd] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="order-summary-title" className="text-lg font-bold">
            Đơn hàng của bạn
          </h2>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#245c45]">
            {items.reduce((total, item) => total + cart[item.id], 0)} sản phẩm
          </span>
        </div>

        <ul className="mt-4 divide-y divide-[#245c45]/10">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="wrap-break-word text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-xs text-[#52645a]">
                  Số lượng: {cart[item.id]}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold">
                {money.format((item.price_vnd ?? 0) * cart[item.id])}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-3 border-t border-[#245c45]/15 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <dt>Tạm tính</dt>
            <dd>{money.format(subtotal)}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
            <dt>Tổng thanh toán</dt>
            <dd className="text-2xl text-[#245c45]">{money.format(subtotal)}</dd>
          </div>
        </dl>

        <button type="submit" disabled={busy} className="bloomie-button mt-6 w-full">
          {busy ? "Đang tạo đơn…" : "Xác nhận đặt hàng"}
        </button>

        {message && <p role="status" className="mt-3 text-sm">{message}</p>}
        {needsLogin && (
          <p className="mt-2 text-sm">
            <Link href="/dang-nhap" className="font-semibold underline">
              Đăng nhập
            </Link>
            {" rồi quay lại trang Đặt hàng."}
          </p>
        )}
      </section>
    </form>
  );
}