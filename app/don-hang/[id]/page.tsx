import type { Metadata } from "next";
import { getProducts } from "../../lib/products";
import OrderDetail from "./order-detail";

export const metadata: Metadata = { title: "Chi tiết đơn hàng | Bloomie" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { products }] = await Promise.all([params, getProducts()]);
  const productImages = Object.fromEntries(products.map(({ id, image }) => [id, image]));

  return <OrderDetail key={id} id={id} productImages={productImages} />;
}
