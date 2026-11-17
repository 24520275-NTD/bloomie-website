"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddToCart({
  productId,
  validIds,
}: {
  productId: string;
  validIds: string[];
}) {
  const [message, setMessage] = useState("");

  function add() {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem("bloomie-cart-v1") || "{}"
      );

      const cart: Record<string, number> = {};

      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        for (const id of validIds) {
          const quantity = (saved as Record<string, unknown>)[id];

          if (
            typeof quantity === "number" &&
            Number.isInteger(quantity) &&
            quantity > 0
          ) {
            cart[id] = Math.min(quantity, 99);
          }
        }
      }

      if ((cart[productId] || 0) >= 99) {
        setMessage("Sản phẩm đã đạt giới hạn 99 bộ trong giỏ.");
        return;
      }

      cart[productId] = (cart[productId] || 0) + 1;

      localStorage.setItem("bloomie-cart-v1", JSON.stringify(cart));
      setMessage("Đã thêm sản phẩm vào giỏ hàng.");
    } catch {
      setMessage(
        "Chưa thêm được sản phẩm. Hãy mở trang giỏ hàng để kiểm tra."
      );
    }
  }

  return (
    <div className="mt-8">
      <button
        onClick={add}
        className="rounded-full bg-[#286347] px-8 py-4 font-semibold text-white"
      >
        Thêm vào giỏ hàng
      </button>

      <Link
        href="/gio-hang"
        className="ml-5 inline-block py-4 font-semibold underline"
      >
        Xem giỏ hàng
      </Link>

      <p role="status" className="mt-4 leading-7">
        {message}
      </p>
    </div>
  );
}