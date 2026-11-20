"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CreatorEvidence from "../../components/creator-evidence";
import { createClient } from "../../lib/supabase-browser";

type Application = {
  full_name: string;
  status: string;
};

const statusLabels: Record<string, string> = {
  pending: "Chờ xét duyệt",
  reviewing: "Đang xem xét",
  approved: "Đã duyệt",
  rejected: "Chưa được duyệt",
};

const fields = [
  { name: "full_name", label: "Họ và tên", type: "text", min: 2, max: 100 },
  { name: "channel_name", label: "Tên kênh", type: "text", min: 1, max: 150 },
  { name: "contact_email", label: "Email liên hệ", type: "email", min: 3, max: 254 },
  { name: "phone", label: "Số điện thoại", type: "tel", min: 8, max: 25 },
  { name: "channel_url", label: "Đường dẫn kênh (https://)", type: "url", min: 1, max: 1000 },
  { name: "content_field", label: "Lĩnh vực nội dung", type: "text", min: 1, max: 300 },
];

const platforms = ["TikTok", "Facebook", "YouTube", "Instagram"];

const inputStyle =
  "mt-2 w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-[#243c32]";

export default function CreatorRegistrationPage() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [application, setApplication] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active || error || !data.user) return;

        setUserId(data.user.id);
        setUserEmail(data.user.email ?? "");

        const result = await supabase
          .from("creator_applications")
          .select("full_name,status")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (result.error) throw result.error;
        if (active) setApplication(result.data);
      } catch {
        if (active) {
          setLoadFailed(true);
          setMessage("Chưa tải được hồ sơ. Hãy tải lại trang trước khi gửi.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const values = new FormData(event.currentTarget);
    const text = (name: string) => String(values.get(name) ?? "").trim();
    const followers = Number(text("followers"));
    const channelUrl = text("channel_url");

    if (!channelUrl.startsWith("https://")) {
      setMessage("Đường dẫn kênh cần bắt đầu bằng https://.");
      return;
    }

    if (!Number.isSafeInteger(followers) || followers < 0) {
      setMessage("Số người theo dõi phải là số nguyên từ 0 trở lên.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { data, error: authError } = await supabase.auth.getUser();

      if (authError || !data.user || data.user.id !== userId) {
        setUserId(null);
        setMessage("Vui lòng đăng nhập lại trước khi gửi hồ sơ.");
        return;
      }

      const payload = {
        user_id: data.user.id,
        full_name: text("full_name"),
        channel_name: text("channel_name"),
        contact_email: text("contact_email"),
        phone: text("phone"),
        platform: text("platform"),
        channel_url: channelUrl,
        content_field: text("content_field"),
        followers,
        introduction: text("introduction"),
        professional_background: text("professional_background"),
      };

      const { error } = await supabase
        .from("creator_applications")
        .insert(payload);

      if (error) {
        if (error.code === "23505") {
          setLoadFailed(true);
          setMessage("Tài khoản đã gửi hồ sơ. Hãy tải lại trang để xem trạng thái.");
        } else {
          setMessage(`Chưa gửi được hồ sơ: ${error.message}`);
        }
        return;
      }

      setApplication({ full_name: payload.full_name, status: "pending" });
      setMessage("Hồ sơ đã được gửi thành công.");
    } catch {
      setMessage("Kết nối bị gián đoạn. Hãy tải lại trang để kiểm tra hồ sơ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-12 text-[#243c32]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="font-semibold underline">
          ← Trang chủ Bloomie
        </Link>

        <h1 className="mt-8 text-3xl font-extrabold">
          Đăng ký trở thành Creator
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          Giới thiệu kênh, lĩnh vực hoạt động và kinh nghiệm của bạn
          để Bloomie xem xét cơ hội hợp tác.
        </p>

        {loading ? (
          <p className="mt-8">Đang kiểm tra hồ sơ…</p>
        ) : !userId ? (
          <section className="mt-8 rounded-3xl bg-white p-7">
            <p>Bạn cần đăng nhập trước khi gửi hồ sơ.</p>
            <Link
              href="/tai-khoan"
              className="mt-5 inline-block rounded-full bg-[#286347] px-6 py-3 text-white"
            >
              Đăng nhập / Đăng ký
            </Link>
            <p className="mt-4 text-sm">
              Sau khi đăng nhập, quay lại trang này để đăng ký Creator.
            </p>
          </section>
        ) : application ? (
          <section className="mt-8 rounded-3xl border border-green-100 bg-white p-7">
            <h2 className="text-xl font-bold">Hồ sơ của bạn</h2>
            <p className="mt-4">Họ tên: {application.full_name}</p>
            <p className="mt-3 font-semibold">
              Trạng thái:{" "}
              {statusLabels[application.status] ?? application.status}
            </p>

            <CreatorEvidence key={userId} userId={userId} canUpload />
          </section>
        ) : !loadFailed ? (
          <form onSubmit={submit} className="mt-8 space-y-6">
            {fields.map((field) => (
              <label key={field.name} className="block font-medium">
                {field.label} *
                <input
                  name={field.name}
                  type={field.type}
                  required
                  minLength={field.min}
                  maxLength={field.max}
                  defaultValue={field.name === "contact_email" ? userEmail : ""}
                  className={inputStyle}
                />
              </label>
            ))}

            <label className="block font-medium">
              Nền tảng chính *
              <select
                name="platform"
                required
                defaultValue=""
                className={inputStyle}
              >
                <option value="" disabled>
                  Chọn nền tảng
                </option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>

            <label className="block font-medium">
              Số người theo dõi *
              <input
                name="followers"
                type="number"
                min={0}
                max={Number.MAX_SAFE_INTEGER}
                step={1}
                required
                defaultValue={0}
                className={inputStyle}
              />
            </label>

            <label className="block font-medium">
              Giới thiệu bản thân
              <textarea
                name="introduction"
                rows={4}
                maxLength={3000}
                className={inputStyle}
              />
            </label>

            <label className="block font-medium">
              Học vấn, chuyên môn và kinh nghiệm
              <textarea
                name="professional_background"
                rows={5}
                maxLength={5000}
                className={inputStyle}
              />
            </label>

            <label className="flex items-start gap-3 text-sm leading-6">
              <input type="checkbox" required className="mt-1" />
              <span>
                Tôi đồng ý gửi các thông tin trên cho Bloomie để xem xét
                hồ sơ và liên hệ về việc hợp tác.
              </span>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-[#286347] px-8 py-4 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Đang gửi…" : "Gửi hồ sơ Creator"}
            </button>
          </form>
        ) : null}

        <p role="status" className="mt-6 leading-7">
          {message}
        </p>
      </div>
    </main>
  );
}