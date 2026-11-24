import type { Metadata } from "next";
import Link from "next/link";
import Storefront from "../components/storefront";
import { getProducts } from "../lib/products";
import CheckoutForm from "./checkout-form";

export const metadata: Metadata = { title: "Đặt hàng | Bloomie" };

export default async function CheckoutPage() {
  const { products, error } = await getProducts();

  return (
    <Storefront>
      <main className="mx-auto w-full max-w-[1200px] px-5 py-8 md:px-8 md:py-12">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-[#e2eadc] pb-6">
          <div>
            <p className="inline-flex rounded-full bg-[#e8f1dd] px-3 py-1 text-xs font-bold text-[#245c45]">
              THANH TOÁN & NHẬN HÀNG
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#1f3d33]">
              Đặt hàng
            </h1>
            <p className="mt-2 text-sm text-[#52645a]">
              Kiểm tra giỏ hàng và xác nhận thông tin người nhận.
            </p>
          </div>

          <ol
            aria-label="Các bước đặt hàng"
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-3xl border border-[#e2eadc] bg-white px-4 py-2.5 text-xs font-medium"
          >
            <li>
              <Link href="/gio-hang" className="inline-flex items-center gap-1.5 hover:underline">
                <span className="grid size-5 place-items-center rounded-full bg-[#e8f1dd] text-[#245c45]">
                  1
                </span>
                Giỏ hàng
              </Link>
            </li>
            <li aria-current="step" className="inline-flex items-center gap-1.5 font-bold text-[#245c45]">
              <span className="grid size-5 place-items-center rounded-full bg-[#245c45] text-white">
                2
              </span>
              Giao hàng
            </li>
            <li className="inline-flex items-center gap-1.5 text-[#52645a]">
              <span className="grid size-5 place-items-center rounded-full bg-[#f0f4ed]">
                3
              </span>
              Thanh toán
            </li>
          </ol>
        </header>

        {error ? (
          <p role="alert" className="mt-6">{error}</p>
        ) : (
          <CheckoutForm products={products} />
        )}
      </main>
    </Storefront>
  );
}