"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import Storefront from "../components/storefront";
import { createClient, hasSupabaseConfig } from "../lib/supabase-browser";

export default function LearningPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [packTitle, setPackTitle] = useState("");
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  async function redeemCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPackTitle("");
    setNeedsLogin(false);

    const normalized = code.replace(/[\s-]/g, "").toUpperCase();
    if (!/^[0-9A-F]{32}$/.test(normalized)) {
      setError("Hãy nhập đủ mã của bộ học liệu.");
      return;
    }

    if (!hasSupabaseConfig) {
      setError("Website chưa được cấu hình kết nối.");
      return;
    }

    setBusy(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setNeedsLogin(true);
        setError("Hãy đăng nhập để kích hoạt học liệu.");
        return;
      }

      const { data, error: redeemError } = await supabase.rpc(
        "redeem_learning_code",
        { p_code: normalized },
      );

      if (redeemError) {
        if (redeemError.code === "P0001") {
          setError("Mã học liệu không hợp lệ hoặc đã được sử dụng.");
        } else if (redeemError.code === "28000") {
          setNeedsLogin(true);
          setError("Hãy đăng nhập lại để kích hoạt học liệu.");
        } else {
          setError("Chưa kích hoạt được học liệu. Bạn thử lại sau nhé.");
        }
        return;
      }

      if (typeof data !== "string" || !data) {
        setError("Chưa nhận được thông tin bộ học liệu.");
        return;
      }

      setPackTitle(data);
      setCode("");
    } catch {
      setError("Chưa kết nối được. Bạn thử lại sau nhé.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Storefront>
      <main className="mx-auto w-full max-w-xl px-5 py-10">
        <h1 className="font-display text-3xl font-bold">Nhập mã học liệu</h1>
        <p className="mt-3">Nhập mã trên sản phẩm để kích hoạt bộ học liệu.</p>

        <form className="mt-6 space-y-4" onSubmit={redeemCode}>
          <label className="grid gap-2 font-semibold" htmlFor="learning-code">
            Mã học liệu
            <input
              id="learning-code"
              className="rounded-xl border border-green-200 bg-white px-4 py-3"
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              maxLength={100}
              disabled={busy}
              required
            />
          </label>

          <button
            className="bloomie-button disabled:opacity-60"
            type="submit"
            disabled={busy}
          >
            {busy ? "Đang kích hoạt…" : "Kích hoạt học liệu"}
          </button>
        </form>

        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}

        {needsLogin && (
          <Link href="/dang-nhap" className="mt-3 inline-block underline">
            Đi đến trang đăng nhập
          </Link>
        )}

        {packTitle && (
          <p role="status" className="mt-4 rounded-xl bg-green-50 p-4">
            Đã kích hoạt bộ học liệu <strong>{packTitle}</strong>.
          </p>
        )}
      </main>
    </Storefront>
  );
}