"use client";

import { useEffect, useState, type FormEvent } from "react";
import CreatorEvidence from "../../components/creator-evidence";
import type { createClient } from "../../lib/supabase-browser";

export default function CreatorProfileReview({
  applicationId,
  userId,
  supabase,
}: {
  applicationId: string;
  userId: string | null;
  supabase: ReturnType<typeof createClient>;
}) {
  const [note, setNote] = useState("");
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Đang tải ghi chú và xác minh…");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [notes, evidence] = await Promise.all([
          supabase.from("creator_internal_notes")
            .select("note").eq("application_id", applicationId).maybeSingle(),
          supabase.from("creator_evidence_reviews")
            .select("object_id,verification_status").eq("application_id", applicationId),
        ]);

        if (notes.error || evidence.error) {
          throw new Error("Không tải được dữ liệu rà soát.");
        }

        if (!active) return;

        setNote(notes.data?.note ?? "");
        setReviews(Object.fromEntries(
          (evidence.data ?? []).map(({ object_id, verification_status }) =>
            [object_id, verification_status],
          ),
        ));
        setReady(true);
        setMessage("");
      } catch {
        if (active) setMessage("Chưa tải được ghi chú và xác minh. Hãy tải lại trang.");
      }
    }

    void load();
    return () => { active = false; };
  }, [applicationId, supabase]);

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || busy) return;

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase.from("creator_internal_notes").upsert(
        { application_id: applicationId, note },
        { onConflict: "application_id" },
      );
      if (error) throw error;
      setMessage("Đã lưu ghi chú nội bộ.");
    } catch {
      setMessage("Chưa lưu được ghi chú. Nội dung bạn nhập vẫn còn trong ô.");
    } finally {
      setBusy(false);
    }
  }

  async function saveReview(objectId: string, status: string) {
    if (!ready || busy) return;

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase.from("creator_evidence_reviews").upsert(
        {
          application_id: applicationId,
          object_id: objectId,
          verification_status: status,
        },
        { onConflict: "application_id,object_id" },
      );
      if (error) throw error;
      setReviews((current) => ({ ...current, [objectId]: status }));
      setMessage("Đã lưu trạng thái xác minh.");
    } catch {
      setMessage("Chưa lưu được trạng thái xác minh. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="mt-5 rounded-xl border border-green-200 bg-white p-4">
        <form onSubmit={saveNote} className="space-y-3">
          <label className="grid gap-2 font-semibold">
            Ghi chú nội bộ
            <textarea
              className="rounded-lg border border-green-200 p-3 font-normal"
              rows={4}
              maxLength={5000}
              value={note}
              disabled={!ready || busy}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={!ready || busy}
            className="rounded-lg bg-[#286347] px-4 py-2 text-white disabled:opacity-50"
          >
            Lưu ghi chú
          </button>
        </form>
        {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      </section>

      <section className="mt-5 rounded-xl border border-green-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Minh chứng</h2>
        {userId ? (
          <CreatorEvidence
            userId={userId}
            renderReview={(objectId) => (
              <label className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                Trạng thái xác minh
                <select
                  className="rounded-md border border-green-200 bg-white p-1"
                  value={reviews[objectId] ?? "pending"}
                  disabled={!ready || busy}
                  onChange={(event) => void saveReview(objectId, event.target.value)}
                >
                  <option value="pending">Chưa xác minh</option>
                  <option value="verified">Đã xác minh</option>
                  <option value="rejected">Không đạt</option>
                </select>
              </label>
            )}
          />
        ) : (
          <p>Hồ sơ chưa gắn với tài khoản Creator để xem minh chứng.</p>
        )}
      </section>
    </>
  );
}