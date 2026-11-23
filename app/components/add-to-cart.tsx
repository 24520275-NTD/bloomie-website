"use client";

import { useState } from "react";
import Link from "next/link";
import { cartQuantityLimit, changeCartQuantity } from "../lib/cart";
import { Icon } from "./bloomie-icon";

export default function AddToCart({
  productId,
  compact = false,
  showQuantity = false,
}: {
  productId: string;
  compact?: boolean;
  showQuantity?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  function add() {
    try {
      const changed = changeCartQuantity(
        productId,
        showQuantity ? quantity : 1,
      );
      setMessage(
        changed
          ? "Đã cập nhật giỏ hàng."
          : `Sản phẩm đã đạt giới hạn ${cartQuantityLimit} bộ trong giỏ.`,
      );
    } catch {
      setMessage("Chưa thêm được sản phẩm. Hãy mở trang giỏ hàng để kiểm tra.");
    }
  }

  return (
    <div className={compact ? "mt-4" : "mt-6 space-y-3"}>
      {showQuantity && (
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span id="product-quantity-label">Số lượng</span>
          <div
            role="group"
            aria-labelledby="product-quantity-label"
            className="inline-flex items-center rounded-full border border-[#dce8d8] bg-white"
          >
            <button
              type="button"
              aria-label="Giảm số lượng"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => value - 1)}
              className="grid size-10 place-items-center rounded-full hover:bg-[#e8f1dd] disabled:opacity-40"
            >
              <Icon name="minus" className="size-4" />
            </button>
            <output className="min-w-9 text-center">{quantity}</output>
            <button
              type="button"
              aria-label="Tăng số lượng"
              disabled={quantity >= cartQuantityLimit}
              onClick={() => setQuantity((value) => value + 1)}
              className="grid size-10 place-items-center rounded-full hover:bg-[#e8f1dd] disabled:opacity-40"
            >
              <Icon name="plus" className="size-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#245c45] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1c4b38]"
      >
        <Icon name="bag" className="size-4" />
        Thêm vào giỏ hàng
      </button>

      {!compact && (
        <Link
          href="/gio-hang"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#245c45] px-4 py-3 text-sm font-semibold text-[#245c45] hover:bg-[#e8f1dd]"
        >
          Xem giỏ hàng
          <Icon name="arrow" className="size-4" />
        </Link>
      )}

      <p
        role="status"
        className="text-xs leading-5 text-[#496259] not-empty:mt-2"
      >
        {message}
      </p>
    </div>
  );
}
