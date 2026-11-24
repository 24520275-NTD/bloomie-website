"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bell, Heart, MapPin, Package, Settings, ShoppingBag, Sparkles, Star, UserRound, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import AccountForm from "../components/account-form";
import Storefront from "../components/storefront";
import { useCart } from "../lib/cart";
import { createClient, hasSupabaseConfig } from "../lib/supabase-browser";

import { AccountSidebar, AddressCard, CreatorCard, StatCard, type MenuItemData } from "./AccountPanels";
import OrderCard, { type Order } from "./OrderCard";
import "../home.css";
import "./account-dashboard.css";

const ordersPerPage = 5;
const creator = {
  title: "Chương trình Bloomie Creator",
  description: "Đăng ký hợp tác hoặc xem tiến độ xét duyệt hồ sơ Creator của bạn.",
};
type Dialog = { title: string; description?: string; edit?: boolean; orderId?: string; userId: string };

type OrderResult = {
  userId: string;
  orders: Order[];
  total: number | null;
  pending: number | null;
  failed: boolean;
  page: number;
};

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
  const [orderPage, setOrderPage] = useState(0);
  const [allOrders, setAllOrders] = useState(false);
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const accountDialog = dialog?.userId === userId ? dialog : null;

  useEffect(() => {
    const element = dialogRef.current;
    if (accountDialog && element && !element.open) element.showModal();
    if (!accountDialog && element?.open) element.close();
  }, [accountDialog]);

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
    const offset = orderPage * ordersPerPage;

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
            .order("id", { ascending: false })
            .range(offset, offset + ordersPerPage - 1),
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
          page: orderPage,
        });
      } catch {
        if (active) {
          setResult({
            userId: userId!,
            orders: [],
            total: null,
            pending: null,
            failed: true,
            page: orderPage,
          });
        }
      }
    }

    void loadOrders();
    return () => { active = false; };
  }, [supabase, userId, orderPage]);

  async function signOut() {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      setResult(null);
      setOrderPage(0);
      setAllOrders(false);
      setNotice("");
      setDialog(null);
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

  const accountOrders = result?.userId === user.id && result.page === orderPage ? result : null;
  const latestOrder = orderPage === 0 ? accountOrders?.orders[0] : null;
  const cartCount = ready && !storageUnavailable && ownerId === user.id
    ? Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
    : null;
  const pending = accountOrders?.pending ?? null;
  const total = accountOrders?.total ?? null;
  const stats = [
    { label: "ĐANG XỬ LÝ", value: pending, description: pending === null ? "Đơn chờ thanh toán" : `${pending} đơn chờ thanh toán`, icon: Package },
    { label: "YÊU THÍCH", value: null, description: "Chưa có dữ liệu", icon: Heart },
    { label: "ĐIỂM BLOOMIE", value: null, description: "Chưa có dữ liệu", icon: Star },
  ];
  const menu: { label: string; items: MenuItemData[] }[] = [
    { label: "MUA SẮM", items: [
      { id: "don-hang", label: "Đơn hàng của tôi", icon: Package },
      { label: "Yêu thích", icon: Heart },
      { href: "/gio-hang", label: "Giỏ hàng", icon: ShoppingBag, detail: cartCount === null ? undefined : `${cartCount} món` },
    ] },
    { label: "TÀI KHOẢN", items: [
      { id: "thong-tin", label: "Thông tin cá nhân", icon: UserRound },
      { id: "dia-chi", label: "Địa chỉ giao hàng", icon: MapPin },
      { label: "Thông báo", icon: Bell },
      { label: "Cài đặt & Bảo mật", icon: Settings },
    ] },
    { label: "CỘNG TÁC", items: [
      { href: "/creator/dang-ky", label: "Hồ sơ Creator", icon: Sparkles },
    ] },
  ];
  const activeUserId = user.id;

  function openNotice(title: string) {
    setDialog({ title, description: "Tính năng này chưa được hỗ trợ trên Bloomie.", userId: activeUserId });
  }

  async function copyOrder(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setNotice("Đã sao chép mã đơn hàng.");
    } catch {
      setNotice(`Mã đơn hàng: ${id}`);
    }
  }

  function confirmCancellation(id: string) {
    setCancelError("");
    setDialog({
      title: "Hủy đơn hàng",
      description: `Bạn có muốn hủy đơn #${id.slice(0, 8).toUpperCase()} không?`,
      orderId: id,
      userId: activeUserId,
    });
  }

  async function cancelOrder(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (!supabase || cancelling) return;
    setCancelling(true);
    setCancelError("");

    try {
      const { error } = await supabase.rpc("cancel_pending_order", { p_order_id: id });
      if (error) {
        setCancelError(error.code === "P0001" ? error.message : "Chưa hủy được đơn. Bạn thử lại nhé.");
        return;
      }

      setResult((value) => {
        if (value?.userId !== activeUserId) return value;
        if (!value.orders.some((order) => order.id === id && order.status === "pending_payment")) return value;
        return {
          ...value,
          pending: value.pending === null ? null : Math.max(0, value.pending - 1),
          orders: value.orders.map((order) => order.id === id ? { ...order, status: "cancelled" } : order),
        };
      });
      setNotice("Đã hủy đơn hàng.");
      setDialog((value) => value?.userId === activeUserId && value.orderId === id ? null : value);
    } catch {
      setCancelError("Chưa hủy được đơn. Bạn thử lại nhé.");
    } finally {
      setCancelling(false);
    }
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || savingName) return;
    const fullName = String(new FormData(event.currentTarget).get("full_name") ?? "").trim();
    if (!fullName) {
      setNameError("Vui lòng nhập họ và tên.");
      return;
    }

    setSavingName(true);
    setNameError("");
    try {
      const { data: current, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || current.user?.id !== activeUserId) throw Error("Phiên đăng nhập đã thay đổi.");
      const { data, error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error || !data.user) throw error ?? Error("Chưa nhận được hồ sơ.");
      setUser((value) => value?.id === data.user.id ? data.user : value);
      dialogRef.current?.close();
    } catch {
      setNameError("Chưa lưu được tên. Bạn thử lại nhé.");
    } finally {
      setSavingName(false);
    }
  }

  return (
    <main className="bloomie-account min-h-screen bg-[#FFFDF8] text-[#1F3D33]">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-16 sm:px-6">
        <header>
          <p className="acct-tag bg-[#E8F1DD] text-[#245C45]"><span aria-hidden="true">●</span> TÀI KHOẢN CỦA TÔI</p>
          <h1 className="acct-heading mt-2 wrap-break-word text-[34px] leading-[1.1] font-extrabold tracking-tight sm:text-[48px]">Xin chào, {displayName}</h1>
          <p className="mt-2 text-sm leading-6 text-[#4A5568]">Quản lý đơn hàng, danh sách yêu thích và thông tin cá nhân của bạn tại Bloomie.</p>
        </header>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <AccountSidebar
            profile={{ initial: displayName.charAt(0).toLocaleUpperCase("vi"), name: displayName, email: user.email }}
            menu={menu}
            pending={pending}
            onNotice={openNotice}
            onEdit={() => {
              setNameError("");
              setDialog({ title: "Chỉnh sửa hồ sơ", edit: true, userId: activeUserId });
            }}
            onSignOut={signOut}
            signingOut={signingOut}
          />

          <div className="grid min-w-0 gap-8">
            <section aria-label="Thống kê tài khoản" className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
            </section>

            <section id="don-hang" aria-labelledby="account-orders-title" className="scroll-mt-6">
              <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 id="account-orders-title" className="acct-heading text-[28px] leading-tight font-bold">{allOrders ? "Tất cả đơn hàng" : "Đơn hàng gần đây"}</h2>
                <button type="button" className="acct-btn acct-light" onClick={() => {
                  setAllOrders(!allOrders);
                  setOrderPage(0);
                }}>
                  {allOrders ? "Xem đơn gần đây" : `Xem tất cả đơn hàng${total === null ? "" : ` (${total})`} →`}
                </button>
              </header>
              <p role="status" className="wrap-break-word text-sm text-[#245C45] not-empty:mb-3">{notice}</p>
              {message && <p role="alert" className="mb-3 text-sm text-[#B42318]">{message}</p>}
              {!accountOrders && <p role="status">Đang tải đơn hàng…</p>}
              {accountOrders?.failed && <p role="alert" className="acct-card bg-white p-5">Chưa tải được đơn hàng. Hãy tải lại trang.</p>}
              {accountOrders && !accountOrders.failed && accountOrders.orders.length === 0 && (
                <div className="acct-card bg-white p-5">
                  <p>Chưa có đơn hàng để hiển thị.</p>
                  <Link href="/san-pham" className="acct-btn acct-primary mt-3">Khám phá sản phẩm</Link>
                </div>
              )}
              <div className="grid gap-4">
                {accountOrders?.orders.map((order) => <OrderCard key={order.id} order={order} productImages={productImages} onCopy={copyOrder} onCancel={confirmCancellation} />)}
              </div>
              {allOrders && total !== null && total > ordersPerPage && (
                <nav aria-label="Các trang đơn hàng" className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="acct-btn acct-light disabled:opacity-60" disabled={orderPage === 0} onClick={() => setOrderPage(orderPage - 1)}>Trang trước</button>
                  <button type="button" className="acct-btn acct-light disabled:opacity-60" disabled={(orderPage + 1) * ordersPerPage >= total} onClick={() => setOrderPage(orderPage + 1)}>Trang sau</button>
                </nav>
              )}
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <AddressCard
                address={latestOrder ? {
                  recipient: `${latestOrder.recipient_name} ${latestOrder.recipient_phone}`,
                  street: latestOrder.shipping_address,
                } : undefined}
                emptyText={orderPage > 0 ? "Xem đơn gần đây để kiểm tra địa chỉ giao mới nhất." : accountOrders?.failed ? "Chưa tải được địa chỉ." : accountOrders ? "Chưa có địa chỉ từ đơn hàng." : "Đang tải địa chỉ…"}
              />
              <CreatorCard creator={creator} />
            </div>
          </div>
        </div>
      </div>

      <dialog ref={dialogRef} onClose={() => setDialog(null)} aria-labelledby="account-dialog-title" className="acct-card fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md bg-white p-6 text-[#1F3D33] backdrop:bg-[#1F3D33]/45">
        {accountDialog && (
          <>
            <div className="flex items-start justify-between gap-4">
              <h2 id="account-dialog-title" className="acct-heading text-2xl font-bold">{accountDialog.title}</h2>
              <button type="button" aria-label="Đóng hộp thoại" onClick={() => dialogRef.current?.close()} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-[#E8F1DD]"><X size={18} aria-hidden="true" /></button>
            </div>
            {accountDialog.edit ? (
              <form onSubmit={saveName} className="mt-4 space-y-3">
                <label className="block text-sm font-semibold">Họ và tên
                  <input name="full_name" defaultValue={typeof name === "string" ? name : ""} maxLength={100} required className="bloomie-field mt-2" />
                </label>
                {nameError && <p role="alert" className="text-sm text-[#B42318]">{nameError}</p>}
                <button type="submit" disabled={savingName} className="acct-btn acct-primary w-full disabled:opacity-60">{savingName ? "Đang lưu…" : "Lưu thay đổi"}</button>
              </form>
            ) : (
              <div className="mt-3 space-y-3 text-sm leading-6 text-[#4A5568]">
                <p>{accountDialog.description}</p>
                {accountDialog.orderId && (
                  <form onSubmit={(event) => void cancelOrder(event, accountDialog.orderId!)} className="space-y-3">
                    {cancelError && <p role="alert" className="text-[#B42318]">{cancelError}</p>}
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => dialogRef.current?.close()} className="acct-btn acct-light">Giữ đơn</button>
                      <button type="submit" disabled={cancelling} className="acct-btn bg-[#B42318] text-white hover:bg-[#902017] disabled:opacity-60">
                        {cancelling ? "Đang hủy…" : "Xác nhận hủy"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </dialog>
    </main>
  );
}
