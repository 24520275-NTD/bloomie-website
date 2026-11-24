import type { Metadata } from "next";
import { getProducts } from "../lib/products";
import AccountDashboard from "./account-dashboard";

export const metadata: Metadata = { title: "Tài khoản | Bloomie" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string | string[] }>;
}) {
  const [{ confirmation }, { products }] = await Promise.all([
    searchParams,
    getProducts(),
  ]);

  const productImages = Object.fromEntries(
    products.map(({ id, image }) => [id, image]),
  );

  return (
    <AccountDashboard
      confirmationFailed={confirmation === "failed"}
      productImages={productImages}
    />
  );
}