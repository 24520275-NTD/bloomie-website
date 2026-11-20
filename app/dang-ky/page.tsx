import type { Metadata } from "next";
import AccountForm from "../components/account-form";

export const metadata: Metadata = { title: "Đăng ký | Bloomie" };

export default function SignupPage() {
  return <AccountForm signup />;
}
