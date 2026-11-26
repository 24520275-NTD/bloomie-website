"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import AccountNav from "./account-nav";
import { Icon } from "./bloomie-icon";
import { useCart } from "../lib/cart";
import "../home.css";

const navigation = [
  ["Danh mục", "#danh-muc"],
  ["Sản phẩm", "#san-pham"],
  ["Vì sao chọn Bloomie", "#loi-ich"],
  ["Hỏi đáp", "#faq"],
  ["Học liệu", "/hoc-lieu"],
  ["Creator", "/creator/dang-ky"],
] as const;

export default function Storefront({
  children,
  home = false,
  productIds,
}: {
  children: ReactNode;
  home?: boolean;
  productIds?: string[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const showHeader = pathname !== "/dang-nhap" && pathname !== "/dang-ky";
  const { cart } = useCart();
  const count = (productIds ?? Object.keys(cart)).reduce(
    (total, id) => total + (cart[id] ?? 0),
    0,
  );
  function homeLink(href: string) {
    if (home || !href.startsWith("#")) return href;
    return href === "#san-pham" ? "/san-pham" : "/" + href;
  }

  return (
    <div className="bloomie-storefront flex min-h-screen flex-col bg-[#fffdf8] text-[#1f3d33]">
      {showHeader && (
        <header className="border-b border-[#1f3d33]/8 bg-[#fffdf8]/95">
          <div className="flex min-h-18 w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-3 md:min-h-20 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <a
              href={home ? "#top" : "/"}
              className="group rounded-md text-[25px] font-extrabold tracking-[-.04em] outline-none focus-visible:ring-3 focus-visible:ring-[#f58220]/50 lg:justify-self-center"
              aria-label="Bloomie - Trang chủ"
            >
              bloomie
              <span className="text-[#f58220] transition-colors group-hover:text-[#d96d12]">
                .
              </span>
            </a>
            <nav
              className="hidden items-center gap-4 lg:flex xl:gap-8"
              aria-label="Điều hướng chính"
            >
              {navigation.map(([item, href]) => (
                <Link
                  key={item}
                  href={homeLink(href)}
                  aria-current={
                    !home && pathname === homeLink(href) ? "page" : undefined
                  }
                  className="rounded-sm py-2 text-lg font-bold whitespace-nowrap text-[#346b56] outline-none transition-colors decoration-2 underline-offset-[6px] hover:text-[#245c45] hover:underline focus-visible:ring-3 focus-visible:ring-[#f58220]/50 xl:text-xl"
                >
                  {item}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 lg:justify-self-center lg:gap-6">
              <Link
                href="/gio-hang"
                aria-current={pathname === "/gio-hang" ? "page" : undefined}
                aria-label={count ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
                className="relative grid size-11 place-items-center rounded-full text-[#245c45] transition-colors hover:bg-[#e8f1dd] focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
              >
                <Icon name="bag" className="size-9" />
                {count > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 right-0 grid h-5 min-w-5 place-items-center rounded-full bg-[#f58220] px-1 text-xs font-bold text-white ring-2 ring-[#fffdf8]"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
              <AccountNav />
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
                <Link
                  onClick={() => setMenuOpen(false)}
                  key={item}
                  href={homeLink(href)}
                  className="block rounded-xl px-3 py-3 text-base font-medium outline-none transition hover:bg-[#e8f1dd] focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
                >
                  {item}
                </Link>
              ))}
            </nav>
          )}
        </header>
      )}
      {children}
      <footer className="mt-auto rounded-t-[40px] bg-[#e8f1dd] pt-20 pb-8">
        <div className="mx-auto w-full max-w-[1200px] px-5 md:px-8">
          <div className="grid items-start gap-8 sm:grid-cols-3 lg:grid-cols-12 lg:gap-x-12">
            <div className="sm:col-span-3 lg:col-span-5">
              <a
                href={home ? "#top" : "/"}
                className="rounded-md font-display text-2xl font-extrabold tracking-[-.04em] outline-none focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
              >
                bloomie<span className="text-[#f58220]">.</span>
              </a>
              <p className="mt-4 max-w-[360px] text-base leading-[1.6] text-[#4a5568]">
                Học liệu cho trẻ gặp khó khăn trong phát triển trí tuệ, để ba mẹ
                cùng con luyện từng kỹ năng theo nhịp của mình.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  {
                    label: "Facebook",
                    href: "https://www.facebook.com/",
                    path: "M14 21v-8h3l.5-3H14V8c0-.9.3-1.5 1.6-1.5H18V3.8a17 17 0 0 0-2.4-.2C13 3.6 11 5.2 11 8v2H8v3h3v8h3Z",
                  },
                  {
                    label: "TikTok",
                    href: "https://www.tiktok.com/",
                    path: "M14 3h3a4 4 0 0 0 4 4v3a7 7 0 0 1-4-1.3V16a5 5 0 1 1-5-5v3a2 2 0 1 0 2 2V3Z",
                  },
                  {
                    label: "YouTube",
                    href: "https://www.youtube.com/",
                    path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15v-6l5.2 3-5.2 3Z",
                  },
                ].map(({ label, href, path }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="grid size-11 place-items-center rounded-full bg-white text-[#245c45] transition-colors hover:bg-[#f4f8ed]"
                  >
                    <svg
                      aria-hidden="true"
                      className="size-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d={path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            {(
              [
                [
                  "Khám phá",
                  [
                    ["Danh mục", "#danh-muc"],
                    ["Sản phẩm", "/san-pham"],
                  ],
                ],
                [
                  "Tài khoản",
                  [
                    ["Thông tin tài khoản", "/tai-khoan"],
                    ["Giỏ hàng", "/gio-hang"],
                  ],
                ],
                [
                  "Cộng tác",
                  [
                    ["Hồ sơ Creator", "/creator/dang-ky"],
                    ["Hỏi đáp", "#faq"],
                  ],
                ],
              ] as const
            ).map(([heading, links]) => (
              <div
                key={heading}
                className="min-w-0 lg:col-span-2 lg:last:col-span-3"
              >
                <h3 className="font-display text-lg font-bold text-[#1f3d33]">
                  {heading}
                </h3>
                <ul className="mt-6 space-y-4">
                  {links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={homeLink(href)}
                        className="block text-base leading-[1.6] text-[#4a5568] no-underline transition-colors hover:text-[#245c45]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-2 border-t border-[#1f3d33]/12 pt-6 text-sm text-[#4a5568] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p>© 2026 Bloomie</p>
            <p>Thiết kế với sự tận tâm dành cho trẻ em Việt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
