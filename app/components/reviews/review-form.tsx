"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { StarRating, focus, pill } from "./review-display";
import { reviewDate, reviewImage, type Review, type ReviewOrder } from "./use-reviews";

const imageLimit = 5 * 1024 * 1024;
const types = ["image/jpeg", "image/png"];

async function compressPhoto(file: File) {
  if (file.size <= 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không xử lý được ảnh.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    if (!blob || blob.size > 1024 * 1024) throw new Error("Không xử lý được ảnh.");
    return new File([blob], "anh-danh-gia.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

export function ReviewForm({ product, orders, item, onSave, onClose }: {
  product: string;
  orders: ReviewOrder[];
  item: Review | null;
  onSave: (form: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [stars, setStars] = useState(item?.stars ?? 0);
  const [comment, setComment] = useState(item?.comment ?? "");
  const [kept, setKept] = useState(item?.images ?? []);
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const previews = useRef(new Set<string>());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function addFiles(newFiles: File[]) {
    if (kept.length + files.length + newFiles.length > 3) return setError("Chỉ được đính kèm tối đa 3 ảnh.");
    if (newFiles.some((file) => !types.includes(file.type) || file.size === 0 || file.size > imageLimit)) {
      return setError("Chỉ chấp nhận ảnh JPG hoặc PNG, tối đa 5 MB mỗi ảnh.");
    }
    setFiles([...files, ...newFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { file, preview };
    })]);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    if (!stars) return setError("Bạn cần chọn số sao.");
    setBusy(true);
    setError("");
    try {
      fields.set("product", product);
      if (item) fields.set("review", item.id);
      for (const id of kept) fields.append("keep", id);
      for (const photo of await Promise.all(files.map(({ file }) => compressPhoto(file)))) fields.append("images", photo);
      await onSave(fields);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Chưa gửi được đánh giá.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} aria-label={item ? "Sửa đánh giá" : "Viết đánh giá"} className="rounded-[32px] border border-[#CBDCC2] bg-white p-5 shadow-sm sm:p-6">
      <fieldset disabled={busy} className="grid gap-4">
        <h3 className="text-xl font-bold">{item ? "Sửa đánh giá" : "Viết đánh giá"}</h3>
        {!item && <label className="grid gap-2 font-semibold">
          Đơn đã mua
          <select name="order" required className="bloomie-field">
            {orders.map((order) => <option key={order.order_id} value={order.order_id}>#{order.order_id.slice(0, 8).toUpperCase()} · {reviewDate.format(new Date(order.created_at))}</option>)}
          </select>
        </label>}
        <StarRating value={stars} onChange={setStars} />
        <label className="grid gap-2">
          <span className="font-semibold">Nhận xét (tùy chọn)</span>
          <textarea name="comment" rows={3} maxLength={500} value={comment} onChange={(event) => setComment(event.target.value)} className="bloomie-field py-3" />
          <span className="text-right text-[#4A5568]">{comment.length}/500 ký tự</span>
        </label>
        <label className="grid gap-2">
          <span className="font-semibold">Ảnh đính kèm (tùy chọn)</span>
          <span className="text-[#4A5568]">Tối đa 3 ảnh JPG hoặc PNG, mỗi ảnh tối đa 5 MB.</span>
          <span className={`relative justify-self-start ${pill} has-focus-visible:outline-2 has-focus-visible:outline-[#245C45] has-disabled:opacity-50`}>
            Chọn ảnh
            <input type="file" aria-label="Chọn ảnh đánh giá" accept="image/jpeg,image/png" multiple disabled={kept.length + files.length >= 3}
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-default"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }} />
          </span>
        </label>
        <div className="flex flex-wrap gap-3">
          {kept.map((id, i) => <div key={id} className="grid gap-1 text-center">
            <Image src={reviewImage(id)} unoptimized width={80} height={80} alt={`Ảnh đã lưu ${i+1}`} className="size-20 rounded-xl object-cover" />
            <button type="button" className={`${pill} px-2`} aria-label={`Xóa ảnh đã lưu ${i+1}`} onClick={() => setKept(kept.filter((value) => value !== id))}>Xóa</button>
          </div>)}
          {files.map(({ preview }, i) => <div key={preview} className="grid gap-1 text-center">
            <Image src={preview} unoptimized width={80} height={80} alt={`Ảnh xem trước ${i+1}`} className="size-20 rounded-xl object-cover" />
            <button type="button" className={pill} aria-label={`Xóa ảnh mới ${i+1}`} onClick={() => {
              URL.revokeObjectURL(preview);
              previews.current.delete(preview);
              setFiles(files.filter((_, index) => index !== i));
            }}>Xóa</button>
          </div>)}
        </div>
        {error && <p role="alert" className="text-[#982A20]">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={`bloomie-button ${focus}`}>{busy ? "Đang lưu…" : item ? "Lưu đánh giá" : "Gửi đánh giá"}</button>
          <button type="button" onClick={onClose} className={pill}>Đóng</button>
        </div>
      </fieldset>
    </form>
  );
}
