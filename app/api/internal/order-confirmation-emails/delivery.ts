import nodemailer from "nodemailer";
import type { OrderConfirmation, orderConfirmation } from "./template";

type Email = ReturnType<typeof orderConfirmation>;

export function getOrderEmailSender() {
  const provider = process.env.BLOOMIE_ORDER_EMAIL_PROVIDER ?? "resend";

  if (provider === "gmail") {
    const user = process.env.BLOOMIE_GMAIL_USER?.trim();
    const pass = process.env.BLOOMIE_GMAIL_APP_PASSWORD?.replace(/\s/g, "");
    if (!user || !pass) return null;

    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 4_000,
      greetingTimeout: 3_000,
      socketTimeout: 4_000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });

    return async (order: OrderConfirmation, email: Email) => {
      const result = await transport.sendMail({
        from: { name: "Bloomie", address: user },
        to: { name: "", address: order.email },
        messageId: `<bloomie.order.${order.event === "completed" ? "completed." : ""}${order.orderId}@gmail.com>`,
        ...email,
      });
      if (!result.accepted.length) throw new Error("Recipient not accepted by Gmail");
      return result.messageId;
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BLOOMIE_ORDER_EMAIL_FROM;
  if (provider !== "resend" || !apiKey || !from) return null;

  return async (order: OrderConfirmation, email: Email) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${order.event === "completed" ? "bloomie-order-completion" : "bloomie-order-confirmation"}/${order.orderId}`,
      },
      body: JSON.stringify({ from, to: [order.email], ...email }),
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) {
      console.error("Resend chưa nhận email đơn hàng.", order.orderId, response.status);
      throw new Error("Resend rejected the email");
    }

    const result: { id?: string } = await response.json();
    if (!result.id) throw new Error("Missing provider email ID");
    return result.id;
  };
}
