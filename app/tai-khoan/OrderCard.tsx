import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock, Copy, X } from "lucide-react";

export type Order = {
  id: string;
  created_at: string;
  status: string;
  total_vnd: number;
  order_items: { product_id: string; product_name: string; quantity: number }[];
};

const pendingStatus = { label: "Chờ thanh toán", icon: Clock, color: "bg-[#FFF1C8] text-[#754204]" };
const paidStatus = { label: "Đã thanh toán", icon: Check, color: "bg-[#DCF4E8] text-[#245C45]" };
const statuses: Record<string, typeof pendingStatus> = {
  pending_payment: pendingStatus,
  pending_vnpay_demo: { ...pendingStatus, label: "Chờ thanh toán VNPay (minh họa)" },
  pending_cod: { ...pendingStatus, label: "Chờ giao hàng (COD)" },
  paid: paidStatus,
  paid_simulated: { ...paidStatus, label: "Đã thanh toán giả lập" },
  cancelled: { label: "Đã hủy", icon: X, color: "bg-[#FDECE9] text-[#A72B23]" },
};
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
});

export default function OrderCard({ order, productImages, onCopy, onCancel }: {
  order: Order;
  productImages: Record<string, string>;
  onCopy: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const status = statuses[order.status];
  const StatusIcon = status?.icon;
  const pending = order.status === "pending_payment";
  const amount = money.format(order.total_vnd);
  const shortId = order.id.slice(0, 8).toUpperCase();
  const detail = `/don-hang/${order.id}`;

  return (
    <article aria-label={`Đơn hàng ${shortId}`} className="acct-card min-w-0 bg-white p-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7EDE2] pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <strong>#{shortId}</strong>
          <button type="button" onClick={() => onCopy(order.id)} aria-label={`Sao chép mã đơn ${shortId}`} className="grid size-8 place-items-center rounded-full text-[#4A5568] hover:bg-[#E8F1DD]">
            <Copy size={14} aria-hidden="true" />
          </button>
          <time dateTime={order.created_at} className="border-l border-[#D5E0D1] pl-2 text-[#4A5568]">{dateTime.format(new Date(order.created_at))}</time>
        </div>
        <span className={`acct-tag ${status?.color ?? "bg-[#E8F1DD] text-[#245C45]"}`}>{StatusIcon && <StatusIcon size={13} aria-hidden="true" />}{status?.label ?? "Đang cập nhật"}</span>
      </header>

      <div className="grid items-center gap-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <ul className="min-w-0 space-y-3">
          {order.order_items.map((item) => {
            const image = productImages[item.product_id];
            return (
              <li key={item.product_id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                <div className={`relative grid place-items-center overflow-hidden rounded-2xl border border-[#E2EBDD] bg-[#F2F7ED] text-[#245C45] ${image ? "size-[72px]" : "size-14"}`}>
                  {image ? <Image src={image} alt="" fill sizes="72px" className="object-contain p-1" /> : <BookOpen size={24} aria-hidden="true" />}
                </div>
                <div className="min-w-0">
                  <h3 className="wrap-break-word text-sm leading-5 font-bold">{item.product_name}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#4A5568]">Số lượng: {item.quantity}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="sm:text-right">
          <p className="text-xs text-[#4A5568]">Tổng tiền</p>
          <p className={`acct-heading font-extrabold ${pending ? "text-2xl" : "text-base"}`}>{amount}</p>
          {pending && <span className="acct-tag mt-1 bg-[#FFF3E5] text-[#874215]">Ví thanh toán: Chưa trừ</span>}
        </div>
      </div>

      <footer className="flex flex-col gap-2 border-t border-[#E7EDE2] pt-3 sm:flex-row sm:flex-wrap sm:items-center">
        {pending && (
          <Link href={detail} className="acct-btn acct-primary w-full sm:w-auto">
            Thanh toán ngay ({amount}) <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
        <Link href={detail} className="acct-btn acct-light w-full sm:w-auto">Xem chi tiết đơn</Link>
        {(pending || order.status === "pending_cod" || order.status === "pending_vnpay_demo") && (
          <button type="button" onClick={() => onCancel(order.id)} className="acct-btn w-full text-[#B42318] hover:bg-[#FFF1EF] sm:ml-auto sm:w-auto">
            Hủy đơn hàng
          </button>
        )}
      </footer>
    </article>
  );
}
