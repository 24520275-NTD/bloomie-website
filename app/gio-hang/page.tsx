import Link from "next/link";
import Shop from "../components/shop";
import { getProducts } from "../lib/products";

export default async function CartPage() {
  const { products, error } = await getProducts();

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <h1 className="text-2xl font-bold">Giỏ hàng Bloomie</h1>
        <p role="alert" className="my-6">{error}</p>
        <Link href="/san-pham" className="underline">
          Quay lại sản phẩm
        </Link>
      </main>
    );
  }

  return <Shop products={products} cartPage />;
}
