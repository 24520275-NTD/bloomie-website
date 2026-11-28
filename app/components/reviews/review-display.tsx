"use client";

import { Star, ThumbsUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { filters, pageSize, reviewDate, reviewImage, type Review, type ReviewFilter, type ReviewSort, type Reviews } from "./use-reviews";

export const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245C45] active:brightness-95";
export const pill = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#CBDCC2] px-4 py-2 font-semibold hover:bg-[#E8F1DD] ${focus}`;
const stars = [1, 2, 3, 4, 5];

export function StarRating({ value, onChange }: { value: number; onChange?: (value: number) => void }) {
  if (onChange) {
    return (
      <fieldset>
        <legend className="mb-2 font-semibold">Số sao (bắt buộc)</legend>
        <div className="flex flex-wrap gap-2">
          {stars.map((star) => (
            <label key={star} className="cursor-pointer rounded-full p-2 hover:bg-[#E8F1DD] has-focus-visible:outline-2 has-focus-visible:outline-[#245C45]">
              <input type="radio" name="stars" value={star} checked={value === star} onChange={() => onChange(star)} className="sr-only" required aria-label={`${star} trên 5 sao`} />
              <Star aria-hidden="true" className={star <= value ? "fill-[#F58220] text-[#8C460B]" : "text-[#4A5568]"} />
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <span role="img" aria-label={`${new Intl.NumberFormat("vi-VN",{ maximumFractionDigits: 1 }).format(value)} trên 5 sao`} className="inline-flex gap-1">
      {stars.map((star) => (
        <span key={star} className="relative inline-grid size-5">
          <Star size={20} aria-hidden="true" className="text-[#4A5568]" />
          <span aria-hidden="true" className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(1, value - star + 1)) * 100}%` }}>
            <Star size={20} className="max-w-none fill-[#F58220] text-[#8C460B]" />
          </span>
        </span>
      ))}
    </span>
  );
}

export function ReviewSummary({ reviews }: { reviews: Reviews }) {
  return (
    <aside aria-label="Tóm tắt đánh giá" className="rounded-[32px] border border-[#DCE8D5] bg-[#E8F1DD] p-6 shadow-sm lg:sticky lg:top-6">
      <p className="text-4xl font-bold">{new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(reviews.average)} <span className="text-xl">/ 5</span></p>
      <div className="mt-3"><StarRating value={reviews.average} /></div>
      <p className="mt-2 text-[#4A5568]">{reviews.counts.all} đánh giá</p>
      <dl className="mt-5 grid gap-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.counts[String(star) as ReviewFilter];
          return (
            <div key={star} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <dt>{star} sao</dt>
              <dd className="contents">
                <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-white">
                  <span className="block h-full rounded-full bg-[#245C45]" style={{ width: `${reviews.counts.all ? count / reviews.counts.all * 100 : 0}%` }} />
                </span>
                <span>{count}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </aside>
  );
}

export function ReviewFilters({ reviews, filter, sort, onFilter, onSort }: {
  reviews: Reviews; filter: ReviewFilter; sort: ReviewSort;
  onFilter: (filter: ReviewFilter) => void; onSort: (sort: ReviewSort) => void;
}) {
  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Lọc đánh giá" className="flex gap-2 overflow-x-auto p-1 sm:flex-wrap">
        {filters.map(([value, label]) => (
          <button type="button" key={value} aria-pressed={value === filter} onClick={() => onFilter(value)}
            className={`shrink-0 whitespace-nowrap ${pill} ${value === filter ? "bg-[#245C45] text-white hover:bg-[#1F4D3B]" : "bg-white"}`}>
            {label} ({reviews.counts[value]})
          </button>
        ))}
      </div>
      <label className="flex flex-wrap items-center gap-3">
        Sắp xếp
        <select value={sort} onChange={(e) => onSort(e.target.value === "helpful" ? "helpful" : "recent")} className={`${pill} bg-white`}>
          <option value="recent">Mới nhất</option>
          <option value="helpful">Hữu ích nhất</option>
        </select>
      </label>
    </div>
  );
}

export type ReviewActions = {
  signedIn: boolean;
  admin: boolean;
  onEdit: (item: Review) => void;
  onDelete: (item: Review) => void;
  onPhoto: (id: string) => void;
  vote: (item: Review) => Promise<void>;
  moderate: (item: Review, hidden: boolean, reply: string) => Promise<void>;
};

export function ReviewItem({ item, actions }: { item: Review; actions: ReviewActions }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try { await action(); }
    catch (error) { setError(error instanceof Error ? error.message : "Bạn thử lại nhé."); }
    finally { setBusy(false); }
  }

  return (
    <article className="rounded-[32px] border border-[#DCE8D5] bg-white p-5 shadow-sm sm:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-[#E8F1DD] font-bold text-[#245C45]">{item.masked_name[0]}</span>
        <div className="grow">
          <p className="font-semibold">{item.masked_name}</p>
          <time dateTime={item.created_at} className="text-[#4A5568]">{reviewDate.format(new Date(item.created_at))}</time>
        </div>
        <StarRating value={item.stars} />
      </header>
      {item.hidden && <p className="mt-3 font-semibold text-[#4A5568]">Đánh giá đã ẩn</p>}
      {item.comment && <p className="mt-4 wrap-break-word whitespace-pre-wrap">{item.comment}</p>}
      {item.images.length > 0 && <div className="mt-4 flex flex-wrap gap-3">
        {item.images.map((id, index) => (
          <button key={id} type="button" onClick={() => actions.onPhoto(id)} aria-label={`Phóng to ảnh ${index + 1}`} className={`relative size-20 overflow-hidden rounded-2xl hover:brightness-95 ${focus}`}>
            <Image src={reviewImage(id)} alt="" unoptimized fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>}
      {item.reply && <div className="mt-4 rounded-2xl bg-[#E8F1DD] p-4">
        <p className="font-semibold">Phản hồi của Bloomie</p>
        <p className="mt-1 wrap-break-word whitespace-pre-wrap">{item.reply}</p>
      </div>}
      <div className="mt-4 flex flex-wrap gap-2">
        {!actions.signedIn && !item.hidden && <Link href="/dang-nhap" className={pill}>
          <ThumbsUp size={16} aria-hidden="true" /> Hữu ích ({item.helpful})
        </Link>}
        {actions.signedIn && !item.is_mine && !item.hidden && <button type="button" className={pill} aria-pressed={item.voted} disabled={busy} onClick={() => void run(() => actions.vote(item))}>
          <ThumbsUp size={16} aria-hidden="true" className={item.voted ? "fill-current" : ""} /> Hữu ích ({item.helpful})
        </button>}
        {item.is_mine && <>
          <span className="self-center text-[#4A5568]">Hữu ích ({item.helpful})</span>
          <button className={pill} type="button" onClick={() => actions.onEdit(item)}>Sửa</button>
          <button className={pill} type="button" onClick={() => actions.onDelete(item)}>Xóa</button>
        </>}
      </div>
      {actions.admin && <form className="mt-4 grid gap-3 border-t border-[#DCE8D5] pt-4" onSubmit={(event) => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        void run(() => actions.moderate(item, fields.has("hidden"), String(fields.get("reply") ?? "")));
      }}>
        <label className="grid gap-2">Phản hồi của Bloomie
          <textarea name="reply" maxLength={500} defaultValue={item.reply} rows={2} className="bloomie-field py-2" />
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" name="hidden" defaultChecked={item.hidden} /> Ẩn đánh giá</label>
        <button disabled={busy} className={`${pill} justify-self-start`} type="submit">Lưu kiểm duyệt</button>
      </form>}
      {error && <p role="alert" className="mt-3 text-[#982A20]">{error}</p>}
    </article>
  );
}

export function ReviewList({ reviews, page, onPage, actions }: {
  reviews: Reviews; page: number; onPage: (page: number) => void; actions: ReviewActions;
}) {
  const pages = Math.ceil(reviews.total / pageSize);
  return (
    <>
      {reviews.items.length ? (
        <div className="grid gap-4">{reviews.items.map((item) => <ReviewItem key={item.id} item={item} actions={actions} />)}</div>
      ) : (
        <p className="rounded-[32px] border border-[#DCE8D5] bg-white p-5 text-[#4A5568]">
          {reviews.counts.all ? "Không có đánh giá phù hợp với bộ lọc." : "Sản phẩm chưa có đánh giá. Hãy là người đầu tiên chia sẻ cảm nhận."}
        </p>
      )}
      {(pages > 1 || page > 1) && (
        <nav aria-label="Phân trang đánh giá" className="flex flex-wrap items-center gap-2">
          <button type="button" className={`${pill} disabled:opacity-50`} disabled={page <= 1} onClick={() => onPage(page-1)}>Trước</button>
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => Math.max(1, Math.min(page - 2, pages - 4)) + i).map((number) => (
            <button type="button" key={number} aria-label={`Trang ${number}`} aria-current={page === number ? "page" : undefined}
              className={`grid size-11 place-items-center rounded-full border border-[#CBDCC2] ${focus} ${page === number ? "bg-[#245C45] text-white" : "bg-white hover:bg-[#E8F1DD]"}`} onClick={() => onPage(number)}>{number}</button>
          ))}
          <button type="button" className={`${pill} disabled:opacity-50`} disabled={page >= pages} onClick={() => onPage(page+1)}>Sau</button>
        </nav>
      )}
    </>
  );
}
