"use client";

import { ArrowLeft, BadgeCheck, BookOpen, CalendarDays, Check, Clock, Copy, MapPin, Phone, ShoppingBag, Truck, UserRound, Wallet, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Storefront from "../../components/storefront";
import { createClient, hasSupabaseConfig } from "../../lib/supabase-browser";

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_vnd: number;
  recipient_name: string;
  recipient_phone: string;
  shipping_address: string;
  order_items: { product_id: string; product_name: string; quantity: number; unit_price_vnd: number }[];
};

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
});
const statuses = {
  pending_payment: { label: "Chờ thanh toán", icon: Clock, style: "bg-[#FFF1C8] text-[#754204]" },
  paid: { label: "Đã thanh toán", icon: Check, style: "bg-[#DCF4E8] text-[#245C45]" },
  paid_simulated: { label: "Đã thanh toán giả lập", icon: Check, style: "bg-[#DCF4E8] text-[#245C45]" },
  cancelled: { label: "Đã hủy", icon: X, style: "bg-[#FDECE9] text-[#A72B23]" },
} as const;
const card = "rounded-3xl border border-[#E2EBDD] bg-white p-5 shadow-sm sm:p-6";
const pill = "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245C45]";

function OrderProgress({ order }: { order: Order }) {
  const pending = order.status === "pending_payment";
  const paid = order.status === "paid" || order.status === "paid_simulated";
  const cancelled = order.status === "cancelled";
  const steps = [
    { label: "Đặt hàng", detail: dateTime.format(new Date(order.created_at)), icon: Check, done: true, current: false },
    { label: "Thanh toán", detail: cancelled ? "Đơn đã hủy" : paid ? "Đã thanh toán" : pending ? "Chờ thanh toán" : "Chưa có thông tin", icon: cancelled ? X : Wallet, done: paid, current: pending },
    { label: "Đang giao", detail: "Chưa có thông tin", icon: Truck, done: false, current: false },
    { label: "Hoàn tất", detail: "Chưa có thông tin", icon: BadgeCheck, done: false, current: false },
  ];

  return (
    <ol aria-label="Tiến trình đơn hàng" className={`${card} mt-6 grid grid-cols-2 gap-y-5 text-center sm:grid-cols-4`}>
      {steps.map(({ label, detail, icon: Icon, done, current }, index) => (
        <li key={label} aria-current={current ? "step" : undefined} className="relative flex min-w-0 flex-col items-center px-1">
          {index > 0 && <span aria-hidden="true" className={`absolute top-5 right-1/2 hidden w-full border-t sm:block ${done || current ? "border-[#245C45]" : "border-dashed border-[#BFD2B7]"}`} />}
          <span className={`relative z-10 grid size-10 place-items-center rounded-full border-2 border-[#E8F1DD] ${done || current ? "bg-[#245C45] text-white" : "bg-[#F5F8F1] text-[#4A5568]"}`}>
            <Icon size={18} aria-hidden="true" />
          </span>
          <span className="mt-2 text-sm font-bold">{label}</span>
          <span className={`mt-1 text-xs ${current ? "text-[#754204]" : "text-[#4A5568]"}`}>{detail}</span>
        </li>
      ))}
    </ol>
  );
}

function Products({ order, productImages }: { order: Order; productImages: Record<string, string> }) {
  const quantity = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <section aria-labelledby="order-products" className={card}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7EDE2] pb-4">
        <h2 id="order-products" className="flex items-center gap-2 text-base font-bold">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#E8F1DD] text-[#245C45]"><ShoppingBag size={16} aria-hidden="true" /></span>
          Sản phẩm trong đơn
        </h2>
        <span className="rounded-full bg-[#E8F1DD] px-3 py-1 text-xs font-semibold text-[#245C45]">{quantity} sản phẩm</span>
      </header>
      <ul className="mt-4 space-y-3">
        {order.order_items.map((item) => {
          const image = productImages[item.product_id];
          return (
            <li key={item.product_id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-[#E7EDE2] bg-[#F7FAF4] p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
              <div className="relative grid size-14 place-items-center overflow-hidden rounded-xl bg-white text-[#245C45]">
                {image ? <Image src={image} alt="" fill sizes="56px" className="object-contain p-1" /> : <BookOpen size={22} aria-hidden="true" />}
              </div>
              <div className="min-w-0">
                <h3 className="wrap-break-word text-sm font-bold">{item.product_name}</h3>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#4A5568]">
                  <span className="rounded-md bg-[#E8F1DD] px-1.5 py-0.5 text-[#245C45]">×{item.quantity}</span>
                  <span>Đơn giá: {money.format(item.unit_price_vnd)}</span>
                </p>
              </div>
              <div className="col-start-2 sm:col-start-auto sm:text-right">
                <p className="text-xs text-[#4A5568]">Thành tiền</p>
                <p className="font-bold text-[#245C45]">{money.format(item.unit_price_vnd * item.quantity)}</p>
              </div>
            </li>
          );
        })}
        {!order.order_items.length && <li className="text-sm text-[#4A5568]">Chưa có thông tin sản phẩm.</li>}
      </ul>
    </section>
  );
}

