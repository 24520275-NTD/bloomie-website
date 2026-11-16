import Link from "next/link";
import Shop from "../components/shop";
import { getProducts } from "../lib/products";

export default async function ProductsPage() {
  const { products, error } = await getProducts();

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <h1 className="text-2xl font-bold">Sản phẩm Bloomie</h1>
        <p role="alert" className="my-6">{error}</p>
        <Link href="/" className="underline">Về trang chủ</Link>
      </main>
    );
  }

  if (products.length === 0) {
    return <main className="p-10">Danh mục đang được cập nhật.</main>;
  }

  return <Shop products={products} />;
}
