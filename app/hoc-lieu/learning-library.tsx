"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, hasSupabaseConfig } from "../lib/supabase-browser";

type LearningVideo = {
  id: string;
  title: string;
  storage_path: string | null;
};

type LearningPack = {
  pack_id: string;
  title: string;
  videos: LearningVideo[];
};

export default function LearningLibrary() {
  const [packs, setPacks] = useState<LearningPack[]>([]);
  const [message, setMessage] = useState("Đang tải học liệu…");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [openingVideo, setOpeningVideo] = useState<string | null>(null);
  const [player, setPlayer] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPacks() {
      try {
        if (!hasSupabaseConfig) {
          throw new Error("Thiếu cấu hình Supabase.");
        }

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        if (!session) {
          setNeedsLogin(true);
          setMessage("Đăng nhập để xem các bộ học liệu đã kích hoạt.");
          return;
        }

        const { data, error } = await supabase.rpc("list_my_learning_packs");
        if (error) throw error;
        if (!active) return;

        const rows: LearningPack[] = data ?? [];
        setPacks(rows);
        setMessage(rows.length ? "" : "Bạn chưa kích hoạt bộ học liệu nào.");
      } catch {
        if (active) setMessage("Chưa tải được học liệu. Hãy tải lại trang.");
      }
    }

    void loadPacks();
    return () => {
      active = false;
    };
  }, []);

  async function openVideo(video: LearningVideo) {
    if (!video.storage_path) return;

    setOpeningVideo(video.id);
    setPlayer(null);
    setVideoError("");

    try {
      const { data, error } = await createClient()
        .storage.from("learning-videos")
        .createSignedUrl(video.storage_path, 3600);

      if (error || !data?.signedUrl) {
        setVideoError("Chưa mở được video. Hãy thử lại.");
        return;
      }

      setPlayer({ id: video.id, url: data.signedUrl });
    } catch {
      setVideoError("Chưa mở được video. Hãy thử lại.");
    } finally {
      setOpeningVideo(null);
    }
  }

  return (
    <section className="mt-10 space-y-4">
      <h2 className="font-display text-2xl font-bold">Học liệu của tôi</h2>

      {message && <p role="status">{message}</p>}

      {needsLogin && (
        <Link href="/dang-nhap" className="inline-block underline">
          Đăng nhập
        </Link>
      )}

      {videoError && <p role="alert" className="text-red-700">{videoError}</p>}

      {packs.map((pack) => (
        <article key={pack.pack_id} className="rounded-2xl bg-green-50 p-5">
          <h3 className="text-lg font-bold">{pack.title}</h3>
          {pack.videos.length === 0 && <p className="mt-2">Bộ này chưa có video.</p>}

          <ul className="mt-3 space-y-4">
            {pack.videos.map((video) => (
              <li key={video.id} className="space-y-2">
                <p className="font-medium">{video.title}</p>

                {video.storage_path ? (
                  <button
                    type="button"
                    className="bloomie-button disabled:opacity-60"
                    disabled={openingVideo !== null}
                    onClick={() => void openVideo(video)}
                  >
                    {openingVideo === video.id ? "Đang mở…" : "Xem video"}
                  </button>
                ) : (
                  <p className="text-sm">Video chưa được tải lên.</p>
                )}

                {player?.id === video.id && (
                  <video
                    className="w-full rounded-xl"
                    src={player.url}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={video.title}
                  />
                )}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}