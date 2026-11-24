"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AccountForm from "../components/account-form";
import { Icon } from "../components/bloomie-icon";
import Storefront from "../components/storefront";
import { useCart } from "../lib/cart";
import { createClient, hasSupabaseConfig } from "../lib/supabase-browser";

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_vnd: number;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  order_items: {
    product_id: string;
    product_name: string;
    quantity: number;
  }[];
};

type OrderResult = {
  userId: string;
  orders: Order[];
  total: number | null;
  pending: number | null;
  failed: boolean;
};

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

const statusLabels: Record<string, string> = {
  pending_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  paid_simulated: "Đã thanh toán giả lập",
  cancelled: "Đã hủy",
};

const card = "rounded-[28px] border border-[#e2eadc] bg-white p-5 shadow-sm";

export default function AccountDashboard({
  confirmationFailed,
  productImages,
}: {
  confirmationFailed: boolean;
  productImages: Record<string, string>;
}) {
  const [supabase] = useState(() =>
    hasSupabaseConfig ? createClient() : null,
  );
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const { cart, ownerId, ready, storageUnavailable } = useCart();
  const userId = user?.id;

  useEffect(() => {
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;

    async function loadOrders() {
      try {
        const [recent, pending] = await Promise.all([
          supabase!.from("orders")
            .select(
              "id,created_at,status,total_vnd,recipient_name,recipient_phone,shipping_address,order_items(product_id,product_name,quantity)",
              { count: "exact" },
            )
            .eq("user_id", userId!)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase!.from("orders")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId!)
            .eq("status", "pending_payment"),
        ]);

        if (!active) return;
        if (recent.error) throw recent.error;

        setResult({
          userId: userId!,
          orders: (recent.data ?? []) as Order[],
          total: recent.count,
          pending: pending.error ? null : pending.count,
          failed: false,
        });
      } catch {
        if (active) {
          setResult({
            userId: userId!,
            orders: [],
            total: null,
            pending: null,
            failed: true,
          });
        }
      }
    }

    void loadOrders();
    return () => { active = false; };
  }, [supabase, userId]);

  async function signOut() {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      setResult(null);
      setUser(null);
    } catch {
      setMessage("Chưa đăng xuất được. Bạn thử lại nhé.");
    } finally {
      setSigningOut(false);
    }
  }

  if (!authReady) {
    return (
      <Storefront>
        <main className="mx-auto w-full max-w-[1200px] px-5 py-10">
          <p role="status">Đang tải tài khoản…</p>
        </main>
      </Storefront>
    );
  }

  if (!user) return <AccountForm confirmationFailed={confirmationFailed} />;

  const name = user.user_metadata.full_name;
  const displayName =
    (typeof name === "string" && name.trim()) ||
    user.email?.split("@")[0] ||
    "bạn";

  const accountOrders = result?.userId === user.id ? result : null;
  const latestOrder = accountOrders?.orders[0];
  const cartCount =
    ready && !storageUnavailable && ownerId === user.id
      ? Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
      : null;

  const stats = [
    { label: "Chờ thanh toán", value: accountOrders?.pending, icon: "bag" },
    { label: "Tổng đơn hàng", value: accountOrders?.total, icon: "book" },
    { label: "Sản phẩm trong giỏ", value: cartCount, icon: "check" },
  ] as const;

  return (
    <Storefront>
      <main className="mx-auto w-full max-w-[1200px] px-5 py-8 md:px-8 md:py-12">
        <header>
          <p className="inline-flex rounded-full bg-[#e8f1dd] px-3 py-1 text-xs font-bold text-[#245c45]">
            TÀI KHOẢN CỦA TÔI
          </p>
          <h1 className="mt-3 wrap-break-word text-3xl font-bold tracking-tight sm:text-4xl">
            Xin chào, {displayName}
          </h1>
          <p className="mt-2 text-sm text-[#52645a]">
            Xem đơn hàng, giỏ hàng và thông tin tài khoản Bloomie.
          </p>
        </header>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="rounded-[28px] bg-[#e8f1dd] p-6 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#245c45] text-2xl font-bold text-white">
                {displayName.charAt(0).toLocaleUpperCase("vi")}
              </div>
              <p className="mt-3 wrap-break-word font-bold">{displayName}</p>
              <p className="mt-1 break-all text-sm text-[#52645a]">{user.email}</p>
            </section>

            <nav aria-label="Menu tài khoản" className={card}>
              <a href="#don-hang" className="block rounded-xl bg-[#e8f1dd] px-3 py-2.5 text-sm font-semibold text-[#245c45]">
                Đơn hàng của tôi
              </a>
              <Link href="/gio-hang" className="mt-1 block rounded-xl px-3 py-2.5 text-sm hover:bg-[#f0f6eb]">
                Giỏ hàng
              </Link>
              <Link href="/creator/dang-ky" className="mt-1 block rounded-xl px-3 py-2.5 text-sm hover:bg-[#f0f6eb]">
                Hồ sơ Creator
              </Link>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="mt-4 w-full rounded-full border border-[#efd8d5] px-4 py-2 text-sm font-semibold text-[#a32a26] hover:bg-red-50 disabled:opacity-60"
              >
                {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
              </button>
              {message && <p role="alert" className="mt-2 text-sm">{message}</p>}
            </nav>
          </aside>

          <div className="min-w-0 space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map(({ label, value, icon }) => (
                <div key={label} className={card}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#52645a]">{label}</p>
                    <span className="rounded-full bg-[#e8f1dd] p-2 text-[#245c45]">
                      <Icon name={icon} className="size-4" />
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold">{value ?? "—"}</p>
                </div>
              ))}
            </div>

            <section id="don-hang" className="scroll-mt-6">
              <h2 className="mb-3 text-xl font-bold">Đơn hàng gần đây</h2>

              {!accountOrders && <p role="status">Đang tải đơn hàng…</p>}
              {accountOrders?.failed && (
                <p role="alert" className={card}>Chưa tải được đơn hàng. Hãy tải lại trang.</p>
              )}
              {accountOrders && !accountOrders.failed && accountOrders.orders.length === 0 && (
                <div className={card}>
                  <p>Bạn chưa có đơn hàng.</p>
                  <Link href="/san-pham" className="mt-2 inline-block font-semibold text-[#245c45] underline">
                    Khám phá sản phẩm
                  </Link>
                </div>
              )}

              <div className="space-y-3">
                {accountOrders?.orders.map((order) => (
                  <article key={order.id} className={card}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2eadc] pb-3 text-sm">
                      <p>
                        <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                        <span className="ml-2 text-xs text-[#52645a]">
                          {dateTime.format(new Date(order.created_at))}
                        </span>
                      </p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.status === "pending_payment"
                          ? "bg-[#fff2cd] text-[#774c13]"
                          : "bg-[#edf4e7] text-[#245c45]"
                      }`}>
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </div>

                    <ul className="divide-y divide-[#e2eadc]">
                      {order.order_items.map((item) => (
                        <li key={item.product_id} className="flex items-center gap-3 py-3">
                          <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f0f6eb] text-[#245c45]">
                            {productImages[item.product_id] ? (
                              <Image src={productImages[item.product_id]} alt="" fill sizes="48px" className="object-contain p-1" />
                            ) : (
                              <Icon name="book" className="size-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="wrap-break-word text-sm font-semibold">{item.product_name}</p>
                            <p className="text-xs text-[#52645a]">Số lượng: {item.quantity}</p>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2eadc] pt-3">
                      <p className="text-sm">
                        Tổng tiền <strong className="ml-1 text-lg">{money.format(order.total_vnd)}</strong>
                      </p>
                      <Link href={`/don-hang/${order.id}`} className="rounded-full bg-[#245c45] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c4b38]">
                        {order.status === "pending_payment"
                          ? "Thanh toán bằng ví giả lập →"
                          : "Xem chi tiết đơn →"}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <section className={card}>
                <h2 className="font-bold">Địa chỉ giao gần nhất</h2>
                {latestOrder ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-semibold">{latestOrder.recipient_name}</p>
                    <p>{latestOrder.recipient_phone}</p>
                    <p className="wrap-break-word text-[#52645a]">{latestOrder.shipping_address}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#52645a]">
                    {accountOrders?.failed
                      ? "Chưa tải được địa chỉ."
                      : accountOrders
                        ? "Chưa có địa chỉ từ đơn hàng."
                        : "Đang tải địa chỉ…"}
                  </p>
                )}
              </section>

              <section className="rounded-[28px] bg-[#e8f1dd] p-5">
                <h2 className="font-bold">Chương trình Bloomie Creator</h2>
                <p className="mt-2 text-sm leading-6 text-[#52645a]">
                  Đăng ký hợp tác hoặc xem tiến độ hồ sơ Creator của bạn.
                </p>
                <Link href="/creator/dang-ky" className="mt-4 inline-block rounded-full bg-[#245c45] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c4b38]">
                  Mở hồ sơ Creator →
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
    </Storefront>
  );
}