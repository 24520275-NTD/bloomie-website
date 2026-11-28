import type { Metadata } from "next";
import { getProducts } from "../../lib/products";
import OrderDetail from "./order-detail";

export const metadata: Metadata = { title: "Chi tiết đơn hàng | Bloomie" };

export default async function OrderPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ "hoan-tat"?: string | string[] }>;
}) {
  const [{ id }, query, { products }] = await Promise.all([params, searchParams, getProducts()]);
  const productImages = Object.fromEntries(products.map(({ id, image }) => [id, image]));

  return <OrderDetail key={id} id={id} productImages={productImages} showCompletion={query["hoan-tat"] === "1"} />;
}
