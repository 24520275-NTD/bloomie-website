import Image from "next/image";
const categories = [
  { icon: "📚", name: "Học liệu số", description: "Tài liệu giúp việc học dễ dàng hơn." },
  { icon: "🎬", name: "Video bài học", description: "Khám phá kiến thức qua từng bài học." },
  { icon: "🎨", name: "Hoạt động sáng tạo", description: "Khơi mở ý tưởng và niềm vui học tập." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fffdf8] font-sans text-[#243c32]">
      <header className="border-b border-green-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-6">
          <a href="/" className="text-3xl font-extrabold tracking-tight">
            bloomie<span className="text-orange-400">.</span>
          </a>
          <nav className="flex flex-wrap gap-6 text-sm font-medium">
            <a href="/san-pham">Khám phá học liệu</a>
            <a href="#cach-hoc">Cách bắt đầu</a>
            <a href="#gioi-thieu">Về Bloomie</a>
            <a href="/tai-khoan">Đăng nhập </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-widest text-green-700">
              Cùng học hỏi, cùng lớn lên
            </p>
            <h1 className="text-5xl font-extrabold leading-tight md:text-6xl">
              Ươm mầm tò mò.
              <br />
              Nở hoa tri thức.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Khám phá học liệu số, video và những hoạt động sáng tạo
              cùng Bloomie — để mỗi ngày học tập là một hành trình thú vị.
            </p>
            <a
              href="/san-pham"
              className="mt-8 inline-block rounded-full bg-[#286347] px-8 py-4 font-semibold text-white"
            >
              Khám phá ngay →
            </a>
          </div>
          <div className="rounded-[40px] bg-[#e9f2df] p-12 text-center">
            <div className="overflow-hidden rounded-[40px] bg-[#e9f2df] p-4">
  <Image
    src="/bloomie-banner.png"
    alt="Bloomie — Học cùng lớn khôn"
    width={1200}
    height={1200}
    sizes="(max-width: 767px) 100vw, 50vw"
    className="h-auto w-full rounded-3xl"
  />
</div>
            <p className="mt-8 text-3xl font-bold">Một chút học hỏi mỗi ngày</p>
            <p className="mt-4 leading-7 text-slate-600">
              Từ những điều nhỏ bé, nuôi dưỡng những ý tưởng lớn.
            </p>
            <div className="mt-8 flex justify-center gap-5 text-4xl" aria-hidden="true">
              <span>📖</span><span>🎨</span><span>💡</span>
            </div>
          </div>
        </section>

        <section id="kham-pha" className="mx-auto max-w-6xl px-6 py-14">
          <p className="font-semibold text-green-700">KHÁM PHÁ BLOOMIE</p>
          <h2 className="mt-3 text-3xl font-bold">Bạn muốn học điều gì hôm nay?</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {categories.map((category) => (
              <article key={category.name} className="rounded-3xl border border-green-100 bg-white p-8">
                <span className="text-4xl" aria-hidden="true">{category.icon}</span>
                <h3 className="mt-5 text-xl font-bold">{category.name}</h3>
                <p className="mt-3 leading-7 text-slate-600">{category.description}</p>
                <p className="mt-6 text-sm font-medium text-green-700">Nội dung đang được chuẩn bị</p>
              </article>
            ))}
          </div>
        </section>

        <section id="cach-hoc" className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-3xl font-bold">Hành trình học tập cùng Bloomie</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {["Khám phá học liệu phù hợp", "Lựa chọn nội dung yêu thích", "Học và thực hành mỗi ngày"].map((step, index) => (
              <div key={step} className="rounded-3xl bg-[#f5efdf] p-7">
                <p className="text-sm font-bold text-green-700">BƯỚC {index + 1}</p>
                <h3 className="mt-3 text-lg font-semibold">{step}</h3>
              </div>
            ))}
          </div>
        </section>

        <section id="gioi-thieu" className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[32px] bg-[#243c32] px-8 py-12 text-center text-white">
            <h2 className="text-3xl font-bold">Không gian cho tri thức nảy mầm</h2>
            <p className="mx-auto mt-5 max-w-2xl leading-8 text-green-100">
              Bloomie hướng đến việc kết nối học liệu số và những trải nghiệm
              học tập sáng tạo trong một không gian dễ khám phá.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-green-100 px-6 py-8 text-center text-sm text-slate-500">
        Bloomie · Bản giao diện đầu tiên đang được xây dựng.
      </footer>
    </div>
  );
}
