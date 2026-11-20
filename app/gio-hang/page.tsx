import type { Metadata } from "next";
import Shop from "../components/shop";
import { getProducts } from "../lib/products";

export const metadata: Metadata = { title: "Giỏ hàng | Bloomie" };

export default async function CartPage() {
  const { products, error } = await getProducts();
  return <Shop products={products} error={error} cartPage />;
}
