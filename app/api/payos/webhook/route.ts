import { PayOS } from "@payos/node";
import { createClient } from "@supabase/supabase-js";

function reply(status: number, message: string) {
  return Response.json({ message }, { status });
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!supabaseUrl || !serviceKey || !clientId || !apiKey || !checksumKey) {
    return reply(503, "Webhook is not configured.");
  }

  const payos = new PayOS({ clientId, apiKey, checksumKey });

  let event;
  try {
    event = await payos.webhooks.verify(await request.json());
  } catch {
    return reply(400, "Invalid webhook.");
  }

  if (
    event.code !== "00" ||
    event.currency !== "VND" ||
    !Number.isSafeInteger(event.orderCode) ||
    event.orderCode <= 0 ||
    !Number.isSafeInteger(event.amount) ||
    event.amount <= 0 ||
    typeof event.paymentLinkId !== "string" ||
    !event.paymentLinkId
  ) {
    return reply(200, "Event ignored.");
  }

  try {
    const db = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: payment, error: paymentError } = await db
      .from("payos_payments")
      .select("order_id,payment_link_id")
      .eq("order_code", event.orderCode)
      .maybeSingle();

    if (paymentError) throw paymentError;

    // payOS gửi dữ liệu mẫu khi đăng ký URL webhook.
    if (!payment) return reply(200, "No matching order.");
    if (!payment.payment_link_id) return reply(503, "Payment link not saved yet.");
    if (payment.payment_link_id !== event.paymentLinkId) {
      return reply(200, "Payment link does not match.");
    }

    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id,status,total_vnd")
      .eq("id", payment.order_id)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order || order.status !== "pending_payment") {
      return reply(200, "No pending order.");
    }

    const response = await fetch(
      `https://api-merchant.payos.vn/v2/payment-requests/${event.orderCode}`,
      {
        headers: { "x-client-id": clientId, "x-api-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) return reply(502, "Could not verify payment with payOS.");

    const result = await response.json();
    const detail = result.data;

    if (result.code !== "00" || !detail) {
      return reply(502, "Could not verify payment with payOS.");
    }

    const total = Number(order.total_vnd);
    if (
      !Number.isSafeInteger(total) ||
      total <= 0 ||
      detail.id !== payment.payment_link_id ||
      detail.orderCode !== event.orderCode ||
      detail.amount !== total
    ) {
      return reply(409, "Payment details do not match the order.");
    }

    if (
      detail.status !== "PAID" ||
      detail.amountRemaining !== 0 ||
      !Number.isSafeInteger(detail.amountPaid) ||
      detail.amountPaid < total
    ) {
      return reply(200, "Full payment has not been confirmed.");
    }

    const { error: updateError } = await db
      .from("orders")
      .update({ status: "paid" })
      .eq("id", order.id)
      .eq("status", "pending_payment")
      .eq("total_vnd", order.total_vnd);

    if (updateError) throw updateError;

    return reply(200, "OK");
  } catch {
    return reply(500, "Unable to process webhook.");
  }
}