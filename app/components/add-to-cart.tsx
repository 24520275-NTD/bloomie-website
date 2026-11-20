"use client";

import { useState } from "react";
import Link from "next/link";
import { changeCartQuantity } from "../lib/cart";
import { Icon } from "./bloomie-icon";

export default function AddToCart({
  productId,
  compact = false,
}: {
  productId: string;
  compact?: boolean;
}) {
  const [message, setMessage] = useState("");

  function add() {
    try {
      setMessage(changeCartQuantity(productId, 1)
        ? "Đã thêm sản phẩm vào giỏ hàng."
        : "Sản phẩm đã đạt giới hạn 99 bộ trong giỏ.");
    } catch {
      setMessage(
        "Chưa thêm được sản phẩm. Hãy mở trang giỏ hàng để kiểm tra."
      );
    }
  }

  return (
    <div className={compact ? "mt-4" : "mt-8"}>
      <button
        type="button"
        onClick={add}
        className={compact
          ? "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#245c45] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1c4b38] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245c45]"
          : "rounded-full bg-[#286347] px-8 py-4 font-semibold text-white"}
      >
        {compact && <Icon name="bag" className="size-4" />}
        Thêm vào giỏ hàng
      </button>

      {!compact && <Link
        href="/gio-hang"
        className="ml-5 inline-block py-4 font-semibold underline"
      >
        Xem giỏ hàng
      </Link>}

      <p role="status" className={compact ? "text-xs leading-5 text-[#496259] not-empty:mt-2" : "mt-4 leading-7"}>
        {message}
      </p>
    </div>
  );
}
