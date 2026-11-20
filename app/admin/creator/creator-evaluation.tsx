"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase-browser";
import { creatorRubric } from "./creator-rubric";

type Scores = Partial<Record<(typeof creatorRubric)[number]["id"], number>>;

export default function CreatorEvaluation({ applicationId }: { applicationId: string }) {
  const [supabase] = useState(() => createClient());
  const [scores, setScores] = useState<Scores>({});
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data, error } = await supabase.from("creator_evaluations")
          .select("scores").eq("application_id", applicationId).maybeSingle();
        if (error) throw error;
        if (active) {
          setScores(data?.scores ?? {});
          setReady(true);
        }
      } catch {
        if (active) setMessage("Chưa tải được bảng đánh giá. Hãy tải lại trang.");
      }
    }

    void load();
    return () => { active = false; };
  }, [applicationId, supabase]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.from("creator_evaluations").upsert({
        application_id: applicationId,
        scores,
      }, { onConflict: "application_id" });
      if (error) throw error;
      setMessage("Đã lưu bảng đánh giá.");
    } catch {
      setMessage("Chưa lưu được bảng đánh giá. Bạn có thể thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-3 space-y-4" onSubmit={save}>
      {!ready && !message && <p role="status">Đang tải bảng đánh giá…</p>}
      {ready && (
        <>
          <p className="text-sm">Để trống những tiêu chí chưa có dữ liệu xác minh, đặc biệt là CTR và tỷ lệ chuyển đổi.</p>
          <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2">
            {creatorRubric.map(({ id, label, opts }) => (
              <label key={id} className="grid min-w-0 gap-2 text-sm font-medium">
                {id}. {label}
                <select
                  value={scores[id] ?? ""}
                  className="w-full rounded-lg border border-green-200 bg-white px-3 py-2"
                  onChange={({ target }) => {
                    const value = target.value;
                    setScores((previous) => {
                      const next = { ...previous };
                      if (value === "") delete next[id];
                      else next[id] = Number(value);
                      return next;
                    });
                  }}
                >
                  <option value="">Chưa có dữ liệu</option>
                  {opts.map((description, score) => (
                    <option key={score} value={score}>{score} – {description}</option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
          <button disabled={busy} className="rounded-lg bg-[#286347] px-4 py-2 text-white disabled:opacity-50">
            {busy ? "Đang lưu…" : "Lưu điểm Creator"}
          </button>
        </>
      )}
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  );
}
