import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "../../components/add-to-cart";
import { Icon } from "../../components/bloomie-icon";
import Storefront from "../../components/storefront";
import { getProducts } from "../../lib/products";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { products, error } = await getProducts();

  if (error) {
    return (
      <Storefront>
        <main className="mx-auto w-full max-w-[1200px] px-5 py-10 md:px-8">
          <p role="alert">{error}</p>
          <Link href="/san-pham" className="mt-6 inline-block underline">
            Quay lại sản phẩm
          </Link>
        </main>
      </Storefront>
    );
  }

  const product = products.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <Storefront>
      <main className="mx-auto w-full max-w-[1200px] px-5 py-8 md:px-8 md:py-12">
        <Link
          href="/san-pham"
          className="inline-flex rounded-full border border-[#dce8d8] px-4 py-2 text-sm font-semibold text-[#245c45] hover:bg-[#e8f1dd]"
        >
          ← Tất cả sản phẩm
        </Link>

        <div className="mt-6 grid items-start gap-8 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
          <div className="rounded-[32px] border border-[#e4eddc] bg-[#f0f5e9] p-4 sm:p-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-white">
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 767px) 90vw, (max-width: 1200px) 55vw, 640px"
                className="object-contain p-5 sm:p-8"
              />
              <a
                href={product.image}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mở ảnh sản phẩm trong tab mới"
                className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-white text-[#245c45] shadow-sm hover:bg-[#e8f1dd]"
              >
                <Icon name="search" className="size-5" />
              </a>
            </div>
          </div>

          <section className="min-w-0">
            <p className="inline-flex rounded-full bg-[#e8f1dd] px-3 py-1 text-xs font-bold tracking-wide text-[#245c45]">
              BỘ HỌC LIỆU BLOOMIE
            </p>

            <h1 className="font-display mt-3 text-4xl leading-tight font-extrabold tracking-tight text-[#1f3d33] lg:text-5xl">
              {product.name}
            </h1>

            <div className="mt-5 rounded-[24px] border border-[#dce8d8] bg-white px-5 py-4">
              <p className="text-xs font-semibold tracking-wide text-[#52645a]">
                GIÁ BÁN NIÊM YẾT
              </p>
              <p className="mt-1 text-2xl font-extrabold text-[#1f3d33]">
                {product.price_vnd === null
                  ? "Giá đang cập nhật"
                  : money.format(product.price_vnd)}
              </p>
            </div>

            <p className="mt-5 whitespace-pre-line text-base leading-7 text-[#4a5568]">
              {product.description?.trim() ||
                "Thông tin chi tiết của bộ học liệu đang được cập nhật."}
            </p>

            <AddToCart key={product.id} productId={product.id} showQuantity />

            <p className="mt-5 flex items-start gap-2 rounded-2xl bg-[#edf4e7] px-4 py-3 text-sm leading-6 text-[#375347]">
              <Icon name="shield" className="mt-0.5 size-4 shrink-0" />
              Bloomie sử dụng ví giả lập để thanh toán đơn hàng.
            </p>
          </section>
        </div>
      </main>
    </Storefront>
  );
}