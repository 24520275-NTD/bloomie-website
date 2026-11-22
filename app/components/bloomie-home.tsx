"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "./bloomie-icon";
import Storefront from "./storefront";
import AddToCart from "./add-to-cart";
import type { Product } from "../lib/products";
import hero from "../../public/assets/bo-dung-cu-hoc-tap.png";

const faqs = [
  [
    "Xem thông tin từng bộ dụng cụ ở đâu?",
    "Mở trang Sản phẩm và chọn một bộ để xem hình ảnh, mô tả và thông tin giá hiện có.",
  ],
  [
    "Tôi xem giỏ hàng như thế nào?",
    "Bấm biểu tượng túi ở đầu trang để xem và thay đổi số lượng sản phẩm đã chọn.",
  ],
  [
    "Tôi có thể đăng ký làm Creator không?",
    "Mở mục Creator, đăng nhập rồi điền hồ sơ và tải minh chứng. Bạn có thể quay lại để xem trạng thái xét duyệt.",
  ],
];

const formatPrice = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function BloomieHome({
  products,
  productError,
}: {
  products: Product[];
  productError: string | null;
}) {
  const [openFaq, setOpenFaq] = useState(0);

  const validIds = products.map(({ id }) => id);

  return (
    <Storefront home productIds={productError ? undefined : validIds}>
      <main id="top">
        <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[.95fr_1.05fr] lg:gap-18 lg:py-24">
          <div className="min-w-0 [container-type:inline-size]">
            <p className="mb-5 text-[13px] font-bold uppercase tracking-[.12em] text-[#1e7d3a]">
              Cùng học hỏi, cùng lớn lên
            </p>
            <h1 className="max-w-[650px] font-display text-[length:min(68px,12cqi)] leading-[1.1] font-bold tracking-[-.045em] text-[#1f3d33]">
              <span className="block whitespace-nowrap">Khơi mở tò mò.</span>
              <span className="block whitespace-nowrap">
                Nuôi lớn{" "}
                <span className="relative">
                  ước mơ
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-2 w-full -rotate-1 rounded-full bg-[#f58220]/25"
                  />
                </span>
                .
              </span>
            </h1>
            <p className="mt-7 max-w-[600px] text-[17px] leading-[1.75] text-[#4a5568] md:text-lg">
              Những bộ dụng cụ học tập được tuyển chọn để mỗi giờ chơi là một
              hành trình khám phá đầy hứng thú và ý nghĩa.
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
              Từ những nét vẽ đầu tiên đến các thí nghiệm nhỏ, luôn có một bộ
              phù hợp với trí tò mò của bé.
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
                  <span className="font-display text-xl font-bold leading-7">
                    {title}
                  </span>
                  <Icon
                    name="arrow"
                    className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section
          id="san-pham"
          className="scroll-mt-20 bg-[#f6f4ec] py-18 md:py-24"
        >
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="mb-10 text-center">
              <p className="mb-3 text-[13px] font-bold uppercase tracking-[.12em] text-[#1e7d3a]">
                Danh mục Bloomie
              </p>
              <h2 className="font-display text-[34px] leading-tight font-bold tracking-[-.035em] md:text-[40px]">
                Bộ học tập nổi bật
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[16px] leading-7 text-[#4a5568]">
                Trọn bộ dụng cụ và hướng dẫn hoạt động, sẵn sàng để bé bắt đầu
                ngay khi mở hộp.
              </p>
            </div>
            {productError ? (
              <p role="alert" className="text-center">
                {productError}
              </p>
            ) : products.length === 0 ? (
              <p className="text-center">Danh mục đang được cập nhật.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {products.slice(0, 3).map((product) => (
                  <article
                    key={product.id}
                    className="flex flex-col rounded-[32px] bg-white p-3 shadow-sm"
                  >
                    <Link
                      href={`/san-pham/${encodeURIComponent(product.id)}`}
                      className="block overflow-hidden rounded-[24px] bg-[#e8f1dd]"
                    >
                      {product.image?.startsWith("/") &&
                        !product.image.startsWith("//") && (
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
                      <h3 className="p-4 font-display text-xl font-bold">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex flex-1 flex-col justify-between px-4 py-3">
                      <p className="font-semibold">
                        {product.price_vnd === null
                          ? "Giá đang cập nhật"
                          : formatPrice.format(product.price_vnd)}
                      </p>
                      <AddToCart productId={product.id} compact />
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="mt-8 text-center">
              <Link
                href="/san-pham"
                className="font-bold text-[#245c45] underline underline-offset-4"
              >
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
                Đó là những khoảnh khắc cả nhà cùng làm, cùng hỏi và cùng vui
                khi tìm ra câu trả lời.
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
                <div
                  key={title}
                  className="grid grid-cols-[52px_1fr] gap-4 py-6 first:pt-0"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f1dd] text-[#245c45]">
                    <Icon name={icon as IconName} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold">{title}</h3>
                    <p className="mt-1.5 text-[15px] leading-6 text-[#4a5568]">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#e8f1dd] px-5 py-16 text-center md:py-20">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Cộng tác cùng Bloomie
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7">
            Bạn sáng tạo nội dung về học tập và trải nghiệm cho trẻ? Gửi hồ sơ
            để Bloomie xem xét cơ hội hợp tác.
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
              Bloomie luôn sẵn lòng giúp bạn chọn món quà học tập phù hợp nhất
              cho bé.
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
                      <span className="text-2xl leading-none font-light">
                        +
                      </span>
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
    </Storefront>
  );
}
