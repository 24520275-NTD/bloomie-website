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
          <div className="mx-auto flex min-h-18 max-w-[1200px] flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-3 md:min-h-20 md:px-8">
            <a
              href={home ? "#top" : "/"}
              className="group rounded-md text-[25px] font-extrabold tracking-[-.04em] outline-none focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
              aria-label="Bloomie - Trang chủ"
            >
              bloomie
              <span className="text-[#f58220] transition-colors group-hover:text-[#d96d12]">
                .
              </span>
            </a>
            <nav
              className="hidden items-center gap-8 lg:flex"
              aria-label="Điều hướng chính"
            >
              {navigation.map(([item, href]) => (
                <Link
                  key={item}
                  href={homeLink(href)}
                  aria-current={
                    !home && pathname === homeLink(href) ? "page" : undefined
                  }
                  className="rounded-sm py-2 text-sm font-medium text-[#324f45] outline-none transition hover:text-[#1e7d3a] focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
                >
                  {item}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <AccountNav />
              <Link
                href="/gio-hang"
                aria-current={pathname === "/gio-hang" ? "page" : undefined}
                aria-label={count ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
                className="relative grid size-11 place-items-center rounded-full bg-[#245c45] text-white transition hover:bg-[#1c4b38] focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
              >
                <Icon name="bag" />
                {count > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#ffb775] px-1 text-[10px] font-extrabold text-[#1f3d33]"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
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
      <footer className="mt-auto border-t border-[#1f3d33]/10">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a
              href={home ? "#top" : "/"}
              className="rounded-md font-display text-2xl font-extrabold tracking-[-.04em] outline-none focus-visible:ring-3 focus-visible:ring-[#f58220]/50"
            >
              bloomie<span className="text-[#f58220]">.</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#4a5568]">
              Dụng cụ học tập giúp bé khám phá thế giới bằng đôi tay và trí tò
              mò của chính mình.
            </p>
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
            <div key={heading}>
              <h3 className="font-display font-bold">{heading}</h3>
              <ul className="mt-4 space-y-3">
                {links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={homeLink(href)}
                      className="text-sm text-[#4a5568] hover:underline"
                    >
                      {label}
                    </Link>
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
