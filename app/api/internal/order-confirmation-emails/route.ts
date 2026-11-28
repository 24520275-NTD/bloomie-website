import { timingSafeEqual } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { getOrderEmailSender } from "./delivery";
import { orderConfirmation, type OrderConfirmation } from "./template";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.BLOOMIE_ORDER_EMAIL_JOB_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return new Response(null, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sendEmail = getOrderEmailSender();
  const siteUrl = process.env.BLOOMIE_SITE_URL;

  if (!supabaseUrl || !serviceKey || !sendEmail || !siteUrl) {
    return Response.json({ message: "Chưa cấu hình email xác nhận đơn hàng." }, { status: 503 });
  }

  let site: URL;
  try {
    site = new URL(siteUrl);
    if (site.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    return Response.json({ message: "Địa chỉ Bloomie phải là một URL HTTPS." }, { status: 503 });
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(5_000) }),
    },
  });
  const { data, error } = await db.rpc("claim_order_confirmation_emails");
  if (error) {
    console.error("Không lấy được hàng đợi email đơn hàng.", error.code);
    return Response.json({ message: "Chưa đọc được hàng đợi email." }, { status: 503 });
  }

  const orders = data as OrderConfirmation[];
  let sent = 0;
  for (const order of orders) {
    try {
      const email = orderConfirmation(order, site);
      const providerEmailId = await sendEmail(order, email);
      const { data: marked, error: markError } = await db.rpc("mark_order_confirmation_email_sent", {
        p_order_id: order.orderId,
        p_attempt: order.attempt,
        p_provider_email_id: providerEmailId,
        ...(order.event === "completed" ? { p_email_event: order.event } : {}),
      });
      if (markError || !marked) {
        console.error("Chưa ghi được trạng thái gửi email.", order.orderId, markError?.code);
        continue;
      }
      sent++;
    } catch {
      console.error("Chưa xử lý được email đơn hàng.", order.orderId);
    } finally {
      // Space provider requests so a batch stays within the default send rate.
      await delay(550);
    }
  }

  return Response.json({ claimed: orders.length, sent });
}
