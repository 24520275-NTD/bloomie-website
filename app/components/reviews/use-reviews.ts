"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, hasSupabaseConfig } from "../../lib/supabase-browser";

export const filters = [
  ["all", "Tất cả"], ["5", "5 sao"], ["4", "4 sao"], ["3", "3 sao"],
  ["2", "2 sao"], ["1", "1 sao"], ["comment", "Có bình luận"], ["images", "Có hình ảnh"],
] as const;
export const pageSize = 5;
export type ReviewFilter = (typeof filters)[number][0];
export type ReviewSort = "recent" | "helpful";
export type Review = {
  id: string; stars: number; comment: string; masked_name: string; reply: string;
  created_at: string; hidden: boolean; is_mine: boolean; images: string[]; helpful: number; voted: boolean;
};
export type Reviews = {
  average: number;
  counts: Record<ReviewFilter, number>;
  total: number;
  items: Review[];
  admin: boolean;
  has_reviewed: boolean;
};
export type ReviewOrder = { order_id: string; created_at: string };
const loadError = "Chưa tải được đánh giá. Bạn thử lại nhé.";

export const reviewDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });
export const reviewImage = (id: string) => `/api/reviews?image=${encodeURIComponent(id)}`;

export function useReviews(product: string, filter: ReviewFilter, sort: ReviewSort, page: number) {
  const supabase = useMemo(() => hasSupabaseConfig ? createClient() : null, []);
  const [revision, setRevision] = useState(0);
  const [session, setSession] = useState<string | null | undefined>(undefined);
  const [result, setResult] = useState<{
    key: string; scope: string; reviews: Reviews; orders: ReviewOrder[];
  }>();
  const [failure, setFailure] = useState<{ key: string; message: string }>();
  const scope = JSON.stringify([product, session]);
  const key = JSON.stringify([product, filter, sort, page, revision, session]);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, current) => setSession(current?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || session === undefined) return;
    let active = true;
    const client = supabase;
    async function load() {
      try {
        const [list, eligibility] = await Promise.all([
          client.rpc("list_reviews", { p_product: product, p_filter: filter, p_sort: sort, p_page: page }),
          session ? client.rpc("review_orders", { p_product: product }) : Promise.resolve({ data: [], error: null }),
        ]);
        if (list.error || eligibility.error || !list.data) throw new Error(loadError);
        if (active) {
          setResult({ key, scope, reviews: list.data, orders: eligibility.data ?? [] });
          setFailure(undefined);
        }
      } catch {
        if (active) setFailure({ key, message: loadError });
      }
    }
    void load();
    return () => { active = false; };
  }, [supabase, session, key, scope, product, filter, sort, page]);

  const current = result?.scope === scope ? result : undefined;
  const error = !supabase ? loadError : failure?.key === key ? failure.message : undefined;
  const reload = () => setRevision((previous) => previous + 1);

  async function save(form: FormData) {
    const response = await fetch("/api/reviews", { method: "POST", body: form });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message ?? "Chưa lưu được đánh giá. Bạn thử lại nhé.");
    }
    reload();
  }

  async function vote(review: Review) {
    const res = await supabase?.rpc("set_review_helpful", { p_review: review.id, p_helpful: !review.voted });
    if (!res || res.error) throw new Error("Chưa lưu được bình chọn.");
    reload();
  }

  async function moderate(review: Review, hidden: boolean, reply: string) {
    const res = await supabase?.rpc("moderate_review", {
      p_review: review.id, p_hidden: hidden, p_reply: reply,
    });
    if (!res || res.error) throw new Error("Chưa lưu được thay đổi của Bloomie.");
    reload();
  }

  return {
    reviews: current?.reviews,
    orders: current?.orders ?? [],
    loading: !error && current?.key !== key,
    error,
    signedIn: !!session, reload, save, vote, moderate,
  };
}
