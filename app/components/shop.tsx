"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cartQuantityLimit, useCart } from "../lib/cart";
import type { Product } from "../lib/products";
import AddToCart from "./add-to-cart";
import { Icon } from "./bloomie-icon";
import Storefront from "./storefront";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});
const productHref = (id: string) => `/san-pham/${encodeURIComponent(id)}`;
const priceText = (price: number | null) =>
  price === null ? "Giá đang cập nhật" : currency.format(price);
const imageColors = ["bg-[#e8f1dd]", "bg-[#f8ead9]", "bg-[#e8f0ec]"];

function searchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}

function ProductPhoto({
  product,
  catalog = false,
}: {
  product: Product;
  catalog?: boolean;
}) {
  if (!product.image?.startsWith("/") || product.image.startsWith("//")) {
    return (
      <span className="grid h-full place-items-center text-[#245c45]">
        <Icon name="book" />
      </span>
    );
  }

  return (
    <Image
      src={product.image}
      alt=""
      fill
      sizes={
        catalog
          ? "(max-width: 639px) 92vw, (max-width: 1023px) 45vw, 350px"
          : "110px"
      }
      className={
        catalog
          ? "object-contain p-5 transition-transform duration-300 group-hover:scale-105"
          : "object-contain p-2"
      }
    />
  );
}

function Catalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const term = searchText(query.trim());
  const visible = products.filter(({ name, description }) =>
    searchText(`${name} ${description ?? ""}`).includes(term),
  );
  if (sort === "name")
    visible.sort((a, b) => a.name.localeCompare(b.name, "vi"));

  return (
    <>
      <div className="mb-6 grid gap-4 rounded-[24px] border border-[#dee7d8] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end sm:p-5">
        <div>
          <label
            htmlFor="catalog-search"
            className="mb-2 block text-sm font-semibold"
          >
            Tìm sản phẩm
          </label>
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#496259]"
            />
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nhập tên bộ học liệu"
              className="bloomie-field pl-12"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="catalog-sort"
            className="mb-2 block text-sm font-semibold"
          >
            Sắp xếp
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="bloomie-field"
          >
            <option value="featured">Mặc định</option>
            <option value="name">Tên sản phẩm A–Z</option>
          </select>
        </div>
      </div>

      <p role="status" className="mb-4 text-sm font-semibold text-[#496259]">
        {visible.length} sản phẩm
      </p>
      {visible.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product, index) => (
            <article
              key={product.id}
              className="flex min-w-0 flex-col rounded-[30px] border border-[#dee7d8] bg-white p-3 shadow-[0_6px_24px_rgba(31,61,51,.04)]"
            >
              <Link
                href={productHref(product.id)}
                aria-label={`Xem ${product.name}`}
                className={`group relative block aspect-[4/3] overflow-hidden rounded-[21px] ${imageColors[index % imageColors.length]}`}
              >
                <ProductPhoto product={product} catalog />
              </Link>
              <div className="flex flex-1 flex-col px-3 pt-4 pb-2">
                <h2 className="font-display text-[1.45rem] leading-tight font-bold break-words">
                  <Link
                    href={productHref(product.id)}
                    className="hover:underline"
                  >
                    {product.name}
                  </Link>
                </h2>
                {product.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#496259]">
                    {product.description}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  <p className="text-sm font-bold text-[#245c45]">
                    {priceText(product.price_vnd)}
                  </p>
                  <AddToCart productId={product.id} compact />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-[#dee7d8] bg-white p-8 text-center">
          <h2 className="font-display text-2xl font-bold">
            Chưa tìm thấy sản phẩm phù hợp
          </h2>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="bloomie-button bloomie-button-outline mt-5"
          >
            Xóa tìm kiếm
          </button>
        </div>
      )}
    </>
  );
}

