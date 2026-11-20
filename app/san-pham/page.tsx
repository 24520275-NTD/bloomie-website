import type { Metadata } from "next";
import Shop from "../components/shop";
import { getProducts } from "../lib/products";

export const metadata: Metadata = { title: "Tất cả sản phẩm | Bloomie" };

export default async function ProductsPage() {
  const { products, error } = await getProducts();
  return <Shop products={products} error={error} />;
}
