"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Storefront from "../../components/storefront";
import { createClient, hasSupabaseConfig } from "../../lib/supabase-browser";

type Order = {
  id: string;
  status: string;
  total_vnd: number;
};

const statusLabels: Record<string, string> = {
  pending_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("Đang tải đơn hàng…");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [openingPayment, setOpeningPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      try {
        if (!hasSupabaseConfig) {
          throw new Error("Chưa có cấu hình kết nối.");
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active) return;

        if (!user) {
          setNeedsLogin(true);
          setMessage("Hãy đăng nhập bằng tài khoản đã đặt đơn.");
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("id,status,total_vnd")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        setOrder(data);
        setMessage(data ? "" : "Không tìm thấy đơn hàng trong tài khoản này.");
      } catch {
        if (active) {
          setMessage("Chưa tải được đơn hàng. Bạn thử tải lại trang nhé.");
        }
      }
    }

    void loadOrder();
    return () => {
      active = false;
    };
  }, [id]);

  async function openPayment() {
    setOpeningPayment(true);
    setPaymentError("");

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Hãy đăng nhập lại để thanh toán.");
      }

      const response = await fetch("/api/payos", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId: id }),
      });

      const result = await response.json();

      if (!response.ok || typeof result.checkoutUrl !== "string") {
        throw new Error(result.error || "Chưa mở được trang thanh toán.");
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Thanh toán gặp lỗi.",
      );
      setOpeningPayment(false);
    }
  }

  return (
    <Storefront>
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <h1 className="font-display text-3xl font-bold">Chi tiết đơn hàng</h1>

        {message && (
          <p role="status" className="mt-4">
            {message}
          </p>
        )}
        {needsLogin && (
          <Link href="/dang-nhap" className="bloomie-button mt-4">
            Đăng nhập
          </Link>
        )}

        {order && order.id === id && (
          <dl className="mt-6 space-y-4 rounded-2xl bg-green-50 p-5">
            <div>
              <dt className="font-semibold">Mã đơn</dt>
              <dd className="break-all">{order.id}</dd>
            </div>
            <div>
              <dt className="font-semibold">Tổng tiền đơn hàng</dt>
              <dd>{money.format(order.total_vnd)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Trạng thái</dt>
              <dd>{statusLabels[order.status] ?? "Chưa xác định"}</dd>
            </div>
          </dl>
        )}
        {order?.id === id &&
          order.status === "pending_payment" &&
          order.total_vnd > 0 && (
            <div className="mt-6">
              <button
                type="button"
                className="bloomie-button disabled:opacity-60"
                disabled={openingPayment}
                onClick={openPayment}
              >
                {openingPayment ? "Đang mở thanh toán…" : "Thanh toán QR"}
              </button>

              {paymentError && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {paymentError}
                </p>
              )}
            </div>
          )}
      </main>
    </Storefront>
  );
}