function CartContents({ products }: { products: Product[] }) {
  const { cart, ready, storageUnavailable, changeCartQuantity } = useCart();
  const [message, setMessage] = useState("");
  const items = products.filter(({ id }) => cart[id] > 0);
  const count = items.reduce((total, { id }) => total + cart[id], 0);
  const subtotal = items.every(({ price_vnd }) => price_vnd !== null)
    ? items.reduce(
        (total, product) => total + (product.price_vnd ?? 0) * cart[product.id],
        0,
      )
    : null;

  function change(id: string, amount: number, success: string) {
    try {
      if (changeCartQuantity(id, amount)) setMessage(success);
    } catch {
      setMessage("Trình duyệt chưa lưu được giỏ hàng. Bạn thử lại nhé.");
    }
  }

  if (!ready)
    return (
      <p role="status" className="text-sm text-[#496259]">
        Đang tải giỏ hàng…
      </p>
    );

  return (
    <>
      <p
        role="status"
        className="text-sm font-medium text-[#496259] not-empty:mb-4"
      >
        {storageUnavailable
          ? "Trình duyệt chưa cho phép đọc giỏ hàng."
          : message}
      </p>

      {items.length === 0 ? (
        <section className="rounded-[30px] border border-[#dee7d8] bg-white px-6 py-12 text-center sm:py-16">
          <span className="mx-auto grid size-[4.5rem] place-items-center rounded-[22px] bg-[#e8f1dd] text-[#245c45]">
            <Icon name="bag" className="size-8" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold">
            Giỏ hàng đang trống
          </h2>
          <Link href="/san-pham" className="bloomie-button mt-6">
            Xem tất cả sản phẩm <Icon name="arrow" />
          </Link>
        </section>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section
            aria-label="Sản phẩm trong giỏ"
            className="overflow-hidden rounded-[28px] border border-[#dee7d8] bg-white"
          >
            <ul className="divide-y divide-[#dee7d8]">
              {items.map((product) => {
                const quantity = cart[product.id];
                return (
                  <li
                    key={product.id}
                    className="grid grid-cols-[68px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:gap-5 sm:p-5"
                  >
                    <Link
                      href={productHref(product.id)}
                      aria-label={`Xem ${product.name}`}
                      className="relative aspect-square overflow-hidden rounded-2xl bg-[#edf3e6]"
                    >
                      <ProductPhoto product={product} />
                    </Link>
                    <div>
                      <h2 className="font-display text-xl leading-tight font-bold break-words sm:text-2xl">
                        <Link
                          href={productHref(product.id)}
                          className="hover:underline"
                        >
                          {product.name}
                        </Link>
                      </h2>
                      <p className="mt-1.5 text-sm text-[#496259]">
                        {priceText(product.price_vnd)}
                      </p>
                    </div>
                    <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-auto">
                      <div className="flex items-center rounded-full border border-[#d6e2d5] bg-[#fffdf8]">
                        <button
                          type="button"
                          onClick={() =>
                            change(product.id, -1, "Đã cập nhật giỏ hàng.")
                          }
                          aria-label={`Giảm số lượng ${product.name}`}
                          className="grid size-10 place-items-center rounded-full text-[#245c45] hover:bg-[#e8f1dd]"
                        >
                          <Icon name="minus" className="size-4" />
                        </button>
                        <span
                          aria-label={`Số lượng ${quantity}`}
                          className="min-w-7 text-center text-sm font-bold tabular-nums"
                        >
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            change(product.id, 1, "Đã cập nhật giỏ hàng.")
                          }
                          aria-label={`Tăng số lượng ${product.name}`}
                          disabled={quantity >= cartQuantityLimit}
                          className="grid size-10 place-items-center rounded-full text-[#245c45] hover:bg-[#e8f1dd] disabled:opacity-40"
                        >
                          <Icon name="plus" className="size-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          change(
                            product.id,
                            -cartQuantityLimit,
                            "Đã xóa sản phẩm khỏi giỏ.",
                          )
                        }
                        aria-label={`Xóa ${product.name} khỏi giỏ`}
                        className="grid size-10 place-items-center rounded-full text-[#85432e] hover:bg-[#f8ead9]"
                      >
                        <Icon name="trash" className="size-4.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className="rounded-[28px] bg-[#e8f1dd] p-6 sm:p-7">
            <h2 className="font-display text-2xl font-bold">
              Tóm tắt giỏ hàng
            </h2>
            <dl className="mt-5 divide-y divide-[#cbdcc6] text-sm">
              <div className="flex justify-between gap-4 py-3">
                <dt>Tổng số lượng</dt>
                <dd className="shrink-0 font-bold">{count} sản phẩm</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt>Tạm tính</dt>
                <dd className="text-right font-bold">
                  {subtotal === null
                    ? "Chờ cập nhật giá"
                    : currency.format(subtotal)}
                </dd>
              </div>
            </dl>
            {subtotal !== null && (
              <Link href="/dat-hang" className="bloomie-button mt-5 w-full">
                Đặt hàng
              </Link>
            )}
            <Link href="/san-pham" className="bloomie-button mt-5 w-full">
              Tiếp tục xem sản phẩm <Icon name="arrow" />
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}

export default function Shop({
  products,
  error,
  cartPage = false,
}: {
  products: Product[];
  error: string | null;
  cartPage?: boolean;
}) {
  const title = cartPage ? "Giỏ hàng của bạn" : "Tất cả sản phẩm";

  return (
    <Storefront productIds={error ? undefined : products.map(({ id }) => id)}>
      <main className="mx-auto w-full max-w-[1200px] px-5 pt-8 pb-14 md:px-8 md:pt-12 md:pb-20">
        <nav
          aria-label="Đường dẫn"
          className="mb-7 flex flex-wrap items-center gap-2.5 text-sm text-[#496259]"
        >
          <Link href="/" className="hover:underline">
            Trang chủ
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-[#245c45]">
            {cartPage ? "Giỏ hàng" : "Tất cả sản phẩm"}
          </span>
        </nav>
        <div className="relative mb-8 flex items-center justify-between gap-4 overflow-hidden rounded-[30px] bg-[#e8f1dd] px-6 py-8 sm:rounded-[36px] sm:px-10 md:py-11">
          <div className="relative z-10">
            <h1 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.08] font-bold tracking-[-.04em]">
              {title}
            </h1>
            {!cartPage && (
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#496259] sm:text-base">
                Chọn bộ học liệu để bé tự tay thử nghiệm, sáng tạo và khám phá.
              </p>
            )}
          </div>
          <span
            aria-hidden="true"
            className="absolute -right-10 -bottom-20 size-64 rounded-full border-[36px] border-[#dbe9ce]"
          />
          <span
            aria-hidden="true"
            className="relative z-10 hidden size-20 shrink-0 place-items-center rounded-[26px] bg-[#fffdf8] text-[#245c45] sm:grid"
          >
            <Icon name={cartPage ? "bag" : "book"} className="size-9" />
            <span className="absolute -top-2 -right-2 size-5 rounded-full bg-[#f6a45c]" />
          </span>
        </div>

        {error ? (
          <div className="rounded-[24px] border border-[#dee7d8] bg-white p-6">
            <p role="alert">{error}</p>
            {cartPage && (
              <Link
                href="/san-pham"
                className="bloomie-button bloomie-button-outline mt-5"
              >
                Xem sản phẩm
              </Link>
            )}
          </div>
        ) : cartPage ? (
          <CartContents products={products} />
        ) : products.length ? (
          <Catalog products={products} />
        ) : (
          <p className="rounded-[24px] border border-[#dee7d8] bg-white p-6">
            Danh mục đang được cập nhật.
          </p>
        )}
      </main>
    </Storefront>
  );
}
