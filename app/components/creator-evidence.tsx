"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { createClient } from "../lib/supabase-browser";
import type { ReactNode } from "react";

const extensions: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export default function CreatorEvidence({
  userId,
  canUpload = false,
  renderReview,
}: {
  userId: string;
  canUpload?: boolean;
  renderReview?: (objectId: string) => ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{
    name: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data, error } = await supabase.storage
          .from("creator-evidence")
          .list(userId, {
            limit: 100,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (error) throw error;
        if (active) {
          setFiles(
            (data ?? []).flatMap((file) =>
              file.id ? [{ id: file.id, name: file.name }] : [],
            ),
          );
        }
      } catch {
        if (active) setMessage("Chưa tải được danh sách minh chứng.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [supabase, userId]);

  async function upload(event: SubmitEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const file = new FormData(form).get("evidence");

    if (!(file instanceof File) || file.size === 0) {
      setMessage("Bạn chưa chọn tệp.");
      return;
    }

    const extension = extensions[file.type];
    if (!extension || file.size > 10 * 1024 * 1024) {
      setMessage("Hãy chọn tệp PDF, JPG hoặc PNG, tối đa 10 MB.");
      return;
    }

    const baseName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 80);
    const name = `${crypto.randomUUID()}--${baseName || "minh-chung"}.${extension}`;

    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.storage
        .from("creator-evidence")
        .upload(`${userId}/${name}`, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;
      setFiles((current) => [{ id: data.id, name }, ...current].slice(0, 100));
      form.reset();
      setMessage("Đã tải minh chứng lên.");
    } catch (error) {
      const detail = error instanceof Error ? ` ${error.message}` : "";
      setMessage(`Chưa tải được tệp.${detail}`);
    } finally {
      setBusy(false);
    }
  }
  async function openPreview(name: string) {
    setBusy(true);
    setMessage("");
    setPreview(null);

    try {
      const { data, error } = await supabase.storage
        .from("creator-evidence")
        .createSignedUrl(`${userId}/${name}`, 300);

      if (error || !data?.signedUrl) {
        setMessage("Chưa mở được minh chứng. Bạn hãy thử lại.");
        return;
      }

      setPreview({
        name: name.replace(/^[a-f0-9-]{36}--/, ""),
        url: data.signedUrl,
      });
    } catch {
      setMessage("Chưa mở được minh chứng. Bạn hãy thử lại.");
    } finally {
      setBusy(false);
    }
  }
  async function download(name: string) {
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.storage
        .from("creator-evidence")
        .download(`${userId}/${name}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = name.replace(/^[a-f0-9-]{36}--/, "");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setMessage("Chưa tải xuống được minh chứng.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 space-y-3 rounded-xl bg-[#f5f8f1] p-4">
      <h3 className="font-semibold">Tài liệu minh chứng</h3>

      {canUpload && (
        <form onSubmit={upload} className="space-y-3">
          <label className="block text-sm">
            Chọn tệp PDF, JPG hoặc PNG, tối đa 10 MB
            <input
              name="evidence"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              className="mt-2 block w-full"
            />
          </label>
          <button
            type="submit"
            disabled={busy || loading}
            className="rounded-lg bg-[#286347] px-4 py-2 text-white disabled:opacity-50"
          >
            Tải minh chứng
          </button>
        </form>
      )}

      {loading && <p className="text-sm">Đang tải danh sách…</p>}
      {!loading && files.length === 0 && !message && (
        <p className="text-sm">Chưa có minh chứng.</p>
      )}

      <ul className="space-y-2">
        {files.map(({ id, name }) => (
          <li key={id} className="rounded-lg border bg-white p-3">
            <p className="break-all text-sm">
              {name.replace(/^[a-f0-9-]{36}--/, "")}
            </p>
            {renderReview?.(id)}
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <button
                type="button"
                disabled={busy}
                onClick={() => void openPreview(name)}
                className="font-semibold text-[#286347] underline disabled:opacity-50"
              >
                Xem trực tiếp
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void download(name)}
                className="text-slate-600 underline disabled:opacity-50"
              >
                Tải xuống
              </button>
            </div>
          </li>
        ))}
      </ul>

      {preview && (
        <div className="space-y-3 rounded-xl border bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="break-all text-sm font-semibold">{preview.name}</p>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="text-sm underline"
            >
              Đóng xem trước
            </button>
          </div>

          {preview.name.toLowerCase().endsWith(".pdf") ? (
            <iframe
              src={preview.url}
              title={`Xem PDF ${preview.name}`}
              className="h-[65vh] w-full rounded-lg border"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview.url}
              alt={preview.name}
              className="mx-auto max-h-[65vh] max-w-full object-contain"
            />
          )}

          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-[#286347] underline"
          >
            Mở trong tab mới
          </a>
        </div>
      )}

      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
