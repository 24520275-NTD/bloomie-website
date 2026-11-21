"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CreatorProfileReview from "../creator-profile-review";
import CreatorCollaborations from "../creator-collaborations";
import CreatorQualifications from "../creator-qualifications";
import { createClient } from "../../../lib/supabase-browser";
import CreatorAvatar from "../creator-avatar";

type CreatorProfile = {
  id: string;
  user_id: string | null;
  full_name: string;
  channel_name: string;
  platform: string;
  contact_email: string;
  phone: string;
  channel_url: string;
  content_field: string;
  followers: number;
  introduction: string | null;
  professional_background: string | null;
};

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [supabase] = useState(() => createClient());
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [message, setMessage] = useState("Đang tải hồ sơ…");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!active) return;

        if (!auth.user) {
          setMessage("Hãy đăng nhập bằng tài khoản quản trị.");
          return;
        }

        const { data: isAdmin, error: permissionError } =
          await supabase.rpc("is_creator_admin");

        if (permissionError) throw permissionError;
        if (!active) return;

        if (isAdmin !== true) {
          setMessage("Tài khoản này chưa có quyền xem hồ sơ Creator.");
          return;
        }

        const { data, error } = await supabase
          .from("creator_applications")
          .select(
            "id,user_id,full_name,channel_name,platform,contact_email,phone,channel_url,content_field,followers,introduction,professional_background",
          )
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        setProfile(data);
        setMessage(data ? "" : "Không tìm thấy hồ sơ Creator.");
      } catch {
        if (active) setMessage("Chưa tải được hồ sơ. Hãy thử tải lại trang.");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id, supabase]);

  const currentProfile = profile?.id === id ? profile : null;

  return (
    <main className="min-h-screen bg-[#fffdf8] px-5 py-8 text-[#243c32]">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/creator" className="underline">
          ← Về danh sách Creator
        </Link>

        {message && (
          <p role="status" className="mt-4">
            {message}
          </p>
        )}

        {currentProfile && (
          <>
            <h1 className="mt-6 text-3xl font-bold">
              {currentProfile.full_name}
            </h1>
            <p className="mt-2">
              {currentProfile.channel_name} · {currentProfile.platform}
            </p>

            <CreatorAvatar
              applicationId={currentProfile.id}
              fullName={currentProfile.full_name}
              supabase={supabase}
            />

            <section className="mt-5 rounded-xl border border-green-200 bg-white p-4">
              <h2 className="font-semibold">Thông tin liên hệ và kênh</h2>
              <dl className="mt-3 grid gap-3 break-words sm:grid-cols-2">
                <div>
                  <dt className="font-medium">Email</dt>
                  <dd>{currentProfile.contact_email}</dd>
                </div>
                <div>
                  <dt className="font-medium">Điện thoại</dt>
                  <dd>{currentProfile.phone}</dd>
                </div>
                <div>
                  <dt className="font-medium">Đường dẫn kênh</dt>
                  <dd>{currentProfile.channel_url}</dd>
                </div>
                <div>
                  <dt className="font-medium">Lĩnh vực nội dung</dt>
                  <dd>{currentProfile.content_field}</dd>
                </div>
                <div>
                  <dt className="font-medium">Người theo dõi</dt>
                  <dd>{currentProfile.followers.toLocaleString("vi-VN")}</dd>
                </div>
              </dl>
            </section>

            <section className="mt-5 space-y-3 rounded-xl border border-green-200 bg-white p-4">
              <h2 className="font-semibold">Giới thiệu và chuyên môn</h2>
              <p className="whitespace-pre-wrap">
                {currentProfile.introduction || "Chưa có giới thiệu."}
              </p>
              <p className="whitespace-pre-wrap">
                {currentProfile.professional_background ||
                  "Chưa bổ sung chuyên môn và kinh nghiệm."}
              </p>
            </section>
            
            <CreatorQualifications
              key={currentProfile.id}
              applicationId={currentProfile.id}
              supabase={supabase}
            />

            <CreatorProfileReview
              key={currentProfile.id}
              applicationId={currentProfile.id}
              userId={currentProfile.user_id}
              supabase={supabase}
            />
            <CreatorCollaborations
              key={currentProfile.id}
              applicationId={currentProfile.id}
              supabase={supabase}
            />
          </>
        )}
      </div>
    </main>
  );
}
