"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase-browser";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function AdminWalletPage() {
  const request = useRef<{ key: string; id: string } | null>(null);
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const fields = new FormData(form);
    const account = String(fields.get("account") ?? "").trim().toLowerCase();
    const amount = Number(fields.get("amount"));

    if (!account || !Number.isSafeInteger(amount) || amount <= 0) {
      setMessage("Hãy nhập email hoặc UUID và số tiền nguyên lớn hơn 0.");
      return;
    }

    const key = JSON.stringify([account, amount]);
    if (request.current?.key !== key) {
      request.current = { key, id: crypto.randomUUID() };
    }

    submitting.current = true;
    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_credit_demo_wallet", {
        p_account: account,
        p_amount: amount,
        p_request_id: request.current.id,
      });

      if (error) {
        setMessage(
          error.code === "P0001"
            ? error.message
            : "Chưa xác nhận được giao dịch. Bạn có thể thử lại.",
        );
        return;
      }

      setMessage(`Đã cộng cho ${account}. Số dư giả lập mới ${money.format(Number(data))}.`);
      request.current = null;
      form.reset();
    } catch {
      setMessage("Chưa xác nhận được giao dịch. Bạn có thể thử lại.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] px-5 py-8 text-[#243c32]">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="rounded-full border border-[#dce4d9] px-3 py-1.5 text-sm">
          ← Trang chủ Bloomie
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Quản lý ví giả lập</h1>

        <form onSubmit={submit} className="mt-5 rounded-2xl border border-[#dce4d9] bg-white p-5">
          <fieldset disabled={busy} className="grid gap-4">
            <label className="grid gap-1">
              Email hoặc UUID tài khoản
              <input name="account" required className="rounded-xl border px-3 py-2" />
            </label>

            <label className="grid gap-1">
              Số tiền giả lập cần cộng
              <input name="amount" type="number" min={1} step={1} required className="rounded-xl border px-3 py-2" />
            </label>

            <button type="submit" className="rounded-full bg-[#245c45] px-4 py-2 font-semibold text-white">
              {busy ? "Đang cộng số dư…" : "Cộng số dư"}
            </button>
          </fieldset>

          <p role="status" className="mt-3 text-sm">{message}</p>
        </form>
      </div>
    </main>
  );
}