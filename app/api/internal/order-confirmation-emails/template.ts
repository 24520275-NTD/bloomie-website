export type OrderConfirmation = {
  orderId: string;
  event?: "placed" | "completed";
  completedAt?: string | null;
  email: string;
  attempt: number;
  recipient: string;
  placedAt: string;
  status: string;
  total: number;
  items: { name: string; quantity: number; unitPrice: number }[];
};

const formats = {
  currency: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }),
  date: new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }),
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paymentInstruction(status: string) {
  switch (status) {
    case "completed_cod":
      return "Phương thức thanh toán: Thanh toán khi nhận hàng (COD).";
    case "completed_vnpay_demo":
      return "Phương thức thanh toán: QR VNPay minh họa.";
    case "paid_simulated":
      return "Phương thức thanh toán: Ví giả lập Bloomie.";
    case "pending_cod":
      return "Thanh toán khi nhận hàng (COD). Bạn sẽ trả tiền khi nhận được đơn.";
    case "pending_vnpay_demo":
      return "QR VNPay minh họa. Bạn có thể hoàn tất bước mô phỏng trong chi tiết đơn hàng.";
    case "pending_payment":
      return "Bạn có thể kiểm tra và hoàn tất bước thanh toán trong chi tiết đơn hàng.";
    default:
      return "Bạn có thể xem phương thức và trạng thái thanh toán trong chi tiết đơn hàng.";
  }
}

export function orderConfirmation(order: OrderConfirmation, site: URL) {
  const orderCode = `#${order.orderId.slice(0, 8).toUpperCase()}`;
  const orderUrl = new URL(`/don-hang/${encodeURIComponent(order.orderId)}`, site).href;
  const placedAt = formats.date.format(new Date(order.placedAt));
  const total = formats.currency.format(order.total);
  const payment = paymentInstruction(order.status);
  const completed = order.event === "completed";
  const completedAt = completed && order.completedAt ? formats.date.format(new Date(order.completedAt)) : "";
  const title = completed ? "Đơn hàng của bạn đã hoàn tất" : "Cảm ơn bạn đã đặt hàng tại Bloomie!";
  const badge = completed ? "Đơn hàng đã hoàn tất" : "Đơn hàng đã được ghi nhận";
  const subject = `[Bloomie] ${completed ? "Đã hoàn tất đơn hàng" : "Xác nhận đơn hàng"} ${orderCode}`;
  const introduction = completed
    ? "Bloomie đã ghi nhận đơn hàng của bạn ở trạng thái hoàn tất. Cảm ơn bạn đã mua sắm tại Bloomie!"
    : "Bloomie đã nhận được đơn hàng của bạn. Bạn có thể xem thông tin bên dưới và theo dõi trạng thái trong tài khoản Bloomie.";
  const footer = completed
    ? "Email này được gửi tự động khi đơn hàng chuyển sang trạng thái hoàn tất."
    : "Email này được gửi tự động khi Bloomie ghi nhận đơn hàng.";
  const lines = order.items.map((item) => `${item.name} ×${item.quantity} — ${formats.currency.format(item.unitPrice * item.quantity)}`);

  const text = [
    title,
    `Chào ${order.recipient},`,
    introduction,
    `Mã đơn: ${orderCode}\nNgày đặt: ${placedAt}${completedAt ? `\nHoàn tất: ${completedAt}` : ""}`,
    `Sản phẩm trong đơn\n${lines.join("\n")}`,
    `Tổng đơn hàng: ${total}\n${payment}`,
    `Xem chi tiết đơn hàng: ${orderUrl}`,
    "Bloomie",
  ].join("\n\n");

  const rows = order.items.map((item) => `
    <tr>
      <td style="padding:12px 8px 12px 0; border-top:1px solid #d8e5d0;">
        <strong>${escapeHtml(item.name)}</strong><br>
        <span style="font-size:14px;color:#4a5568;">Số lượng: ${item.quantity}</span>
      </td>
      <td style="padding:12px 0; border-top:1px solid #d8e5d0;text-align:right;white-space:nowrap;">
        ${formats.currency.format(item.unitPrice * item.quantity)}
      </td>
    </tr>`).join("");

  const html = `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#fffdf8;color:#1f3d33;font:16px/1.55 Arial,sans-serif;">
  <table role="presentation" style="width:100%;background:#fffdf8;" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" style="width:100%;max-width:600px;background:#fff;border:1px solid #d8e5d0;border-radius:20px;" cellspacing="0" cellpadding="0">
        <tr><td style="background:#e8f1dd;border-radius:19px 19px 0 0;padding:16px 24px;color:#245c45;font-size:22px;font-weight:bold;">bloomie<span style="color:#c45c15;">.</span></td></tr>
        <tr><td style="padding:24px;">
          <p style="margin:0 0 8px;color:#245c45;font-size:14px;font-weight:bold;">${badge}</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;">${title}</h1>
          <p style="margin:0 0 8px;">Chào ${escapeHtml(order.recipient)},</p>
          <p style="margin:0 0 20px;color:#4a5568;">${introduction}</p>
          <p style="margin:0;padding:12px 16px;background:#e8f1dd;border-radius:12px;">
            Mã đơn <strong>${orderCode}</strong><br>
            <span style="color:#4a5568;">Ngày đặt ${placedAt}</span>${completedAt ? `<br><span style="color:#4a5568;">Hoàn tất ${completedAt}</span>` : ""}
          </p>
          <h2 style="margin:24px 0 12px;font-size:18px;">Sản phẩm trong đơn</h2>
          <table aria-label="Sản phẩm trong đơn" style="width:100%;border-collapse:collapse;" cellspacing="0" cellpadding="0">
            <thead><tr>
              <th scope="col" style="padding:0 8px 8px 0;text-align:left;font-size:14px;color:#4a5568;">Sản phẩm</th>
              <th scope="col" style="padding:0 0 8px;text-align:right;font-size:14px;color:#4a5568;">Thành tiền</th>
            </tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr>
              <th scope="row" style="padding:12px 8px 0 0;border-top:1px solid #d8e5d0;text-align:left;">Tổng đơn hàng</th>
              <td style="padding:12px 0 0;border-top:1px solid #d8e5d0;text-align:right;color:#245c45;font-size:20px;font-weight:bold;white-space:nowrap;">${total}</td>
            </tr></tfoot>
          </table>
          <p style="margin:12px 0 24px;color:#4a5568;">${payment}</p>
          <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:12px 24px;background:#245c45;border-radius:999px;color:#fff;font-weight:bold;text-decoration:none;">Xem chi tiết đơn hàng →</a>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #d8e5d0;color:#4a5568;font-size:14px;">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
