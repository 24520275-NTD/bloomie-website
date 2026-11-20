"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import AccountNav from "./account-nav";
import AddToCart from "./add-to-cart";
import type { Product } from "../lib/products";
import hero from "../../public/assets/bo-dung-cu-hoc-tap.png";

type IconName =
  | "arrow"
  | "bag"
  | "book"
  | "check"
  | "close"
  | "heart"
  | "menu"
  | "palette"
  | "pencil"
  | "shield"
  | "spark";

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    bag: (
      <>
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z" />
        <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23V5.5Z" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    palette: (
      <>
        <path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h3a6 6 0 0 0 0-12h-3Z" />
        <path d="M7.5 9h.01M9 5.5h.01M14 5.5h.01" />
      </>
    ),
    pencil: (
      <>
        <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
        <path d="m14 7 3 3" />
      </>
    ),
    shield: <path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z" />,
    spark: (
      <path d="m12 2 1.4 5.2L18 10l-4.6 2.8L12 18l-1.4-5.2L6 10l4.6-2.8L12 2ZM5 17l.6 2.4L8 20l-2.4.6L5 23l-.6-2.4L2 20l2.4-.6L5 17Z" />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const navigation = [
  ["Danh mục", "#danh-muc"],
  ["Sản phẩm", "#san-pham"],
  ["Vì sao chọn Bloomie", "#loi-ich"],
  ["Creator", "/creator/dang-ky"],
  ["Hỏi đáp", "#faq"],
] as const;

const faqs = [
  ["Xem thông tin từng bộ dụng cụ ở đâu?", "Mở trang Sản phẩm và chọn một bộ để xem hình ảnh, mô tả và thông tin giá hiện có."],
  ["Tôi xem giỏ hàng như thế nào?", "Bấm biểu tượng túi ở đầu trang để xem và thay đổi số lượng sản phẩm đã chọn."],
  ["Tôi có thể đăng ký làm Creator không?", "Mở mục Creator, đăng nhập rồi điền hồ sơ và tải minh chứng. Bạn có thể quay lại để xem trạng thái xét duyệt."],
];

const formatPrice = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function BloomieHome({ products, productError }: {
  products: Product[];
  productError: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const validIds = products.map(({ id }) => id);

  return (
    <div className="bloomie-home min-h-screen bg-[#fffdf8] text-[#1f3d33]">
      <header className="border-b border-[#1f3d33]/8 bg-[#fffdf8]/95">
        <div className="mx-auto flex min-h-18 max-w-[1200px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-3 md:min-h-20 md:px-8">
          <a
            href="#top"
            className="group rounded-md text-[25px] font-extrabold tracking-[-.04em] outline-none focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
            aria-label="Bloomie - Trang chủ"
          >
            bloomie
            <span className="text-[#f58220] transition-colors group-hover:text-[#d96d12]">.</span>
          </a>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Điều hướng chính">
            {navigation.map(([item, href]) => (
              <a
                key={item}
                href={href}
                className="rounded-sm py-2 text-sm font-medium text-[#324f45] outline-none transition hover:text-[#1e7d3a] focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <AccountNav />
            <Link
              href="/gio-hang"
              aria-label="Giỏ hàng"
              className="grid size-11 place-items-center rounded-full bg-[#245c45] text-white transition hover:bg-[#1c4b38] focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
            >
              <Icon name="bag" />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex size-11 items-center justify-center rounded-full text-[#245c45] outline-none transition hover:bg-[#e8f1dd] active:scale-95 focus-visible:ring-3 focus-visible:ring-[#f58220]/50 lg:hidden"
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={menuOpen}
            >
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            className="border-t border-[#1f3d33]/8 px-5 py-4 lg:hidden"
            aria-label="Điều hướng mobile"
          >
            {navigation.map(([item, href]) => (
              <a
                onClick={() => setMenuOpen(false)}
                key={item}
                href={href}
                className="block rounded-xl px-3 py-3 text-base font-medium outline-none transition hover:bg-[#e8f1dd] focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
              >
                {item}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[.95fr_1.05fr] lg:gap-18 lg:py-24">
          <div>
            <p className="mb-5 text-[13px] font-bold uppercase tracking-[.12em] text-[#1e7d3a]">
              Cùng học hỏi, cùng lớn lên
            </p>
            <h1 className="max-w-[650px] font-display text-[44px] leading-[1.1] font-bold tracking-[-.045em] text-[#1f3d33] sm:text-[54px] md:text-[64px] lg:text-[68px]">
              Khơi mở tò mò.
              <br />
              Nuôi lớn{" "}
              <span className="relative whitespace-nowrap">
                ước mơ
                <span className="absolute -bottom-1 left-0 h-2 w-full -rotate-1 rounded-full bg-[#f58220]/25" />
              </span>
              .
            </h1>
            <p className="mt-7 max-w-[600px] text-[17px] leading-[1.75] text-[#4a5568] md:text-lg">
              Những bộ dụng cụ học tập được tuyển chọn để mỗi giờ chơi là một hành trình khám phá
              đầy hứng thú và ý nghĩa.
            </p>
            <a
              href="#san-pham"
              className="mt-8 inline-flex min-h-13 items-center gap-3 rounded-full bg-[#245c45] px-7 text-[15px] font-semibold text-white outline-none transition hover:bg-[#1c4b38] hover:shadow-[0_10px_24px_rgba(36,92,69,.18)] active:translate-y-px active:bg-[#163d2e] focus-visible:ring-3 focus-visible:ring-[#f58220]/60 focus-visible:ring-offset-3"
            >
              Khám phá ngay{" "}
              <Icon
                name="arrow"
                className="size-5 transition-transform group-hover:translate-x-1"
              />
            </a>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#496259]">
              {["Khám phá học liệu", "Học qua trải nghiệm"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#e8f1dd] text-[#245c45]">
                    <Icon name="check" className="size-3.5" />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative rounded-[32px] bg-[#e8f1dd] p-4 pb-7 sm:rounded-[40px] sm:p-8 sm:pb-9">
            <div className="overflow-hidden rounded-[22px] bg-[#fffdf8] sm:rounded-[24px]">
              <Image
                src={hero}
                preload
                sizes="(max-width: 1023px) 90vw, 550px"
                alt="Bộ dụng cụ học tập với bảng màu, thẻ học, bút chì và khối gỗ"
                className="aspect-[3/2] h-full w-full object-cover"
              />
            </div>
            <div className="mt-6 flex items-end justify-between gap-4 px-1 sm:px-2">
              <div>
                <p className="font-display text-xl font-bold tracking-[-.02em] sm:text-2xl">
                  Mỗi ngày một khám phá
                </p>
                <p className="mt-1.5 text-sm leading-6 text-[#4a5568]">
                  Chơi vui, học thật, lớn lên tự tin.
                </p>
              </div>
              <div className="hidden gap-2 sm:flex">
                {[
                  ["book", "Sách"],
                  ["palette", "Màu sắc"],
                  ["spark", "Sáng tạo"],
                ].map(([icon, label]) => (
                  <span
                    key={label}
                    title={label}
                    className="flex size-11 items-center justify-center rounded-full bg-[#fffdf8] text-[#245c45]"
                  >
                    <Icon name={icon as IconName} />
                  </span>
                ))}
              </div>
            </div>
            <span className="absolute -right-2 top-10 flex size-12 rotate-6 items-center justify-center rounded-2xl bg-[#f58220] text-white shadow-lg sm:-right-4 sm:size-14">
              <Icon name="spark" className="size-6" />
            </span>
          </div>
        </section>

        <section
          id="danh-muc"
          className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-18 md:px-8 md:py-24"
        >
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-[13px] font-bold uppercase tracking-[.12em] text-[#1e7d3a]">
                Chọn theo sở thích
              </p>
              <h2 className="font-display text-[34px] leading-tight font-bold tracking-[-.035em] md:text-[40px]">
                Bé muốn khám phá gì?
              </h2>
            </div>
            <p className="max-w-md text-[16px] leading-7 text-[#4a5568]">
              Từ những nét vẽ đầu tiên đến các thí nghiệm nhỏ, luôn có một bộ phù hợp với trí tò mò
              của bé.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Sáng tạo mỹ thuật", "palette", "bg-[#f9ead8]"],
              ["Đọc và kể chuyện", "book", "bg-[#e8f1dd]"],
              ["Khám phá khoa học", "spark", "bg-[#e3eff0]"],
              ["Luyện viết mỗi ngày", "pencil", "bg-[#f4e9e3]"],
            ].map(([title, icon, color]) => (
              <a
                href="#san-pham"
                key={title}
                className={`${color} group flex min-h-52 flex-col justify-between rounded-[28px] p-6 outline-none transition hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(31,61,51,.09)] active:translate-y-0 focus-visible:ring-3 focus-visible:ring-[#f58220]/60`}
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-white/75 text-[#245c45] transition-transform group-hover:rotate-6">
                  <Icon name={icon as IconName} className="size-6" />
                </span>
                <span className="flex items-end justify-between gap-3">
                  <span className="font-display text-xl font-bold leading-7">{title}</span>
                  <Icon
                    name="arrow"
                    className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section id="san-pham" className="scroll-mt-20 bg-[#f6f4ec] py-18 md:py-24">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="mb-10 text-center">
              <p className="mb-3 text-[13px] font-bold uppercase tracking-[.12em] text-[#1e7d3a]">
                Danh mục Bloomie
              </p>
              <h2 className="font-display text-[34px] leading-tight font-bold tracking-[-.035em] md:text-[40px]">
                Bộ học tập nổi bật
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[16px] leading-7 text-[#4a5568]">
                Trọn bộ dụng cụ và hướng dẫn hoạt động, sẵn sàng để bé bắt đầu ngay khi mở hộp.
              </p>
            </div>
            {productError ? (
              <p role="alert" className="text-center">{productError}</p>
            ) : products.length === 0 ? (
              <p className="text-center">Danh mục đang được cập nhật.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {products.slice(0, 3).map((product) => (
                  <article key={product.id} className="flex flex-col rounded-[32px] bg-white p-3 shadow-sm">
                    <Link
                      href={`/san-pham/${encodeURIComponent(product.id)}`}
                      className="block overflow-hidden rounded-[24px] bg-[#e8f1dd]"
                    >
                      {product.image?.startsWith("/") && !product.image.startsWith("//") && (
                        <div className="relative aspect-[4/3]">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 767px) 90vw, 33vw"
                            className="object-contain p-3"
                          />
                        </div>
                      )}
                      <h3 className="p-4 font-display text-xl font-bold">{product.name}</h3>
                    </Link>
                    <div className="flex flex-1 flex-col justify-between px-4 py-3">
                      <p className="font-semibold">
                        {product.price_vnd === null
                          ? "Giá đang cập nhật"
                          : formatPrice.format(product.price_vnd)}
                      </p>
                      <AddToCart productId={product.id} validIds={validIds} compact />
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="mt-8 text-center">
              <Link href="/san-pham" className="font-bold text-[#245c45] underline underline-offset-4">
                Xem tất cả sản phẩm
              </Link>
            </div>
          </div>
        </section>

        <section
          id="loi-ich"
          className="mx-auto grid max-w-[1200px] scroll-mt-20 gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20"
        >
          <div className="relative min-h-[440px] overflow-hidden rounded-[36px] bg-[#245c45] p-8 text-white sm:p-10">
            <span className="absolute -right-20 -top-20 size-64 rounded-full border-[45px] border-white/7" />
            <span className="absolute -bottom-16 -left-16 size-48 rounded-full bg-[#f58220]/90" />
            <div className="relative">
              <p className="text-[13px] font-bold uppercase tracking-[.12em] text-[#cfe3bc]">
                Học bằng trải nghiệm
              </p>
              <h2 className="mt-4 max-w-sm font-display text-[34px] leading-[1.18] font-bold tracking-[-.035em] md:text-[40px]">
                Không chỉ là dụng cụ học tập.
              </h2>
              <p className="mt-5 max-w-md text-[16px] leading-7 text-white/75">
                Đó là những khoảnh khắc cả nhà cùng làm, cùng hỏi và cùng vui khi tìm ra câu trả
                lời.
              </p>
            </div>
            <div className="absolute bottom-8 right-8 flex size-24 items-center justify-center rounded-full bg-[#fffdf8] text-[#245c45] sm:bottom-10 sm:right-10 sm:size-28">
              <Icon name="heart" className="size-11" />
            </div>
          </div>
          <div>
            <p className="mb-3 text-[13px] font-bold uppercase tracking-[.12em] text-[#1e7d3a]">
              Vì sao chọn Bloomie
            </p>
            <h2 className="font-display text-[34px] leading-tight font-bold tracking-[-.035em] md:text-[40px]">
              Để bé tự tin khám phá theo cách riêng
            </h2>
            <div className="mt-8 divide-y divide-[#1f3d33]/10">
              {[
                [
                  "shield",
                  "Cùng bé khám phá",
                  "Cùng chọn một hoạt động phù hợp với sở thích của bé.",
                ],
                [
                  "spark",
                  "Khơi gợi tư duy chủ động",
                  "Hoạt động mở giúp bé quan sát, thử nghiệm và tự tìm ra cách giải quyết.",
                ],
                [
                  "book",
                  "Dễ dàng đồng hành cùng bé",
                  "Ba mẹ có thể cùng bé quan sát, đặt câu hỏi và thử những cách làm mới.",
                ],
              ].map(([icon, title, text]) => (
                <div key={title} className="grid grid-cols-[52px_1fr] gap-4 py-6 first:pt-0">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f1dd] text-[#245c45]">
                    <Icon name={icon as IconName} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold">{title}</h3>
                    <p className="mt-1.5 text-[15px] leading-6 text-[#4a5568]">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#e8f1dd] px-5 py-16 text-center md:py-20">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Cộng tác cùng Bloomie</h2>
          <p className="mx-auto mt-4 max-w-xl leading-7">
            Bạn sáng tạo nội dung về học tập và trải nghiệm cho trẻ? Gửi hồ sơ để Bloomie xem xét cơ hội hợp tác.
          </p>
          <Link
            href="/creator/dang-ky"
            className="mt-6 inline-flex rounded-full bg-[#245c45] px-6 py-3 font-semibold text-white"
          >
            Hồ sơ Creator
          </Link>
        </section>

        <section
          id="faq"
          className="mx-auto grid max-w-[1040px] scroll-mt-20 gap-10 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[.7fr_1.3fr] lg:gap-20"
        >
          <div>
            <p className="mb-3 text-[13px] font-bold uppercase tracking-[.12em] text-[#1e7d3a]">
              Hỏi đáp
            </p>
            <h2 className="font-display text-[34px] leading-tight font-bold tracking-[-.035em] md:text-[40px]">
              Bạn đang băn khoăn?
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-[#4a5568]">
              Bloomie luôn sẵn lòng giúp bạn chọn món quà học tập phù hợp nhất cho bé.
            </p>
          </div>
          <div className="border-t border-[#1f3d33]/12">
            {faqs.map(([question, answer], index) => {
              const isOpen = openFaq === index;
              return (
                <div key={question} className="border-b border-[#1f3d33]/12">
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex min-h-18 w-full items-center justify-between gap-6 py-5 text-left font-display text-lg font-bold outline-none transition hover:text-[#1e7d3a] focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[#f58220]/50"
                    aria-expanded={isOpen}
                  >
                    {question}
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8f1dd] text-[#245c45] transition-transform ${isOpen ? "rotate-45" : ""}`}
                    >
                      <span className="text-2xl leading-none font-light">+</span>
                    </span>
                  </button>
                  {isOpen && (
                    <p className="max-w-2xl pb-6 pr-12 text-[15px] leading-7 text-[#4a5568]">
                      {answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-20 md:px-8 md:pb-28">
          <div className="relative overflow-hidden rounded-[36px] bg-[#245c45] px-6 py-14 text-center text-white sm:px-12 sm:py-16 md:rounded-[40px]">
            <span className="absolute -left-14 -top-14 size-40 rounded-full border-[30px] border-white/6" />
            <span className="absolute -bottom-20 -right-10 size-56 rounded-full bg-[#f58220]/15" />
            <div className="relative">
              <p className="text-[13px] font-bold uppercase tracking-[.12em] text-[#d6e8c5]">
                Sẵn sàng cùng bé bắt đầu?
              </p>
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-[34px] leading-tight font-bold tracking-[-.035em] md:text-[44px]">
                Mở hộp nhỏ, mở ra cả thế giới diệu kỳ.
              </h2>
              <a
                href="#san-pham"
                className="mt-7 inline-flex min-h-13 items-center gap-3 rounded-full bg-[#fffdf8] px-7 text-[15px] font-bold text-[#245c45] outline-none transition hover:bg-[#f5f0e3] hover:shadow-xl active:translate-y-px focus-visible:ring-3 focus-visible:ring-[#f58220] focus-visible:ring-offset-3 focus-visible:ring-offset-[#245c45]"
              >
                Chọn bộ cho bé <Icon name="arrow" className="size-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1f3d33]/10">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a
              href="#top"
              className="rounded-md font-display text-2xl font-extrabold tracking-[-.04em] outline-none focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
            >
              bloomie<span className="text-[#f58220]">.</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#4a5568]">
              Dụng cụ học tập giúp bé khám phá thế giới bằng đôi tay và trí tò mò của chính mình.
            </p>
          </div>
          {([
            ["Khám phá", [["Danh mục", "#danh-muc"], ["Sản phẩm", "/san-pham"]]],
            ["Tài khoản", [["Thông tin tài khoản", "/tai-khoan"], ["Giỏ hàng", "/gio-hang"]]],
            ["Cộng tác", [["Hồ sơ Creator", "/creator/dang-ky"], ["Hỏi đáp", "#faq"]]],
          ] as const).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-display font-bold">{heading}</h3>
              <ul className="mt-4 space-y-3">
                {links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-[#4a5568] hover:underline">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 border-t border-[#1f3d33]/8 px-5 py-5 text-xs text-[#68736f] sm:flex-row sm:justify-between md:px-8">
          <p>© Bloomie</p>
          <p>Thiết kế với sự tận tâm dành cho trẻ em Việt.</p>
        </div>
      </footer>
    </div>
  );
}
