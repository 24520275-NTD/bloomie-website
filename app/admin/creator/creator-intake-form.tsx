"use client";

import { useState, type FormEvent } from "react";
import type { createClient } from "../../lib/supabase-browser";

const fields = [
  { name: "full_name", label: "Họ và tên", type: "text", min: 2, max: 100 },
  { name: "channel_name", label: "Tên kênh", type: "text", min: 1, max: 150 },
  {
    name: "contact_email",
    label: "Email liên hệ",
    type: "email",
    min: 3,
    max: 254,
  },
  { name: "phone", label: "Số điện thoại", type: "tel", min: 8, max: 25 },
  {
    name: "channel_url",
    label: "Đường dẫn kênh (https://)",
    type: "url",
    min: 1,
    max: 1000,
  },
  {
    name: "content_field",
    label: "Lĩnh vực nội dung",
    type: "text",
    min: 1,
    max: 300,
  },
] as const;

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-3 py-2";

export default function CreatorIntakeForm({
  supabase,
  onCreated,
}: {
  supabase: ReturnType<typeof createClient>;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const text = (name: string) => String(values.get(name) ?? "").trim();
    const followers = Number(text("followers"));

    setError("");
    setSuccess("");

    if (!text("channel_url").startsWith("https://")) {
      setError("Đường dẫn kênh cần bắt đầu bằng https://.");
      return;
    }

    if (!Number.isSafeInteger(followers) || followers < 0) {
      setError("Số người theo dõi phải là số nguyên từ 0 trở lên.");
      return;
    }

    setSaving(true);

    try {
      const { error: saveError } = await supabase.rpc(
        "create_creator_application_as_admin",
        {
          p_application: {
            ...Object.fromEntries(fields.map(({ name }) => [name, text(name)])),
            platform: text("platform"),
            followers,
            introduction: text("introduction"),
            professional_background: text("professional_background"),
          },
        },
      );

      if (saveError) {
        if (saveError.code === "42501") {
          setError("Tài khoản này không có quyền nhập hồ sơ Creator.");
        } else if (saveError.code === "P0001") {
          setError("Hãy kiểm tra lại thông tin hồ sơ Creator.");
        } else {
          setError("Chưa lưu được hồ sơ Creator. Hãy thử lại.");
        }
        return;
      }

      form.reset();
      setSuccess("Đã lưu hồ sơ ở trạng thái Chờ xét duyệt.");
      onCreated();
    } catch {
      setError("Chưa kết nối được để lưu hồ sơ. Hãy thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="group relative shrink-0">
      <summary className="w-fit cursor-pointer list-none rounded-full bg-[#245c45] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1c4b38] [&::-webkit-details-marker]:hidden">
        <span className="mr-1.5" aria-hidden="true">
          +
        </span>
        Nhập hồ sơ Creator
      </summary>

      <form
        className="absolute left-0 top-full z-30 mt-2 max-h-[65vh] w-[calc(100vw_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-green-100 bg-white p-5 shadow-xl sm:right-0 sm:left-auto"
        onSubmit={submit}
      >
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ name, label, type, min, max }) => (
            <label key={name} className="grid gap-1 text-sm font-medium">
              {label}
              <input
                className={inputClass}
                name={name}
                type={type}
                minLength={min}
                maxLength={max}
                required
              />
            </label>
          ))}

          <label className="grid gap-1 text-sm font-medium">
            Nền tảng
            <select
              className={inputClass}
              name="platform"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Chọn nền tảng
              </option>
              <option>TikTok</option>
              <option>Facebook</option>
              <option>YouTube</option>
              <option>Instagram</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Số người theo dõi
            <input
              className={inputClass}
              name="followers"
              type="number"
              min={0}
              max={Number.MAX_SAFE_INTEGER}
              step={1}
              defaultValue={0}
              required
            />
          </label>

          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Giới thiệu bản thân
            <textarea
              className={inputClass}
              name="introduction"
              rows={3}
              maxLength={3000}
            />
          </label>

          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Học vấn, chuyên môn và kinh nghiệm
            <textarea
              className={inputClass}
              name="professional_background"
              rows={4}
              maxLength={5000}
            />
          </label>

          <button
            type="submit"
            className="justify-self-start rounded-xl bg-[#286347] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Đang lưu…" : "Lưu hồ sơ Creator"}
          </button>
        </fieldset>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="mt-3 text-sm">
            {success}
          </p>
        )}
      </form>
    </details>
  );
}
