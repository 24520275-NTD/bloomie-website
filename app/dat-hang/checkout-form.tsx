"use client";
import { Check, MapPin, Phone, ShoppingBag, UserRound, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { orderCardClass, orderColumnsClass, orderSummaryClass } from "../components/order-layout";
import { getCartOwnerId, useCart } from "../lib/cart";
import type { Product } from "../lib/products";
import { defaultShippingAddressKey, parseShippingAddress } from "../lib/shipping-address";
import { createClient, hasSupabaseConfig } from "../lib/supabase-browser";
import { CheckoutConfirmation, CheckoutHeading } from "./checkout-presentation";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function CheckoutForm({ products }: { products: Product[] }) {
  const { cart, ownerId, ready, storageUnavailable, changeCartQuantity, removePurchasedItems } =
    useCart();
  const submitting = useRef(false);
  const checkoutFormRef = useRef<HTMLFormElement>(null);
  const request = useRef<{ key: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; ownerId: string } | null>(null);

  const items = products.filter(({ id }) => cart[id] > 0);
  const missingIds = Object.keys(cart).filter(
    (id) => !products.some((product) => product.id === id),
  );
  const hasMissingPrice = items.some(({ price_vnd }) => price_vnd === null);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price_vnd ?? 0) * cart[item.id],
    0,
  );
  const hasCheckoutForm = ready && !storageUnavailable && missingIds.length === 0
    && items.length > 0 && !hasMissingPrice && createdOrder?.ownerId !== ownerId;
  const confirmedOrder = createdOrder?.ownerId === ownerId ? createdOrder : null;

  useEffect(() => {
    const form = checkoutFormRef.current;
    if (!hasCheckoutForm || !hasSupabaseConfig || !ownerId || !form) return;
    let active = true;

    async function loadDefaultAddress() {
      try {
        const { data, error } = await createClient().auth.getUser();
        if (!active || error || data.user?.id !== ownerId || getCartOwnerId() !== ownerId) return;
        const defaults = parseShippingAddress(data.user.user_metadata[defaultShippingAddressKey]);
        if (!defaults || !form) return;

        for (const [name, value] of Object.entries(defaults)) {
          const field = form.elements.namedItem(name);
          if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
            // Setting the default preserves any value the customer has already edited.
            field.defaultValue = value;
          }
        }
      } catch {
        // The customer can still enter the address manually.
      }
    }

    void loadDefaultAddress();
    return () => { active = false; };
  }, [hasCheckoutForm, ownerId]);

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
      if (user.id !== ownerId || getCartOwnerId() !== ownerId) {
        setMessage(
          "Tài khoản vừa thay đổi. Hãy kiểm tra lại giỏ hàng trước khi đặt.",
        );
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
        setCreatedOrder({ id: data, ownerId: user.id });
        try {
          removePurchasedItems(payload.p_cart);
        } catch {
          setMessage("Đơn đã được ghi nhận. Giỏ hàng chưa được cập nhật trên trình duyệt này.");
        }
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

  function renderContent() {
    if (confirmedOrder) {
      return (
        <CheckoutConfirmation orderId={confirmedOrder.id} message={message} />
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
        key={ownerId}
        ref={checkoutFormRef}
        onSubmit={submit}
        className={orderColumnsClass}
      >
        <fieldset
          disabled={busy}
          className="m-0 grid min-w-0 gap-5 border-0 p-0"
        >
          <section className={orderCardClass} aria-labelledby="recipient-title">
            <h2
              id="recipient-title"
              className="flex items-center gap-2 border-b border-[#E7EDE2] pb-4 text-base font-bold"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#E8F1DD] text-[#245C45]">
                <MapPin size={16} aria-hidden="true" />
              </span>
              Thông tin nhận hàng
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block min-w-0 text-sm font-semibold">
                <span className="flex items-center gap-2"><UserRound size={15} aria-hidden="true" /> Tên người nhận</span>
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={120}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="bloomie-field mt-2 font-normal"
                />
              </label>

              <label className="block min-w-0 text-sm font-semibold">
                <span className="flex items-center gap-2"><Phone size={15} aria-hidden="true" /> Số điện thoại</span>
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
              <label className="block min-w-0 border-t border-[#E7EDE2] pt-4 text-sm font-semibold sm:col-span-2">
                <span className="flex items-center gap-2"><MapPin size={15} aria-hidden="true" /> Địa chỉ giao hàng</span>
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
            </div>
          </section>

          <section
            className={orderCardClass}
            aria-labelledby="payment-title"
          >
            <h2
              id="payment-title"
              className="flex items-center gap-2 border-b border-[#E7EDE2] pb-4 text-base font-bold"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#E8F1DD] text-[#245C45]">
                <Wallet size={16} aria-hidden="true" />
              </span>
              Phương thức thanh toán
            </h2>

            <div className="mt-4 rounded-2xl border border-[#E7EDE2] bg-[#F7FAF4] px-4 py-3">
              <p className="flex items-center gap-2 font-bold text-[#245C45]"><Check size={16} aria-hidden="true" /> Ví giả lập Bloomie</p>
              <p className="mt-1 text-sm leading-6 text-[#52645a]">
                Sau khi xác nhận đơn, bạn có thể thanh toán bằng số dư giả lập
                trên trang chi tiết đơn hàng.
              </p>
            </div>
          </section>
        </fieldset>

        <aside
          aria-labelledby="order-summary-title"
          className={orderSummaryClass}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="order-summary-title" className="text-xl font-bold">
              Tóm tắt thanh toán
            </h2>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#245c45]">
              {items.reduce((total, item) => total + cart[item.id], 0)} sản phẩm
            </span>
          </div>

          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E7EDE2] bg-[#F7FAF4] p-3">
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
                  <p className="wrap-break-word text-sm font-semibold">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-[#52645a]">
                    Số lượng: {cart[item.id]}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-[#245C45]">
                  {money.format((item.price_vnd ?? 0) * cart[item.id])}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <dt>Tạm tính</dt>
              <dd>{money.format(subtotal)}</dd>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#CBDCC2] pt-4">
              <dt className="font-bold">Tổng tiền thanh toán</dt>
              <dd className="text-2xl font-extrabold text-[#245C45]">
                {money.format(subtotal)}
              </dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={busy}
            className="bloomie-button mt-5 w-full disabled:opacity-60"
          >
            <ShoppingBag size={16} aria-hidden="true" /> {busy ? "Đang tạo đơn…" : "Xác nhận đặt hàng"}
          </button>

          {message && (
            <p role="status" className="mt-3 text-sm">
              {message}
            </p>
          )}
          {needsLogin && (
            <p className="mt-2 text-sm">
              <Link href="/dang-nhap" className="font-semibold underline">
                Đăng nhập
              </Link>
              {" rồi quay lại trang Đặt hàng."}
            </p>
          )}
        </aside>
      </form>
    );
  }

  return (
    <>
      <CheckoutHeading orderId={confirmedOrder?.id} hasItems={ready && items.length > 0} />
      {renderContent()}
    </>
  );
}
