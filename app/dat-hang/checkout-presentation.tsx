import { ArrowLeft, ArrowRight, Check, CircleCheck, Clock, MapPin, ShoppingBag, Wallet } from "lucide-react";
import Link from "next/link";
import {
  orderCardClass,
  orderColumnsClass,
  orderPillClass,
  OrderSteps,
  orderSummaryClass,
} from "../components/order-layout";

export type PaymentMethod = "wallet" | "cod" | "vnpay_demo";

export function CheckoutHeading({ orderId, hasItems = false, paymentMethod = "wallet" }: {
  orderId?: string;
  hasItems?: boolean;
  paymentMethod?: PaymentMethod;
}) {
  const confirmed = Boolean(orderId);
  const cashOnDelivery = paymentMethod === "cod";
  const vnpay = paymentMethod === "vnpay_demo";
  const cartDone = confirmed || hasItems;
  const steps = [
    { label: "Giỏ hàng", detail: cartDone ? "Đã chọn sản phẩm" : "Kiểm tra giỏ hàng", icon: cartDone ? Check : ShoppingBag, done: cartDone, current: false, href: confirmed ? undefined : "/gio-hang" },
    { label: "Đặt hàng", detail: confirmed ? "Đã xác nhận" : "Nhập thông tin nhận hàng", icon: confirmed ? Check : MapPin, done: confirmed, current: !confirmed },
    { label: "Thanh toán", detail: cashOnDelivery ? "Khi nhận hàng (COD)" : vnpay ? "QR VNPay (minh họa)" : confirmed ? "Chờ thanh toán" : "Sau khi đặt hàng", icon: Wallet, done: false, current: confirmed },
  ];

  return (
    <>
      <header>
        <p className="inline-flex items-center gap-2 rounded-full bg-[#E8F1DD] px-3 py-1 text-xs font-bold text-[#245C45]">
          <span aria-hidden="true">●</span> THANH TOÁN & NHẬN HÀNG
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {confirmed ? "Đã tạo đơn hàng" : "Đặt hàng"}
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {orderId ? (
            <>
              <p className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#DCE8D5] bg-white px-2.5 text-xs">
                Mã đơn: <strong>#{orderId.slice(0, 8).toUpperCase()}</strong>
              </p>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#FFF1C8] px-3 py-2 text-xs font-semibold text-[#754204]">
                <Clock size={15} aria-hidden="true" /> Trạng thái: {cashOnDelivery ? "Chờ giao hàng (COD)" : vnpay ? "Chờ thanh toán VNPay (minh họa)" : "Chờ thanh toán"}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#4A5568]">Kiểm tra giỏ hàng và xác nhận thông tin người nhận.</p>
          )}
        </div>
      </header>
      <OrderSteps label="Các bước đặt hàng" steps={steps} />
    </>
  );
}

export function CheckoutConfirmation({ orderId, message, paymentMethod }: {
  orderId: string;
  message: string;
  paymentMethod: PaymentMethod;
}) {
  return (
    <div className={orderColumnsClass}>
      <section aria-labelledby="checkout-confirmation" className={orderCardClass}>
        <h2 id="checkout-confirmation" className="flex items-center gap-2 border-b border-[#E7EDE2] pb-4 text-base font-bold">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#E8F1DD] text-[#245C45]">
            <CircleCheck size={16} aria-hidden="true" />
          </span>
          Đặt hàng thành công
        </h2>
        <p role="status" className="mt-4 text-sm leading-6 text-[#4A5568]">Bloomie đã ghi nhận đơn hàng của bạn. Mở chi tiết đơn để kiểm tra sản phẩm, địa chỉ giao hàng và tổng tiền.</p>
        {message && <p role="alert" className="mt-3 rounded-xl bg-[#FFF1C8] p-3 text-sm text-[#754204]">{message}</p>}
      </section>
      <aside aria-labelledby="checkout-next-step" className={orderSummaryClass}>
        <h2 id="checkout-next-step" className="text-xl font-bold">Thanh toán đơn hàng</h2>
        <p className="mt-3 text-sm leading-6 text-[#4A5568]">
          {paymentMethod === "cod"
            ? "Bạn đã chọn COD. Số tiền của đơn sẽ được thanh toán khi nhận hàng."
            : paymentMethod === "vnpay_demo"
              ? "Mở chi tiết đơn để xem mã QR VNPay minh họa."
              : "Bạn có thể thanh toán bằng ví giả lập Bloomie trên trang chi tiết đơn hàng."}
        </p>
        <Link href={`/don-hang/${orderId}`} className="bloomie-button mt-5 w-full">
          Xem chi tiết đơn hàng <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/san-pham" className={`${orderPillClass} mt-3 w-full border border-[#BFD2B7] hover:bg-white`}>
          <ArrowLeft size={16} aria-hidden="true" /> Tiếp tục khám phá sản phẩm
        </Link>
      </aside>
    </div>
  );
}
