import type { Metadata } from "next";
import AccountForm from "../components/account-form";

export const metadata: Metadata = { title: "Đăng nhập | Bloomie" };

export default function LoginPage() {
  return <AccountForm />;
}
