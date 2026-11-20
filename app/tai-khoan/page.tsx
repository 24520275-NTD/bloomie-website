"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "../lib/supabase-browser";

export default function AccountPage() {
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setAdminEmail(null);

    if (userEmail) {
      void Promise.resolve(supabase.rpc("is_creator_admin"))
        .then(({ data, error }) => {
          if (active && !error && data === true) {
            setAdminEmail(userEmail);
          }
        })
        .catch(() => {
          if (active) setAdminEmail(null);
        });
    }

    return () => {
      active = false;
    };
  }, [supabase, userEmail]);

  useEffect(() => {
    let active = true;

    if (
      new URLSearchParams(window.location.search).get("confirmation") ===
      "failed"
    ) {
      setMessage(
        "Liên kết xác nhận không hợp lệ hoặc đã hết hạn. " +
          "Nếu email đã được xác nhận, hãy thử đăng nhập.",
      );
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) setUserEmail(data.user?.email ?? null);
      })
      .catch(() => {
        if (active) setMessage("Chưa kiểm tra được phiên đăng nhập.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserEmail(session?.user.email ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });

        if (error) {
          setMessage(error.message);
        } else {
          setPassword("");
          setMessage(
            "Yêu cầu đăng ký đã được gửi. Kiểm tra email, kể cả thư rác. " +
              "Nếu nhận được thư xác nhận, hãy mở liên kết bằng " +
              "cùng trình duyệt đã đăng ký.",
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setMessage(error.message);
        } else {
          setUserEmail(data.user?.email ?? null);
          setPassword("");
          setMessage("Đăng nhập thành công.");
        }
      }
    } catch {
      setMessage("Không kết nối được. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setMessage(error.message);
      } else {
        setUserEmail(null);
        setPassword("");
        setMessage("Đã đăng xuất.");
      }
    } catch {
      setMessage("Chưa đăng xuất được. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle =
    "mt-2 w-full rounded-xl border border-green-200 bg-white px-4 py-3";

  return (
    <main className="min-h-screen bg-[#fffdf8] px-6 py-12 text-[#243c32]">
      <div className="mx-auto max-w-md">
        <Link href="/" className="font-semibold underline">
          ← Trang chủ Bloomie
        </Link>

        <h1 className="mt-8 text-3xl font-bold">Tài khoản Bloomie</h1>

        {loading ? (
          <p className="mt-6">Đang kiểm tra tài khoản…</p>
        ) : userEmail ? (
          <section className="mt-6 rounded-3xl border border-green-100 bg-white p-6">
            <p className="font-semibold">Bạn đã đăng nhập</p>
            <p className="mt-3 break-all">{userEmail}</p>

            {adminEmail === userEmail && (
              <Link
                href="/admin/creator"
                className="mt-4 inline-block rounded-full bg-[#286347] px-5 py-3 font-semibold text-white"
              >
                Duyệt hồ sơ Creator
              </Link>
            )}

            <Link
              href="/san-pham"
              className="mt-6 block font-semibold underline"
            >
              Khám phá sản phẩm →
            </Link>

            <button
              onClick={logout}
              disabled={busy}
              className="mt-6 rounded-full border px-6 py-3 disabled:opacity-50"
            >
              {busy ? "Đang xử lý…" : "Đăng xuất"}
            </button>
          </section>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <h2 className="text-xl font-semibold">
              {mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </h2>

            <label className="block">
              Email
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputStyle}
              />
            </label>

            <label className="block">
              Mật khẩu
              <input
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputStyle}
              />
            </label>

            {mode === "signup" && (
              <p className="text-sm">Sử dụng mật khẩu từ 8 ký tự.</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-[#286347] px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy
                ? "Đang xử lý…"
                : mode === "login"
                  ? "Đăng nhập"
                  : "Đăng ký"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setPassword("");
                setMessage("");
              }}
              className="underline"
            >
              {mode === "login"
                ? "Chưa có tài khoản? Đăng ký"
                : "Đã có tài khoản? Đăng nhập"}
            </button>
          </form>
        )}

        <p role="status" className="mt-6 whitespace-pre-line leading-7">
          {message}
        </p>
      </div>
    </main>
  );
}
