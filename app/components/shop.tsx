"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const products = [
  {
    id: "ghep-hinh-logic",
    name: "Bộ ghép hình logic",
    image: "/ghep-hinh-logic.png",
  },
  {
    id: "bo-oc-van",
    name: "Bộ ốc vặn",
    image: "/bo-oc-van.png",
  },
  {
    id: "the-tu-vung",
    name: "Thẻ học từ vựng",
    image: "/the-tu-vung.png",
  },
];

type Cart = Record<string, number>;
const storageKey = "bloomie-cart-v1";

export default function Shop({ cartPage = false }: { cartPage?: boolean }) {
  const [cart, setCart] = useState<Cart>({});
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem(storageKey) || "{}"
      );
      const valid: Cart = {};

      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        for (const product of products) {
          const quantity = (saved as Record<string, unknown>)[product.id];
          if (
            typeof quantity === "number" &&
            Number.isInteger(quantity) &&
            quantity > 0
          ) {
            valid[product.id] = Math.min(quantity, 99);
          }
        }
      }

      setCart(valid);
    } catch {
      setMessage("Không đọc được giỏ đã lưu. Bạn có thể tạo giỏ mới.");
    }
    setReady(true);
  }, []);

  function change(id: string, amount: number) {
    const next = { ...cart };
    const quantity = Math.max(0, Math.min(99, (next[id] || 0) + amount));

    if (quantity === 0) delete next[id];
    else next[id] = quantity;

    setCart(next);

    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setMessage(amount > 0 ? "Đã thêm sản phẩm vào giỏ." : "Đã cập nhật giỏ hàng.");
    } catch {
      setMessage("Giỏ đã cập nhật, nhưng trình duyệt không cho lưu khi tải lại.");
    }
  }

  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const visible = cartPage
    ? products.filter((product) => cart[product.id])
    : products;

  return (
    <div className="min-h-screen bg-[#fffdf8] text-[#243c32]">
      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-4">
          <Link href="/" aria-label="Bloomie — Trang chủ">
            <Image
              src="/bloomie-logo.png"
              alt="Logo Bloomie"
              width={160}
              height={90}
              className="h-20 w-40 object-contain"
            />
          </Link>
          <nav className="flex flex-wrap gap-5 font-semibold">
            <Link href="/">Trang chủ</Link>
            <Link href="/san-pham">Sản phẩm</Link>
            <Link href="/gio-hang">
              Giỏ hàng {ready ? `(${count})` : ""}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-extrabold">
          {cartPage ? "Giỏ hàng của bạn" : "Khám phá bộ học liệu"}
        </h1>

        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-7 text-amber-900">
          Giá bán đang cập nhật. Giỏ hàng hiện dùng để chọn sản phẩm,
          chưa tạo đơn hoặc nhận thanh toán.
        </p>

        <p role="status" className="mt-4 min-h-7 text-green-800">
          {message}
        </p>

        {!ready ? (
          <p>Đang tải giỏ hàng…</p>
        ) : cartPage && visible.length === 0 ? (
          <div className="rounded-3xl bg-white p-8">
            <p className="mb-5">Bạn chưa chọn sản phẩm nào.</p>
            <Link href="/san-pham" className="font-bold underline">
              Khám phá sản phẩm →
            </Link>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-3xl border border-green-100 bg-white"
              >
                <div className="relative aspect-square bg-[#f5f7ef]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    className="object-contain p-4"
                  />
                </div>

                <div className="p-6">
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  <p className="mt-4">Giá bán: đang cập nhật</p>

                  {cartPage ? (
                    <div className="mt-6">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => change(product.id, -1)}
                          aria-label={`Giảm số lượng ${product.name}`}
                          className="rounded-lg border px-4 py-2"
                        >
                          −
                        </button>
                        <span>Số lượng: {cart[product.id]}</span>
                        <button
                          onClick={() => change(product.id, 1)}
                          disabled={cart[product.id] >= 99}
                          aria-label={`Tăng số lượng ${product.name}`}
                          className="rounded-lg border px-4 py-2 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => change(product.id, -cart[product.id])}
                        className="mt-5 text-sm text-red-700 underline"
                      >
                        Xóa khỏi giỏ
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => change(product.id, 1)}
                      disabled={(cart[product.id] || 0) >= 99}
                      className="mt-6 w-full rounded-full bg-[#286347] px-5 py-3 font-semibold text-white disabled:opacity-40"
                    >
                      Thêm vào giỏ
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {ready && cartPage && count > 0 && (
          <div className="mt-8 rounded-3xl bg-[#e9f2df] p-7">
            <p className="text-xl font-bold">Tổng số lượng: {count}</p>
            <p className="mt-3">Tổng tiền: chờ cập nhật giá bán.</p>
            <Link href="/san-pham" className="mt-5 inline-block underline">
              ← Tiếp tục chọn sản phẩm
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
