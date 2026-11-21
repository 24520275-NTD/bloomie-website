import type { Metadata } from "next";
import Storefront from "../components/storefront";
import { getProducts } from "../lib/products";
import CheckoutForm from "./checkout-form";

export const metadata: Metadata = { title: "Đặt hàng | Bloomie" };

export default async function CheckoutPage() {
  const { products, error } = await getProducts();

  return (
    <Storefront>
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <h1 className="font-display text-3xl font-bold">Đặt hàng</h1>
        {error ? (
          <p role="alert" className="mt-4">{error}</p>
        ) : (
          <CheckoutForm products={products} />
        )}
      </main>
    </Storefront>
  );
}