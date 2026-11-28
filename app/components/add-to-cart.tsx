"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cartQuantityLimit, useCart } from "../lib/cart";
import { Icon } from "./bloomie-icon";

type CartFeedback = { kind: "success" } | { kind: "error"; message: string };
const addedLabel = "Đã thêm vào giỏ";

export default function AddToCart({
  productId,
  compact = false,
  showQuantity = false,
}: {
  productId: string;
  compact?: boolean;
  showQuantity?: boolean;
}) {
  const { changeCartQuantity, ready } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<CartFeedback | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const added = feedback?.kind === "success";
  const error = feedback?.kind === "error" ? feedback.message : "";

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  function add() {
    clearTimeout(resetTimer.current);
    try {
      const changed = changeCartQuantity(
        productId,
        showQuantity ? quantity : 1,
      );
      if (!changed) {
        setFeedback({
          kind: "error",
          message: `Sản phẩm đã đạt giới hạn ${cartQuantityLimit} bộ trong giỏ.`,
        });
        return;
      }

      setFeedback({ kind: "success" });
      resetTimer.current = setTimeout(() => setFeedback(null), 1800);
    } catch {
      setFeedback({
        kind: "error",
        message: "Chưa thêm được sản phẩm. Hãy mở trang giỏ hàng để kiểm tra.",
      });
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
        disabled={!ready}
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold motion-safe:transition motion-safe:active:scale-[.98] focus-visible:ring-2 focus-visible:ring-[#245c45] focus-visible:ring-offset-2 disabled:opacity-60 ${added ? "bg-[#e8f1dd] text-[#245c45] hover:bg-[#dce8d8]" : "bg-[#245c45] text-white hover:bg-[#1c4b38]"}`}
      >
        <Icon name={added ? "check" : "bag"} className="size-4" />
        {added ? addedLabel : "Thêm vào giỏ hàng"}
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
        className={error ? "mt-2 text-xs leading-5 text-[#496259]" : "sr-only"}
      >
        {added ? addedLabel : error}
      </p>
    </div>
  );
}
