"use client";

import Link from "next/link";
import Image from "next/image";
import creatorHero from "../../../public/assets/bo-dung-cu-hoc-tap.png";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CreatorEvidence from "../../components/creator-evidence";
import { createClient } from "../../lib/supabase-browser";
import "../../home.css";

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
  const [contentField, setContentField] = useState("");

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
          setMessage(
            "Tài khoản đã gửi hồ sơ. Hãy tải lại trang để xem trạng thái.",
          );
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
    <main className="bloomie-storefront min-h-screen bg-[#f8f7f2] px-4 py-6 text-[#1f3d33] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-[1120px]">
        <Link
          href="/"
          className="inline-flex rounded-full border border-[#dce4d9] px-3 py-1.5 text-xs font-semibold hover:bg-white"
        >
          ← Trang chủ Bloomie
        </Link>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#526d5f]">
              CỘNG ĐỒNG CREATOR BLOOMIE
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Đăng ký trở thành Creator
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#526d5f]">
              Giới thiệu kênh, lĩnh vực hoạt động và kinh nghiệm của bạn để
              Bloomie xem xét cơ hội hợp tác.
            </p>

            <section className="relative mt-6 rounded-3xl bg-[#e4efe2] p-5 sm:p-6">
              <span
                aria-hidden="true"
                className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-2xl bg-[#b85b21] text-lg text-white"
              >
                ✦
              </span>
              <Image
                src={creatorHero}
                alt="Bộ học liệu sáng tạo Bloomie"
                className="aspect-[1.86] w-full rounded-2xl object-cover"
                sizes="(min-width: 1024px) 420px, 100vw"
                priority
              />
              <h2 className="mt-5 text-xl font-bold">Mỗi ngày một khám phá</h2>
              <p className="mt-1 text-sm leading-6 text-[#526d5f]">
                Chơi vui, học thật, lớn lên tự tin.
              </p>
              <ul className="mt-4 space-y-3 border-t border-[#d1dfd0] pt-4 text-sm">
                {[
                  "Trải nghiệm sớm các bộ học liệu tuyển chọn",
                  "Tự do sáng tạo theo chất riêng của kênh",
                  "Trao đổi rõ ràng về hình thức hợp tác",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-white font-semibold"
                    >
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="min-w-0 rounded-3xl border border-[#e2e8df] bg-white p-5 shadow-sm sm:p-8">
            <header className="border-b border-[#e5ebe2] pb-4">
              <h2 className="text-xl font-bold sm:text-2xl">
                {application ? "Hồ sơ của bạn" : "Thông tin đăng ký hợp tác"}
              </h2>
              {!application && (
                <p className="mt-2 text-xs leading-5 text-[#526d5f]">
                  Các mục có dấu <span className="text-[#a45527]">*</span> là
                  bắt buộc.
                </p>
              )}
            </header>

            {loading ? (
              <p role="status" className="mt-5">
                Đang kiểm tra hồ sơ…
              </p>
            ) : loadFailed ? null : !userId ? (
              <div className="mt-5 space-y-4">
                <p>Bạn cần đăng nhập trước khi gửi hồ sơ.</p>
                <Link
                  href="/tai-khoan"
                  className="inline-flex rounded-full bg-[#24543f] px-5 py-3 text-sm font-semibold text-white"
                >
                  Đăng nhập / Đăng ký
                </Link>
                <p className="text-sm text-[#526d5f]">
                  Sau khi đăng nhập, quay lại trang này để đăng ký Creator.
                </p>
              </div>
            ) : application ? (
              <div className="mt-5 space-y-3">
                <p>Họ tên: {application.full_name}</p>
                <p className="font-semibold">
                  Trạng thái:{" "}
                  {statusLabels[application.status] ?? application.status}
                </p>
                <CreatorEvidence key={userId} userId={userId} canUpload />
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="mt-5 grid gap-4 sm:grid-cols-2"
              >
                {fields
                  .filter((field) => field.name !== "content_field")
                  .map((field) => (
                    <label
                      key={field.name}
                      className={`block text-sm font-semibold ${
                        field.name === "channel_url" ? "sm:col-span-2" : ""
                      }`}
                    >
                      {field.label} <span className="text-[#a45527]">*</span>
                      <input
                        name={field.name}
                        type={field.type}
                        required
                        minLength={field.min}
                        maxLength={field.max}
                        defaultValue={
                          field.name === "contact_email" ? userEmail : ""
                        }
                        placeholder={
                          {
                            full_name: "Ví dụ: Nguyễn Minh Anh",
                            channel_name: "Ví dụ: Mẹ Bắp & Sóc",
                            contact_email: "ban@example.com",
                            phone: "0912 345 678",
                            channel_url: "https://tiktok.com/@kenhcuaban",
                          }[
                            field.name as
                              | "full_name"
                              | "channel_name"
                              | "contact_email"
                              | "phone"
                              | "channel_url"
                          ]
                        }
                        className={inputStyle}
                      />
                    </label>
                  ))}

                <div className="sm:col-span-2">
                  <label
                    htmlFor="creator-content-field"
                    className="text-sm font-semibold"
                  >
                    Lĩnh vực nội dung <span className="text-[#a45527]">*</span>
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      "Nuôi dạy con",
                      "Mỹ thuật & Thủ công",
                      "STEM & Khám phá",
                      "Sách & Học liệu",
                    ].map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        aria-pressed={contentField === topic}
                        onClick={() => setContentField(topic)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          contentField === topic
                            ? "border-[#24543f] bg-[#24543f] text-white"
                            : "border-[#e2e8df] bg-[#f8f7f2] hover:bg-[#e4efe2]"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                  <input
                    id="creator-content-field"
                    name="content_field"
                    value={contentField}
                    onChange={(event) => setContentField(event.target.value)}
                    placeholder="Chọn nhanh hoặc nhập lĩnh vực của bạn"
                    maxLength={300}
                    required
                    className={inputStyle}
                  />
                </div>

                <label className="block text-sm font-semibold">
                  Nền tảng chính <span className="text-[#a45527]">*</span>
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

                <label className="block text-sm font-semibold">
                  Số người theo dõi <span className="text-[#a45527]">*</span>
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

                <label className="block text-sm font-semibold sm:col-span-2">
                  Giới thiệu kênh
                  <textarea
                    name="introduction"
                    rows={3}
                    maxLength={3000}
                    placeholder="Chia sẻ ngắn về bạn và đối tượng khán giả của kênh…"
                    className={inputStyle}
                  />
                </label>

                <label className="block text-sm font-semibold sm:col-span-2">
                  Học vấn, chuyên môn và kinh nghiệm
                  <textarea
                    name="professional_background"
                    rows={3}
                    maxLength={5000}
                    placeholder="Chia sẻ kinh nghiệm hoặc các chiến dịch bạn từng tham gia…"
                    className={inputStyle}
                  />
                </label>

                <label className="flex items-start gap-2 text-xs leading-5 sm:col-span-2">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 accent-[#24543f]"
                  />
                  Tôi đồng ý gửi thông tin để Bloomie xem xét hồ sơ và liên hệ
                  hợp tác.
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5ebe2] pt-4 sm:col-span-2">
                  <p className="text-xs text-[#526d5f]">
                    Bloomie sẽ liên hệ qua email bạn cung cấp.
                  </p>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-[#24543f] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1b4433] disabled:opacity-50"
                  >
                    {busy ? "Đang gửi…" : "Gửi hồ sơ đăng ký →"}
                  </button>
                </div>
              </form>
            )}

            {message && (
              <p role="status" className="mt-4 text-sm">
                {message}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
