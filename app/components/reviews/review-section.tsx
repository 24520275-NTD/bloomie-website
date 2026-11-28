"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ReviewFilters, ReviewList, ReviewSummary, focus, pill } from "./review-display";
import { ReviewForm } from "./review-form";
import { reviewImage, useReviews, type Review, type ReviewFilter, type ReviewSort } from "./use-reviews";

export default function ReviewSection({ product }: { product: string }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Review | null | undefined>(undefined);
  const [photo, setPhoto] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLDivElement>(null);
  const { reviews, orders, loading, error, signedIn, reload, save, vote, moderate } = useReviews(product, filter, sort, page);

  useEffect(() => {
    const element = dialog.current;
    if (photo && element && !element.open) element.showModal();
  }, [photo]);

  useEffect(() => {
    if (editing !== undefined) form.current?.focus();
  }, [editing]);

  async function remove(item: Review) {
    if (!window.confirm("Bạn có muốn xóa đánh giá này?")) return;
    setNotice("");
    setFailure("");
    const fields = new FormData();
    fields.set("action", "delete");
    fields.set("review", item.id);
    try {
      await save(fields);
      if (editing?.id === item.id) setEditing(undefined);
      if (page > 1 && reviews?.items.length === 1) setPage(page - 1);
      setNotice("Đã xóa đánh giá.");
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Chưa xóa được đánh giá.");
    }
  }

  return (
    <section aria-labelledby="product-reviews" className="mt-10 min-w-0 text-base text-[#1F3D33]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id="product-reviews" className="font-display text-3xl font-bold">Đánh giá sản phẩm</h2>
        {reviews && !signedIn && <Link href="/dang-nhap" className={pill}>Đăng nhập để viết đánh giá</Link>}
        {reviews && signedIn && orders.length > 0 && <button type="button" onClick={() => setEditing(null)} className={`bloomie-button ${focus}`}>Viết đánh giá</button>}
      </div>
      {reviews && signedIn && !orders.length && (
        <p className="mb-5 text-[#4A5568]">
          {reviews.has_reviewed
            ? "Bạn chưa có lượt đánh giá mới. Bạn có thể sửa hoặc xóa đánh giá đã đăng."
            : "Chỉ khách đã mua sản phẩm này mới có thể đánh giá"}
        </p>
      )}
      {notice && <p role="status" className="mb-4 rounded-2xl bg-[#E8F1DD] p-4 font-semibold">{notice}</p>}
      {failure && <p role="alert" className="mb-4 text-[#982A20]">{failure}</p>}
      {error && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[32px] border border-[#DCE8D5] bg-white p-5">
        {error} <button type="button" className={pill} onClick={reload}>Thử lại</button>
      </div>}
      {loading && !reviews && <div role="status" className="grid gap-6 lg:grid-cols-3">
        <span className="sr-only">Đang tải đánh giá</span>
        <div aria-hidden="true" className="h-56 rounded-[32px] bg-[#E8F1DD] motion-safe:animate-pulse" />
        <div aria-hidden="true" className="h-56 rounded-[32px] bg-[#E8F1DD] motion-safe:animate-pulse lg:col-span-2" />
      </div>}
      {reviews && <div className="grid items-start gap-6 lg:grid-cols-3">
        <ReviewSummary reviews={reviews} />
        <div className="grid min-w-0 gap-5 lg:col-span-2">
          <ReviewFilters reviews={reviews} filter={filter} sort={sort}
            onFilter={(value) => { setFilter(value); setPage(1); }}
            onSort={(value) => { setSort(value); setPage(1); }} />
          {loading ? <div role="status" className="h-56 rounded-[32px] bg-[#E8F1DD] motion-safe:animate-pulse"><span className="sr-only">Đang tải đánh giá</span></div>
            : !error && <ReviewList reviews={reviews} page={page} onPage={setPage} actions={{
            signedIn, admin: reviews.admin, onEdit: setEditing, onDelete: remove, onPhoto: setPhoto, vote, moderate,
          }} />}
        </div>
      </div>}
      {signedIn && editing !== undefined && <div ref={form} tabIndex={-1} className="mt-5">
        <ReviewForm key={editing?.id ?? "new"} product={product} orders={orders} item={editing}
          onClose={() => setEditing(undefined)} onSave={async (fields) => {
            await save(fields);
            setNotice(editing ? "Đã cập nhật đánh giá." : "Cảm ơn bạn đã đánh giá");
            setEditing(undefined);
            if (!editing) { setFilter("all"); setSort("recent"); setPage(1); }
          }} />
      </div>}
      <dialog ref={dialog} aria-label="Ảnh đánh giá" onClose={() => setPhoto(null)} className="m-auto w-[min(94vw,56rem)] rounded-[32px] border border-[#DCE8D5] bg-white p-4 backdrop:bg-black/55">
        {photo && <Image src={reviewImage(photo)} alt="Ảnh đính kèm của đánh giá" unoptimized width={1000} height={1000} className="mx-auto h-auto max-h-[75vh] w-full object-contain" />}
        <div className="mt-4 text-center"><button type="button" className={pill} onClick={() => dialog.current?.close()}>Đóng ảnh</button></div>
      </dialog>
    </section>
  );
}
