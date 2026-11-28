"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import hero from "../../public/assets/bo-dung-cu-hoc-tap.png";
import { createClient, hasSupabaseConfig } from "../lib/supabase-browser";
import { Icon } from "./bloomie-icon";
import Storefront from "./storefront";
import "../account.css";

export default function AccountForm({ signup = false, confirmationFailed = false }: {
  signup?: boolean;
  confirmationFailed?: boolean;
}) {
  const router = useRouter();
  const [supabase] = useState(() => hasSupabaseConfig ? createClient() : null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(
    confirmationFailed ? {
      text: "Liên kết xác nhận đã hết hạn hoặc không hợp lệ. Nếu đã xác nhận email, bạn có thể thử đăng nhập.",
      error: true,
    } : null,
  );

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserEmail(session?.user.email ?? null);
    });

    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserEmail(data.user?.email ?? null);
    }).catch(() => {
      if (active) setNotice({ text: "Chưa kiểm tra được phiên đăng nhập.", error: true });
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    if (signup && password !== fields.get("confirmPassword")) {
      setNotice({ text: "Hai mật khẩu chưa khớp. Bạn kiểm tra lại nhé.", error: true });
      return;
    }
    setBusy(true);
    setNotice(null);

    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
        });
        if (error) throw error;
        setUserEmail(data.session?.user.email ?? null);
        setNotice({
          text: data.session
            ? "Đăng ký thành công."
            : "Kiểm tra hộp thư email, kể cả thư rác, rồi mở liên kết xác nhận bằng trình duyệt này.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
        return;
      }

      form.reset();
      setShowPassword(false);
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : "Chưa kết nối được. Bạn thử lại nhé.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (!supabase || busy) return;
    setBusy(true);
    setNotice(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserEmail(null);
      setNotice({ text: "Đã đăng xuất." });
    } catch {
      setNotice({ text: "Chưa đăng xuất được. Bạn thử lại nhé.", error: true });
    } finally {
      setBusy(false);
    }
  }

  const title = userEmail ? "Tài khoản của bạn" : signup ? "Tạo tài khoản" : "Chào mừng trở lại!";

  return (
    <Storefront>
      <main className="bloomie-auth">
        <div className={`auth-layout${signup ? " auth-layout-signup" : ""}`}>
          <section className="auth-form-panel">
            <Link href="/" className="auth-back">← Trang chủ</Link>
            {!userEmail && (
              <nav aria-label="Tài khoản" className="auth-tabs">
                <Link href="/dang-nhap" aria-current={signup ? undefined : "page"}>Đăng nhập</Link>
                <Link href="/dang-ky" aria-current={signup ? "page" : undefined}>Đăng ký</Link>
              </nav>
            )}
            <h1 className="font-display auth-title">
              {title}
            </h1>
            {!userEmail && <p className="auth-intro">{signup ? "Tạo tài khoản Bloomie bằng email của bạn." : "Đăng nhập để tiếp tục với tài khoản Bloomie."}</p>}

            {userEmail ? (
              <div className="mt-7 space-y-5">
                <div className="rounded-2xl bg-[#f5f7ef] p-4 text-sm">
                  <p className="font-semibold">Email</p>
                  <p className="mt-1.5 break-all text-[#496259]">{userEmail}</p>
                </div>
                <Link href="/san-pham" className="bloomie-button w-full">Khám phá sản phẩm <Icon name="arrow" /></Link>
                <button type="button" onClick={logout} disabled={busy} className="bloomie-button bloomie-button-outline w-full">
                  {busy ? "Đang đăng xuất…" : "Đăng xuất"}
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={submit} className="auth-form">
                  <div>
                    <label htmlFor="account-email" className="mb-2 block text-sm font-semibold">Email</label>
                    <input
                      id="account-email"
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      placeholder="ban@example.com"
                      className="bloomie-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="account-password" className="mb-2 block text-sm font-semibold">Mật khẩu</label>
                    <div className="relative">
                      <input
                        id="account-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={signup ? 8 : undefined}
                        placeholder={signup ? "Ít nhất 8 ký tự" : "Nhập mật khẩu"}
                        autoComplete={signup ? "new-password" : "current-password"}
                        className="bloomie-field pr-18"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        className="absolute inset-y-1 right-1 rounded-xl px-3 text-sm font-semibold text-[#245c45] hover:bg-[#e8f1dd]"
                      >
                        {showPassword ? "Ẩn" : "Hiện"}
                      </button>
                    </div>
                  </div>
                  {signup && (
                    <div>
                      <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold">Nhập lại mật khẩu</label>
                      <input id="confirm-password" name="confirmPassword" required type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Nhập lại mật khẩu" className="bloomie-field" />
                    </div>
                  )}
                  <button type="submit" disabled={busy || loading || !supabase} className="bloomie-button w-full">
                    {busy ? "Đang xử lý…" : signup ? "Đăng ký" : "Đăng nhập"}
                  </button>
                </form>
                {signup && <p className="auth-note">Bloomie sẽ gửi liên kết xác nhận tới email của bạn.</p>}
              </>
            )}

            {notice && (
              <p role={notice.error ? "alert" : "status"} className={`mt-5 rounded-2xl p-4 text-sm leading-6 ${notice.error ? "bg-[#fbeddc] text-[#773b24]" : "bg-[#e8f1dd] text-[#245c45]"}`}>
                {notice.text}
              </p>
            )}
            {!supabase && <p role="status" className="mt-5 text-sm leading-6 text-[#773b24]">Kết nối tài khoản đang được thiết lập.</p>}
          </section>
          <aside className="auth-story">
            <Image src={hero} alt="Bộ dụng cụ học tập Bloomie với bút chì, thẻ học và khối gỗ" sizes="(min-width: 1200px) 560px, 50vw" className="auth-photo" />
            <div className="auth-story-copy">
              <p className="font-display">{signup ? "Bắt đầu từ một câu hỏi nhỏ." : "Mỗi ngày một khám phá."}</p>
              <span className="auth-spark"><Icon name="spark" className="size-6" /></span>
            </div>
          </aside>
        </div>
      </main>
    </Storefront>
  );
}
