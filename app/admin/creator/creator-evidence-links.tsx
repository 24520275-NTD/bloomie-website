"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import type { createClient } from "../../lib/supabase-browser";

const categories = {
  credential: "Bằng cấp hoặc chứng chỉ",
  portfolio: "Portfolio hoặc hồ sơ nghề nghiệp",
  article: "Bài viết",
  video: "Video",
  other: "Khác",
};

const statuses = {
  pending: "Chưa xác minh",
  verified: "Đã xác minh",
  rejected: "Không đạt",
};

type EvidenceLink = {
  id: string;
  title: string;
  category: keyof typeof categories;
  url: string;
  verification_status: keyof typeof statuses;
  created_at: string;
};

const columns = "id,title,category,url,verification_status,created_at";
const inputClass = "w-full rounded-lg border border-green-200 bg-white px-3 py-2";

export default function CreatorEvidenceLinks({
  applicationId,
  supabase,
}: {
  applicationId: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const [links, setLinks] = useState<EvidenceLink[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Đang tải đường dẫn minh chứng…");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data, error } = await supabase
          .from("creator_evidence_links")
          .select(columns)
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!active) return;

        setLinks(data ?? []);
        setMessage("");
      } catch {
        if (active) setMessage("Chưa tải được đường dẫn. Hãy tải lại trang.");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [applicationId, supabase]);

  async function addLink(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !links) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const title = String(values.get("title") ?? "").trim();
    const category = String(values.get("category") ?? "");
    const url = String(values.get("url") ?? "").trim();

    if (!title || !url.startsWith("https://") || /\s/.test(url)) {
      setMessage("Hãy nhập tên minh chứng và đường dẫn HTTPS hợp lệ.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("creator_evidence_links")
        .insert({ application_id: applicationId, title, category, url })
        .select(columns)
        .single();

      if (error) throw error;

      setLinks((current) => [data, ...(current ?? [])]);
      form.reset();
      setMessage("Đã thêm đường dẫn minh chứng.");
    } catch {
      setMessage("Chưa lưu được đường dẫn. Nội dung bạn nhập vẫn còn.");
    } finally {
      setBusy(false);
    }
  }

  async function saveStatus(id: string, status: string) {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("creator_evidence_links")
        .update({ verification_status: status })
        .eq("id", id)
        .eq("application_id", applicationId)
        .select(columns)
        .single();

      if (error) throw error;

      setLinks((current) =>
        (current ?? []).map((link) => link.id === id ? data : link),
      );
      setMessage("Đã lưu trạng thái xác minh.");
    } catch {
      setMessage("Chưa lưu được trạng thái. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 space-y-4 rounded-xl border border-green-200 bg-white p-4">
      <h2 className="font-semibold">Đường dẫn minh chứng</h2>

      {links && (
        <form onSubmit={addLink}>
          <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Tên minh chứng
              <input name="title" className={inputClass} maxLength={200} required />
            </label>
            <label className="grid gap-1 text-sm">
              Loại minh chứng
              <select name="category" className={inputClass}>
                {Object.entries(categories).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Đường dẫn HTTPS
              <input name="url" type="url" className={inputClass} maxLength={2000} required />
            </label>
            <button type="submit"
              className="justify-self-start rounded-lg bg-[#286347] px-4 py-2 text-white disabled:opacity-60">
              Thêm đường dẫn
            </button>
          </fieldset>
        </form>
      )}

      {links?.length === 0 && <p className="text-sm">Chưa có đường dẫn minh chứng.</p>}

      {links?.map((link) => (
        <article key={link.id} className="space-y-2 rounded-lg border p-3">
          <a href={link.url} target="_blank" rel="noopener noreferrer"
            className="break-words font-medium text-[#286347] underline">
            {link.title}
          </a>
          <p className="text-sm">
            {categories[link.category]} · Ngày thêm{" "}
            {new Date(link.created_at).toLocaleDateString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
            })}
          </p>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            Trạng thái xác minh
            <select
              className="rounded-lg border p-1"
              value={link.verification_status}
              disabled={busy}
              onChange={(event) => void saveStatus(link.id, event.target.value)}
            >
              {Object.entries(statuses).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </article>
      ))}

      {message && <p role="status" className="text-sm">{message}</p>}
    </section>
  );
}