import Link from "next/link";

const products = [
  {
    id: "bo-hoc-lieu-01",
    name: "Bộ học liệu minh họa 01",
    description:
      "Vị trí dành cho phần giới thiệu ngắn của bộ học liệu đầu tiên.",
    contents:
      "Thông tin thành phần bộ sản phẩm, cách sử dụng và video đi kèm sẽ được cập nhật theo sản phẩm thật.",
    icon: "📚",
    background: "bg-[#e9f2df]",
  },
  {
    id: "bo-hoc-lieu-02",
    name: "Bộ học liệu minh họa 02",
    description:
      "Vị trí dành cho phần giới thiệu ngắn của bộ học liệu thứ hai.",
    contents:
      "Thông tin đối tượng sử dụng và nội dung bộ học liệu sẽ được bổ sung sau khi có tài liệu sản phẩm.",
    icon: "🎨",
    background: "bg-[#f8ead9]",
  },
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[#fffdf8] text-[#243c32]">
      <header className="border-b border-green-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <Link
            href="/"
            className="text-3xl font-extrabold tracking-tight"
          >
            bloomie<span className="text-orange-400">.</span>
          </Link>

          <nav className="flex gap-6 text-sm font-medium">
            <Link href="/">Trang chủ</Link>
            <Link href="/san-pham" aria-current="page">
              Sản phẩm
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-sm font-bold tracking-widest text-green-700">
          KHÁM PHÁ BLOOMIE
        </p>

        <h1 className="mt-4 text-4xl font-extrabold">
          Các bộ học liệu
        </h1>

        <p className="mt-5 max-w-2xl leading-8 text-slate-600">
          Tìm hiểu thông tin bộ sản phẩm và nội dung học liệu đi kèm.
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Đây là danh mục minh họa để xây dựng giao diện.
          Sản phẩm chưa mở bán, chưa có giá và chưa nhận thanh toán.
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-3xl border border-green-100 bg-white"
            >
              <div
                className={`${product.background} flex h-56 items-center justify-center`}
              >
                <span className="text-7xl" aria-hidden="true">
                  {product.icon}
                </span>
              </div>

              <div className="p-7">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Sản phẩm minh họa
                </p>

                <h2 className="mt-3 text-2xl font-bold">
                  {product.name}
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  {product.description}
                </p>

                <p className="mt-5 font-semibold">
                  Giá bán: đang cập nhật
                </p>

                <details className="mt-6 border-t border-green-100 pt-5">
                  <summary className="cursor-pointer font-semibold text-green-800">
                    Xem thông tin bộ học liệu
                  </summary>
                  <p className="mt-4 leading-7 text-slate-600">
                    {product.contents}
                  </p>
                </details>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-[#e9f2df] p-8">
          <h2 className="text-xl font-bold">
            Video hướng dẫn đi kèm sản phẩm
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Sau khi mua, khách hàng đăng ký tài khoản và quét QR
            hoặc nhập mã trên sản phẩm để mở nội dung tương ứng.
            Chức năng kích hoạt đang được xây dựng.
          </p>
        </div>
      </main>

      <footer className="border-t border-green-100 px-6 py-8 text-center text-sm text-slate-500">
        Bloomie · Cùng học hỏi, cùng lớn lên.
      </footer>
    </div>
  );
}
