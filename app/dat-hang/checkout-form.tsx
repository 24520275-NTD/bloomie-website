"use client";

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
    if (submitting.current || !items.length || missingIds.length || hasMissingPrice) return;

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
      const { data: { user } } = await supabase.auth.getUser();

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
        setMessage("Chưa nhận được mã đơn. Bạn có thể thử lại với thông tin hiện tại.");
      }
    } catch {
      setMessage("Chưa xác nhận được kết quả. Bạn có thể thử lại với thông tin hiện tại.");
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
      </section>
    );
  }

  if (!ready) return <p className="mt-4">Đang tải giỏ hàng…</p>;
  if (storageUnavailable) {
    return <p role="alert" className="mt-4">Trình duyệt chưa cho phép đọc giỏ hàng.</p>;
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
        {hasMissingPrice ? "Giỏ có sản phẩm chưa có giá." : "Giỏ hàng đang trống."}{" "}
        <Link href="/gio-hang" className="underline">Về giỏ hàng</Link>
      </p>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <p className="font-semibold">Tạm tính {money.format(subtotal)}</p>
      <fieldset disabled={busy} className="space-y-4">
        <label className="block">
          Tên người nhận
          <input name="name" autoComplete="name" required maxLength={120} className="bloomie-field mt-1" />
        </label>
        <label className="block">
          Số điện thoại
          <input name="phone" type="tel" autoComplete="tel" required minLength={8} maxLength={25} className="bloomie-field mt-1" />
        </label>
        <label className="block">
          Địa chỉ giao hàng
          <textarea name="address" autoComplete="street-address" required maxLength={500} rows={3} className="bloomie-field mt-1 py-2" />
        </label>
      </fieldset>
      <button type="submit" disabled={busy} className="bloomie-button">
        {busy ? "Đang tạo đơn…" : "Xác nhận đặt hàng"}
      </button>
      {message && <p role="status">{message}</p>}
      {needsLogin && (
        <p>
          <Link href="/dang-nhap" className="underline">Đăng nhập</Link>
          {" rồi quay lại trang Đặt hàng."}
        </p>
      )}
    </form>
  );
}