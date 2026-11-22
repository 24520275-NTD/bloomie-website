export async function POST() {
  return Response.json(
    { error: "Bloomie hiện sử dụng thanh toán bằng ví giả lập." },
    { status: 410 },
  );
}