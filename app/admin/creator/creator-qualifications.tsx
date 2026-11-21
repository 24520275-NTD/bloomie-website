"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import type { createClient } from "../../lib/supabase-browser";

const fields = [
  { key: "education_level", label: "Trình độ học vấn", max: 200, rows: 1 },
  { key: "field_of_study", label: "Chuyên ngành đào tạo", max: 200, rows: 1 },
  { key: "certifications", label: "Chứng chỉ chuyên môn", max: 1000, rows: 2 },
  { key: "training_institution", label: "Đơn vị đào tạo", max: 300, rows: 1 },
  { key: "work_experience", label: "Kinh nghiệm hoạt động", max: 2000, rows: 3 },
  { key: "teaching_experience", label: "Kinh nghiệm giảng dạy hoặc hỗ trợ trẻ", max: 2000, rows: 3 },
  { key: "professional_projects", label: "Dự án và hoạt động chuyên môn", max: 2000, rows: 3 },
] as const;

type Qualifications = Partial<Record<(typeof fields)[number]["key"], string | null>>;

export default function CreatorQualifications({
  applicationId,
  supabase,
}: {
  applicationId: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const [details, setDetails] = useState<Qualifications | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Đang tải thông tin chuyên môn…");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data, error } = await supabase
          .from("creator_qualifications")
          .select("education_level,field_of_study,certifications,training_institution,work_experience,teaching_experience,professional_projects")
          .eq("application_id", applicationId)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;
        setDetails(data ?? {});
        setMessage("");
      } catch {
        if (active) setMessage("Chưa tải được thông tin chuyên môn. Hãy tải lại trang.");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [applicationId, supabase]);

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!details || saving) return;

    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      fields.map(({ key }) => [key, String(form.get(key) ?? "").trim() || null]),
    );

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.from("creator_qualifications").upsert(
        { ...values, application_id: applicationId },
        { onConflict: "application_id" },
      );
      if (error) throw error;

      setMessage("Đã lưu thông tin chuyên môn.");
    } catch {
      setMessage("Chưa lưu được. Nội dung bạn nhập vẫn còn trong biểu mẫu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-green-200 bg-white p-4">
      <h2 className="font-semibold">Thông tin chuyên môn chi tiết</h2>

      {details && (
        <form onSubmit={save} className="mt-4">
          <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
            {fields.map(({ key, label, max, rows }) => (
              <label key={key} className="grid gap-1 text-sm">
                {label}
                <textarea
                  name={key}
                  rows={rows}
                  maxLength={max}
                  defaultValue={details[key] ?? ""}
                  className="w-full rounded-lg border border-green-200 p-2"
                />
              </label>
            ))}
            <button
              type="submit"
              className="justify-self-start rounded-lg bg-[#286347] px-4 py-2 text-white disabled:opacity-60"
            >
              {saving ? "Đang lưu…" : "Lưu chuyên môn"}
            </button>
          </fieldset>
        </form>
      )}

      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    </section>
  );
}