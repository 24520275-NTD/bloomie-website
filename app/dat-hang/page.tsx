import type { Metadata } from "next";
import { orderPageClass } from "../components/order-layout";
import Storefront from "../components/storefront";
import { getProducts } from "../lib/products";
import CheckoutForm from "./checkout-form";
import { CheckoutHeading } from "./checkout-presentation";

export const metadata: Metadata = { title: "Đặt hàng | Bloomie" };

export default async function CheckoutPage() {
  const { products, error } = await getProducts();

  return (
    <Storefront>
      <main className={orderPageClass}>
        {error ? (
          <>
            <CheckoutHeading />
            <p role="alert" className="mt-6">{error}</p>
          </>
        ) : (
          <CheckoutForm products={products} />
        )}
      </main>
    </Storefront>
  );
}
