import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const payosApi = "https://api-merchant.payos.vn/v2/payment-requests";

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];

  if (!token) {
    return fail("Hãy đăng nhập để thanh toán.", 401);
  }

  const body = await request.json().catch(() => null);
  const orderId = body?.orderId;

  if (
    typeof orderId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
  ) {
    return fail("Mã đơn hàng không hợp lệ.", 400);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
  const appUrl = process.env.APP_URL;

  if (!supabaseUrl || !serviceKey || !clientId || !apiKey || !checksumKey || !appUrl) {
    return fail("Thanh toán QR chưa được bật.", 503);
  }

  try {
    const db = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) {
      return fail("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.", 401);
    }

    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id,status,total_vnd")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return fail("Không tìm thấy đơn hàng.", 404);
    if (order.status !== "pending_payment") {
      return fail("Đơn hàng này không ở trạng thái chờ thanh toán.", 409);
    }

    const amount = Number(order.total_vnd);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return fail("Tổng tiền đơn hàng không hợp lệ.", 400);
    }

    const { error: reserveError } = await db
      .from("payos_payments")
      .upsert({ order_id: order.id }, {
        onConflict: "order_id",
        ignoreDuplicates: true,
      });

    if (reserveError) throw reserveError;

    const { data: payment, error: paymentError } = await db
      .from("payos_payments")
      .select("order_code,checkout_url")
      .eq("order_id", order.id)
      .single();

    if (paymentError) throw paymentError;

    if (payment.checkout_url) {
      return Response.json({ checkoutUrl: payment.checkout_url });
    }

    const orderCode = Number(payment.order_code);
    const returnUrl = new URL(`/don-hang/${order.id}`, appUrl).toString();
    const cancelUrl = returnUrl;
    const description = `Bloomie ${orderCode}`;
    const signature = createHmac("sha256", checksumKey)
      .update(
        `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}` +
        `&orderCode=${orderCode}&returnUrl=${returnUrl}`,
      )
      .digest("hex");

    const headers = {
      "content-type": "application/json",
      "x-client-id": clientId,
      "x-api-key": apiKey,
    };

    const created = await fetch(payosApi, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount, cancelUrl, description, orderCode, returnUrl, signature,
      }),
      signal: AbortSignal.timeout(10_000),
    }).then(async (response) => response.ok ? response.json() : null)
      .catch(() => null);

    let link = created?.code === "00" ? created.data : null;

    if (!link) {
      // Tra lại cùng mã nếu payOS đã tạo link trong lần gọi trước.
      const response = await fetch(`${payosApi}/${orderCode}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      const existing = response.ok ? await response.json() : null;
      const data = existing?.data;

      if (existing?.code === "00" && /^[a-f0-9]{32}$/i.test(data?.id ?? "")) {
        link = {
          ...data,
          paymentLinkId: data.id,
          checkoutUrl: `https://pay.payos.vn/web/${data.id}`,
        };
      }
    }

    if (
      !link ||
      link.orderCode !== orderCode ||
      link.amount !== amount ||
      !/^[a-f0-9]{32}$/i.test(link.paymentLinkId ?? "") ||
      link.checkoutUrl !== `https://pay.payos.vn/web/${link.paymentLinkId}`
    ) {
      return fail("Chưa lấy được link thanh toán. Bạn thử lại sau nhé.", 502);
    }

    if (link.status !== "PENDING") {
      return fail("Link payOS hiện không ở trạng thái chờ thanh toán.", 409);
    }

    const { error: saveError } = await db
      .from("payos_payments")
      .update({
        payment_link_id: link.paymentLinkId,
        checkout_url: link.checkoutUrl,
      })
      .eq("order_id", order.id);

    if (saveError) throw saveError;

    return Response.json({ checkoutUrl: link.checkoutUrl });
  } catch {
    return fail("Chưa mở được thanh toán QR. Bạn thử lại sau nhé.", 502);
  }
}