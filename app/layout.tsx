import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bloomie — Học liệu hỗ trợ phát triển",
  description:
    "Học liệu cho trẻ gặp khó khăn trong phát triển trí tuệ, giúp ba mẹ cùng con luyện tư duy, ngôn ngữ và vận động tinh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
