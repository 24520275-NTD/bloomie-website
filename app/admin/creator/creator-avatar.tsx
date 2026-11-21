"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import type { createClient } from "../../lib/supabase-browser";

const avatarTypes = ["image/jpeg", "image/png", "image/webp"];

export default function CreatorAvatar({
  applicationId,
  fullName,
  supabase,
}: {
  applicationId: string;
  fullName: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const bucket = supabase.storage.from("creator-avatars");
  const path = `${applicationId}/avatar`;

  async function showPreview() {
    const { data, error } = await bucket.createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return false;

    setPreview(data.signedUrl);
    return true;
  }

  async function viewAvatar() {
    setBusy(true);
    setMessage("");

    try {
      if (!(await showPreview())) {
        setMessage("Chưa có ảnh đại diện hoặc chưa tải được ảnh.");
      }
    } catch {
      setMessage("Chưa tải được ảnh đại diện.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("avatar");

    if (
      !(file instanceof File) ||
      !avatarTypes.includes(file.type) ||
      file.size === 0 ||
      file.size > 2_000_000
    ) {
      setMessage("Hãy chọn ảnh JPG, PNG hoặc WebP tối đa 2 MB.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { error } = await bucket.upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: "0",
      });

      if (error) {
        setMessage("Chưa lưu được ảnh đại diện. Hãy thử lại.");
        return;
      }

      form.reset();
      setPreview("");
      setMessage("Đã lưu ảnh đại diện. Bấm Xem ảnh để mở.");
    } catch {
      setMessage("Chưa kết nối được để lưu ảnh.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 space-y-3 rounded-xl border border-green-200 bg-white p-4">
      <h3 className="font-semibold">Ảnh đại diện</h3>

      {preview && (
        <Image
          src={preview}
          alt={`Ảnh đại diện của ${fullName}`}
          width={96}
          height={96}
          unoptimized
          className="size-24 rounded-full object-cover"
        />
      )}

      <button
        type="button"
        disabled={busy}
        className="text-sm font-medium text-[#286347] underline disabled:opacity-60"
        onClick={() => void viewAvatar()}
      >
        Xem ảnh
      </button>

      <form onSubmit={uploadAvatar}>
        <fieldset disabled={busy} className="space-y-2">
          <label className="grid gap-1 text-sm font-medium">
            Chọn ảnh mới
            <input
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[#286347] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Lưu ảnh
          </button>
        </fieldset>
      </form>

      {message && <p role="status" className="text-sm">{message}</p>}
    </section>
  );
}