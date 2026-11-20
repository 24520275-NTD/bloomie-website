import type { Metadata } from "next";
import AccountForm from "../components/account-form";

export const metadata: Metadata = { title: "Tài khoản | Bloomie" };

export default async function AccountPage({ searchParams }: {
  searchParams: Promise<{ confirmation?: string | string[] }>;
}) {
  const { confirmation } = await searchParams;
  return <AccountForm confirmationFailed={confirmation === "failed"} />;
}
