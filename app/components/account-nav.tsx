"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, hasSupabaseConfig } from "../lib/supabase-browser";

const signInLink = (
  <Link
    href="/dang-nhap"
    className="rounded-full px-2.5 py-2 text-sm font-semibold text-[#245c45] hover:bg-[#e8f1dd] sm:px-4"
  >
    Đăng nhập
  </Link>
);

export default function AccountNav() {
  return hasSupabaseConfig ? <ConnectedAccountNav /> : signInLink;
}

function ConnectedAccountNav() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const userId = user?.id;

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setAdminId(null);
      setReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function checkAdmin() {
      try {
        const { data, error } = await supabase.rpc("is_creator_admin");
        if (active) setAdminId(!error && data === true ? userId! : null);
      } catch {
        if (active) setAdminId(null);
      }
    }

    void checkAdmin();
    return () => {
      active = false;
    };
  }, [supabase, userId]);

  async function signOut() {
    setSigningOut(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      setUser(null);
      setAdminId(null);
    } catch {
      setMessage("Chưa đăng xuất được. Bạn thử lại nhé.");
    } finally {
      setSigningOut(false);
    }
  }

  if (!ready) return <span className="w-20" aria-hidden="true" />;
  if (!user) return signInLink;

  const initial = user.email?.trim().charAt(0).toUpperCase() || "B";

  return (
    <>
      <details
        className="relative"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary
          aria-label="Mở menu tài khoản"
          className="grid size-11 cursor-pointer list-none place-items-center rounded-full bg-[#245c45] text-lg font-bold text-white ring-2 ring-[#245c45]/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#245c45] lg:size-14 [&::-webkit-details-marker]:hidden"
        >
          {initial}
        </summary>

        <div className="absolute right-0 top-full z-20 mt-2 w-64 max-w-[80vw] rounded-2xl border border-green-100 bg-white p-2 text-[#243c32] shadow-lg">
          <p className="break-all border-b border-green-100 px-3 py-2 text-sm">
            {user.email}
          </p>
          <Link
            href="/tai-khoan"
            className="block rounded-xl px-3 py-3 hover:bg-green-50"
          >
            Thông tin tài khoản
          </Link>
          {adminId === user.id && (
            <Link
              href="/admin/creator"
              className="block rounded-xl px-3 py-3 text-inherit hover:bg-green-50"
            >
              Duyệt hồ sơ Creator
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="w-full rounded-xl px-3 py-3 text-left hover:bg-green-50 disabled:opacity-50"
          >
            {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
          {message && (
            <p role="alert" className="px-3 py-2">
              {message}
            </p>
          )}
        </div>
      </details>
    </>
  );
}
