import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts } from "../../lib/products";
import AddToCart from "../../components/add-to-cart";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { products, error } = await getProducts();

  if (error) {
    return (
      <main className="min-h-screen bg-[#fffdf8] p-10 text-[#243c32]">
        <p role="alert">{error}</p>
        <Link href="/san-pham" className="mt-6 block underline">
          Quay lại sản phẩm
        </Link>
      </main>
    );
  }

  const product = products.find((item) => item.id === id);

  if (!product) notFound();

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-10 text-[#243c32]">
      <div className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap gap-6 font-semibold">
          <Link href="/">Trang chủ</Link>
          <Link href="/san-pham">Sản phẩm</Link>
          <Link href="/gio-hang">Giỏ hàng</Link>
          <Link href="/tai-khoan">Tài khoản</Link>
        </nav>

        <div className="mt-10 grid items-start gap-10 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-green-100 bg-white">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 767px) 100vw, 50vw"
              className="object-contain p-5"
            />
          </div>

          <section>
            <p className="text-sm font-bold tracking-widest text-green-700">
              BỘ HỌC LIỆU BLOOMIE
            </p>

            <h1 className="mt-4 text-4xl font-extrabold leading-tight">
              {product.name}
            </h1>

            <h2 className="mt-8 text-xl font-bold">
              Giới thiệu sản phẩm
            </h2>

            <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
              {product.description.trim() ||
                "Thông tin chi tiết của bộ học liệu đang được cập nhật."}
            </p>

            <p className="mt-8 font-semibold">
              Giá bán: đang cập nhật
            </p>

            <AddToCart
              productId={product.id}
              validIds={products.map((item) => item.id)}
            />

            <p className="mt-6 text-sm leading-7 text-slate-600">
              Bạn có thể chọn sản phẩm vào giỏ. Website chưa nhận
              đặt hàng hoặc thanh toán ở giai đoạn này.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}