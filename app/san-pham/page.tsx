import Image from "next/image";
import Link from "next/link";

const products = [
  {
    id: "ghep-hinh-logic",
    name: "Bộ ghép hình logic",
    image: "/ghep-hinh-logic.png",
  },
  {
    id: "bo-oc-van",
    name: "Bộ ốc vặn",
    image: "/bo-oc-van.png",
  },
  {
    id: "the-tu-vung",
    name: "Thẻ học từ vựng",
    image: "/the-tu-vung.png",
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[#fffdf8] text-[#243c32]">
      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-4">
          <Link href="/" aria-label="Bloomie — Trang chủ">
            <Image
              src="/bloomie-logo.png"
              alt="Logo Bloomie"
              width={160}
              height={90}
              className="h-20 w-40 object-contain"
            />
          </Link>

          <nav className="flex gap-6 text-sm font-semibold">
            <Link href="/">Trang chủ</Link>
            <Link href="/san-pham" aria-current="page">
              Sản phẩm
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm font-bold tracking-widest text-green-700">
          BLOOMIE — HỌC CÙNG LỚN KHÔN
        </p>

        <h1 className="mt-4 text-4xl font-extrabold">
          Khám phá bộ học liệu
        </h1>

        <p className="mt-5 leading-8 text-slate-600">
          Tìm hiểu các bộ sản phẩm và học liệu của Bloomie.
        </p>

        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Website đang được hoàn thiện. Giá bán và thông tin chi tiết
          đang cập nhật; hiện chưa nhận đặt hàng hoặc thanh toán.
        </p>

        <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-3xl border border-green-100 bg-white"
            >
              <div className="relative aspect-square bg-[#f5f7ef]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                  className="object-contain p-4"
                />
              </div>

              <div className="p-6">
                <p className="text-xs font-bold tracking-widest text-green-700">
                  BỘ SẢN PHẨM BLOOMIE
                </p>

                <h2 className="mt-3 text-2xl font-bold">
                  {product.name}
                </h2>

                <p className="mt-5 font-semibold">
                  Giá bán: đang cập nhật
                </p>

                <details className="mt-6 border-t border-green-100 pt-5">
                  <summary className="cursor-pointer font-semibold">
                    Xem ảnh sản phẩm
                  </summary>

                  <a
                    href={product.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-green-700 underline"
                  >
                    Mở ảnh đầy đủ ↗
                  </a>
                </details>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="mt-12 border-t border-green-100 px-6 py-8 text-center text-sm text-slate-500">
        Bloomie · Học cùng lớn khôn.
      </footer>
    </div>
  );
}
