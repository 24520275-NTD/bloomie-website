import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bloomie — Dụng cụ học tập",
  description: "Khám phá học liệu và hoạt động sáng tạo cùng Bloomie.",
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