function Shipping({ order }: { order: Order }) {
  const fields = [
    { label: "Người nhận", value: order.recipient_name, icon: UserRound },
    { label: "Số điện thoại", value: order.recipient_phone, icon: Phone },
    { label: "Địa chỉ giao hàng", value: order.shipping_address, icon: MapPin },
  ];

  return (
    <section aria-labelledby="order-shipping" className={card}>
      <h2 id="order-shipping" className="flex items-center gap-2 border-b border-[#E7EDE2] pb-4 text-base font-bold">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#E8F1DD] text-[#245C45]"><MapPin size={16} aria-hidden="true" /></span>
        Thông tin nhận hàng
      </h2>
      <dl className="grid gap-4 pt-4 sm:grid-cols-2">
        {fields.map(({ label, value, icon: Icon }, index) => (
          <div key={label} className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 ${index === 2 ? "border-t border-[#E7EDE2] pt-4 sm:col-span-2" : ""}`}>
            <span className="row-span-2 grid size-7 place-items-center rounded-lg bg-[#F1F6EC] text-[#245C45]"><Icon size={14} aria-hidden="true" /></span>
            <dt className="text-xs font-semibold uppercase text-[#4A5568]">{label}</dt>
            <dd className="mt-1 wrap-break-word text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function OrderDetail({ id, productImages }: { id: string; productImages: Record<string, string> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("Đang tải đơn hàng…");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState<"pay" | "cancel" | null>(null);
  const [actionError, setActionError] = useState("");
  const actionInProgress = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      try {
        if (!hasSupabaseConfig) throw new Error("Chưa có cấu hình kết nối.");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        if (!user) {
          setNeedsLogin(true);
          setMessage("Hãy đăng nhập bằng tài khoản đã đặt đơn.");
          return;
        }
        const { data, error } = await supabase
          .from("orders")
          .select("id,created_at,status,total_vnd,recipient_name,recipient_phone,shipping_address,order_items(product_id,product_name,quantity,unit_price_vnd)")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        setOrder(data);
        setMessage(data ? "" : "Không tìm thấy đơn hàng trong tài khoản này.");

        if (data?.status === "pending_payment") {
          const { data: wallet, error: walletError } = await supabase
            .from("demo_wallets").select("balance_vnd").eq("user_id", user.id).maybeSingle();
          if (active && !walletError) setBalance(Number(wallet?.balance_vnd ?? 0));
        }
      } catch {
        if (active) setMessage("Chưa tải được đơn hàng. Bạn thử tải lại trang nhé.");
      }
    }

    void loadOrder();
    return () => { active = false; };
  }, [id]);

  async function submitAction(action: "pay" | "cancel") {
    if (actionInProgress.current || order?.status !== "pending_payment") return;
    actionInProgress.current = true;
    setBusy(action);
    setActionError("");
    try {
      const { data, error } = await createClient().rpc(
        action === "pay" ? "pay_order_with_demo_wallet" : "cancel_pending_order",
        { p_order_id: id },
      );
      if (error) {
        setActionError(error.code === "P0001" ? error.message : "Chưa thực hiện được. Bạn thử lại nhé.");
        return;
      }
      if (action === "pay") setBalance(Number(data));
      setOrder((current) => current && { ...current, status: action === "pay" ? "paid_simulated" : "cancelled" });
      setConfirmCancel(false);
    } catch {
      setActionError("Kết nối bị gián đoạn. Bạn thử lại nhé.");
    } finally {
      actionInProgress.current = false;
      setBusy(null);
    }
  }

  async function copyOrder() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied("Đã sao chép mã đơn");
    } catch {
      setCopied("Chưa sao chép được mã đơn");
    }
  }

  const pending = order?.status === "pending_payment";
  const status = order && statuses[order.status as keyof typeof statuses];
  const StatusIcon = status ? status.icon : Clock;
  const shortId = order?.id.slice(0, 8).toUpperCase();
  const subtotal = order?.order_items.reduce((sum, item) => sum + item.quantity * item.unit_price_vnd, 0);
  const shortfall = order && balance !== null ? Math.max(0, order.total_vnd - balance) : 0;

  return (
    <Storefront>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6">
        <header>
          <p className="inline-flex rounded-full bg-[#E8F1DD] px-3 py-1 text-xs font-bold text-[#245C45]"><span aria-hidden="true" className="mr-2">●</span> ĐƠN HÀNG TRỰC TUYẾN</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Chi tiết đơn hàng</h1>
          {order && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <button type="button" onClick={copyOrder} aria-label={`Sao chép mã đơn ${shortId}`} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#DCE8D5] bg-white px-2.5 hover:bg-[#F1F6EC] focus-visible:outline-2 focus-visible:outline-[#245C45]">
                  <span>Mã đơn: <strong>#{shortId}</strong></span><Copy size={14} aria-hidden="true" />
                </button>
                <span role="status" className={copied ? "text-[#245C45]" : "sr-only"}>{copied}</span>
                <time dateTime={order.created_at} className="inline-flex items-center gap-2 text-[#4A5568]"><CalendarDays size={14} aria-hidden="true" /> Ngày đặt: {dateTime.format(new Date(order.created_at))}</time>
              </div>
              <p role="status" className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${status ? status.style : "bg-[#F1F6EC] text-[#4A5568]"}`}>
                <StatusIcon size={15} aria-hidden="true" /> Trạng thái: {status ? status.label : "Đang cập nhật"}
              </p>
            </div>
          )}
        </header>

        {message && <p role="status" className="mt-4 text-sm text-[#4A5568]">{message}</p>}
        {needsLogin && <Link href="/dang-nhap" className="bloomie-button mt-4">Đăng nhập</Link>}

        {order && (
          <>
            <OrderProgress order={order} />
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,10fr)_minmax(0,7fr)]">
              <div className="grid min-w-0 gap-5">
                <Products order={order} productImages={productImages} />
                <Shipping order={order} />
              </div>

              <aside aria-labelledby="order-payment" className="rounded-3xl border border-[#E2EBDD] bg-[#E8F1DD] p-5 shadow-sm sm:p-6">
                <h2 id="order-payment" className="font-display text-xl font-extrabold">Tóm tắt thanh toán</h2>
                <dl className="mt-4 text-sm">
                  {!!order.order_items.length && (
                    <div className="flex justify-between gap-3 text-[#4A5568]">
                      <dt>Tạm tính ({order.order_items.length} món)</dt>
                      <dd className="font-semibold text-[#1F3D33]">{money.format(subtotal ?? 0)}</dd>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#CBDCC2] pt-4">
                    <dt className="font-bold">Tổng tiền thanh toán</dt>
                    <dd className="font-display text-2xl font-extrabold text-[#245C45]">{money.format(order.total_vnd)}</dd>
                  </div>
                </dl>

                {pending && (
                  <div className="mt-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#E8F1DD] text-[#245C45]"><Wallet size={17} aria-hidden="true" /></span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase text-[#4A5568]">Số dư ví giả lập</p>
                        <p className="mt-1 text-sm font-bold">{balance === null ? "Chưa xác định" : money.format(balance)}</p>
                      </div>
                      {shortfall > 0 && <span className="rounded-full bg-[#FDECE9] px-2 py-1 text-xs font-semibold text-[#A72B23]">Không đủ</span>}
                    </div>
                    <button disabled={busy !== null || confirmCancel} type="button" onClick={() => void submitAction("pay")} className="bloomie-button w-full disabled:opacity-60">
                      <Wallet size={16} aria-hidden="true" /> {busy === "pay" ? "Đang thanh toán…" : "Thanh toán bằng ví giả lập"}
                    </button>
                    {shortfall > 0 && (
                      <div className="rounded-2xl border border-[#F4C8C3] bg-[#FDECE9] p-3 text-sm text-[#922820]">
                        <p className="font-bold">Số dư ví giả lập không đủ</p>
                        <p className="mt-1 leading-relaxed">Bạn còn thiếu {money.format(shortfall)}. Hãy liên hệ quản trị viên để được cộng số dư thử nghiệm.</p>
                      </div>
                    )}
                    <p className="text-center text-xs leading-relaxed text-[#4A5568]">Thanh toán thử nghiệm bằng ví Bloomie.</p>
                  </div>
                )}

                <div className="mt-5 space-y-2 border-t border-[#CBDCC2] pt-4">
                  <Link href="/san-pham" className={`${pill} w-full border border-[#BFD2B7] hover:bg-white`}><ArrowLeft size={16} aria-hidden="true" /> Tiếp tục khám phá sản phẩm</Link>
                  {pending && (confirmCancel ? (
                    <div className="space-y-3 rounded-2xl border border-[#F4C8C3] bg-white p-3 text-sm">
                      <p className="font-semibold">Bạn muốn hủy đơn hàng này?</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={busy !== null} onClick={() => { setConfirmCancel(false); setActionError(""); }} className={`${pill} border border-[#DCE8D5] hover:bg-[#F1F6EC] disabled:opacity-60`}>Giữ đơn</button>
                        <button type="button" disabled={busy !== null} onClick={() => void submitAction("cancel")} className={`${pill} bg-[#A72B23] text-white hover:bg-[#902017] disabled:opacity-60`}>{busy === "cancel" ? "Đang hủy…" : "Xác nhận hủy"}</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" disabled={busy !== null} onClick={() => { setConfirmCancel(true); setActionError(""); }} className={`${pill} w-full text-[#A72B23] hover:bg-[#FDECE9] disabled:opacity-60`}>Hủy đơn hàng này</button>
                  ))}
                  {actionError && <p role="alert" className="rounded-xl bg-[#FDECE9] p-3 text-sm text-[#922820]">{actionError}</p>}
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </Storefront>
  );
}
