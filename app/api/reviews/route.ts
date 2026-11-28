import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import sharp from "sharp";

const bucket = "review-images";
const maxImageBytes = 5 * 1024 * 1024;
const maxRequestBytes = 4 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const failed = (message: string, status: number) => Response.json({ message }, { status });

async function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !serviceKey) return null;
  const store = await cookies();
  return {
    viewer: createServerClient(url, key, { cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => items.forEach(({ name, value, options }) => store.set(name, value, options)),
    } }),
    storageAdmin: createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}

export async function GET(request: Request) {
  const image = new URL(request.url).searchParams.get("image");
  if (!image || !uuid.test(image)) return new Response(null, { status: 404 });
  const supabase = await clients();
  if (!supabase) return new Response(null, { status: 503 });
  const { data: path } = await supabase.viewer.rpc("review_image_path", { p_image: image });
  if (!path) return new Response(null, { status: 404 });
  const { data: file, error } = await supabase.storageAdmin.storage.from(bucket).download(path);
  if (error || !file) return new Response(null, { status: 404 });
  return new Response(file, { headers: {
    "Content-Type": path.endsWith(".png") ? "image/png" : "image/jpeg",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return failed("Yêu cầu không hợp lệ.", 403);
  if (Number(request.headers.get("content-length")) > maxRequestBytes) {
    return failed("Tổng dung lượng ảnh gửi lên quá lớn.", 413);
  }
  const supabase = await clients();
  if (!supabase) return failed("Tính năng đánh giá chưa được cấu hình.", 503);
  const { data: { user } } = await supabase.viewer.auth.getUser();
  if (!user) return failed("Đăng nhập để viết đánh giá.", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failed("Không đọc được biểu mẫu đánh giá.", 400);
  }
  const review = String(form.get("review") ?? "");
  if (review && !uuid.test(review)) return failed("Mã đánh giá không hợp lệ.", 400);
  const storage = supabase.storageAdmin.storage.from(bucket);

  if (form.get("action") === "delete") {
    if (!review) return failed("Thiếu mã đánh giá.", 400);
    const { data, error } = await supabase.storageAdmin.rpc("delete_product_review", { p_actor: user.id, p_review: review });
    if (error) return failed("Không xóa được đánh giá.", 400);
    if (data?.length) await storage.remove(data);
    return Response.json({ ok: true });
  }

  const product = String(form.get("product") ?? "");
  const order = String(form.get("order") ?? "");
  const stars = String(form.get("stars") ?? "");
  const comment = String(form.get("comment") ?? "");
  const kept = form.getAll("keep").map(String);
  const files = form.getAll("images");
  if (!product || product.length > 200 || (!review && !uuid.test(order)) ||
      !/^[1-5]$/.test(stars) || Array.from(comment).length > 500) {
    return failed("Hãy chọn đơn mua hàng, từ 1 đến 5 sao và nhập tối đa 500 ký tự.", 400);
  }
  if (kept.some((id) => !uuid.test(id)) || kept.length + files.length > 3) {
    return failed("Chỉ được đính kèm tối đa 3 ảnh.", 400);
  }
  if (!review) {
    const { data, error } = await supabase.viewer.rpc("review_orders", { p_product: product });
    if (error) return failed("Chưa kiểm tra được đơn hàng. Bạn thử lại nhé.", 503);
    if (!data?.some((item: { order_id: string }) => item.order_id === order)) {
      return failed("Chỉ khách đã mua và chưa đánh giá sản phẩm trong đơn này mới có thể gửi đánh giá.", 403);
    }
  }

  const uploads: { path: string; bytes: Buffer; contentType: string }[] = [];
  for (const file of files) {
    if (!(file instanceof File) || !["image/jpeg", "image/png"].includes(file.type) || file.size === 0 || file.size > maxImageBytes) {
      return failed("Chỉ chấp nhận ảnh JPG hoặc PNG, tối đa 5 MB mỗi ảnh.", 400);
    }
    try {
      const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 24000000 });
      const { format } = await image.metadata();
      if (file.type !== `image/${format}`) throw new Error("Invalid image");
      const bytes = await image.rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
      uploads.push({ bytes, path: `${crypto.randomUUID()}.jpg`, contentType: "image/jpeg" });
    } catch {
      return failed("Ảnh không đọc được. Hãy chọn tệp JPG hoặc PNG khác.", 400);
    }
  }

  const paths: string[] = [];
  for (const { path, bytes, contentType } of uploads) {
    const { error } = await storage.upload(path, bytes, { contentType });
    if (error) {
      if (paths.length) await storage.remove(paths);
      return failed("Chưa tải được ảnh. Bạn thử lại nhé.", 503);
    }
    paths.push(path);
  }
  const { data, error } = await supabase.storageAdmin.rpc("save_product_review", {
    p_actor: user.id, p_product: product, p_order: review ? null : order, p_review: review || null,
    p_stars: Number(stars), p_comment: comment, p_keep: kept, p_paths: paths,
  });
  if (error) {
    // A transport failure can occur after the database commits. Only discard files after a confirmed rejection.
    if (paths.length && (error.code === "P0001" || error.code.startsWith("23"))) await storage.remove(paths);
    return failed(error.code === "P0001" ? error.message : "Chưa lưu được đánh giá. Bạn thử lại nhé.", 400);
  }
  if (data?.length) await storage.remove(data);
  return Response.json({ ok: true });
}
