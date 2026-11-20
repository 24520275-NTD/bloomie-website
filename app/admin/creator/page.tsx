"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";

const labels = {
  pending: "Chờ xét duyệt",
  reviewing: "Đang xem xét",
  approved: "Đã duyệt",
  rejected: "Chưa được duyệt",
};

type Status = keyof typeof labels;

type Application = {
  id: string;
  full_name: string;
  channel_name: string;
  platform: string;
  status: Status;
};

export default function CreatorAdminPage() {
  const [supabase] = useState(() => createClient());
  const [applications, setApplications] = useState<Application[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Đang kiểm tra quyền quản trị…");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          if (active) setMessage("Hãy đăng nhập bằng tài khoản quản trị.");
          return;
        }

        const { data: isAdmin, error } =
          await supabase.rpc("is_creator_admin");
        if (error) throw error;

        if (isAdmin !== true) {
          if (active) setMessage("Tài khoản này chưa có quyền duyệt hồ sơ.");
          return;
        }

        const { data, error: listError } = await supabase
          .from("creator_applications")
          .select("id,full_name,channel_name,platform,status")
          .order("created_at", { ascending: false });

        if (listError) throw listError;
        if (!active) return;

        setApplications(data ?? []);
        setAllowed(true);
        setMessage("");
      } catch {
        if (active) {
          setMessage("Chưa tải được hồ sơ. Kiểm tra lại bước cấp quyền trong Supabase.");
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function saveStatus(id: string, status: Status) {
    setBusy(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("creator_applications")
        .update({ status })
        .eq("id", id)
        .select("id,status")
        .single();

      if (error) throw error;

      setApplications((current) =>
        current.map((item) =>
          item.id === data.id ? { ...item, status: data.status } : item
        )
      );
      setMessage("Đã lưu trạng thái hồ sơ.");
    } catch {
      setMessage("Chưa lưu được trạng thái. Hãy kiểm tra quyền quản trị.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdf8] p-8 text-[#243c32]">
      <div className="mx-auto max-w-3xl">
        <Link href="/tai-khoan" className="underline">Tài khoản Bloomie</Link>
        <h1 className="mt-6 text-3xl font-bold">Duyệt hồ sơ Creator</h1>
        <p role="status" className="mt-4">{message}</p>

        {allowed && applications.length === 0 && (
          <p className="mt-6">Chưa có hồ sơ nào.</p>
        )}

        {allowed && applications.map((item) => (
          <form
            key={`${item.id}-${item.status}`}
            className="mt-6 space-y-4 rounded-2xl border bg-white p-5"
            onSubmit={(event) => {
              event.preventDefault();
              const status = new FormData(event.currentTarget).get("status");
              if (typeof status === "string" && Object.hasOwn(labels, status)) {
                void saveStatus(item.id, status as Status);
              }
            }}
          >
            <h2 className="text-xl font-bold">{item.full_name}</h2>
            <p>{item.channel_name} · {item.platform}</p>
            <label className="block">
              Trạng thái
              <select
                name="status"
                defaultValue={item.status}
                disabled={busy}
                className="ml-3 rounded border p-2"
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#286347] px-4 py-2 text-white disabled:opacity-50"
            >
              Lưu trạng thái
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}