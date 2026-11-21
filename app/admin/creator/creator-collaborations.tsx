"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import type { createClient } from "../../lib/supabase-browser";

const statuses = {
  planned: "Đã lên kế hoạch",
  active: "Đang thực hiện",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

type Campaign = {
  id: string;
  campaign_name: string;
  status: keyof typeof statuses;
  starts_on: string | null;
  ends_on: string | null;
  link_clicks: number | null;
  order_count: number | null;
  revenue_vnd: string | null;
  notes: string;
};

const columns =
  "id,campaign_name,status,starts_on,ends_on,link_clicks,order_count,revenue_vnd::text,notes";

const inputClass =
  "w-full rounded-lg border border-green-200 bg-white px-3 py-2";

export default function CreatorCollaborations({
  applicationId,
  supabase,
}: {
  applicationId: string;
  supabase: ReturnType<typeof createClient>;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Đang tải chiến dịch…");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data, error } = await supabase
          .from("creator_collaborations")
          .select(columns)
          .eq("application_id", applicationId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!active) return;

        setCampaigns(data ?? []);
        setMessage("");
      } catch {
        if (active) {
          setMessage("Chưa tải được chiến dịch. Hãy thử tải lại trang.");
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [applicationId, supabase]);

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !campaigns) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    const text = (key: string) => String(values.get(key) ?? "").trim();
    const name = text("campaign_name");
    const startsOn = text("starts_on") || null;
    const endsOn = text("ends_on") || null;
    const clicks = text("link_clicks");
    const orders = text("order_count");
    const revenue = text("revenue_vnd");

    if (!name) {
      setMessage("Hãy nhập tên chiến dịch.");
      return;
    }

    if (startsOn && endsOn && endsOn < startsOn) {
      setMessage("Ngày kết thúc phải từ ngày bắt đầu trở đi.");
      return;
    }

    if (
      revenue &&
      (!/^[0-9]+$/.test(revenue) || BigInt(revenue) > BigInt("9223372036854775807"))
    ) {
      setMessage("Doanh thu phải là số nguyên VND trong phạm vi cho phép.");
      return;
    }

    const payload = {
      campaign_name: name,
      status: text("status"),
      starts_on: startsOn,
      ends_on: endsOn,
      link_clicks: clicks === "" ? null : Number(clicks),
      order_count: orders === "" ? null : Number(orders),
      revenue_vnd: revenue || null,
      notes: text("notes"),
    };

    setSaving(true);
    setMessage("");

    try {
      const table = supabase.from("creator_collaborations");
      const query = editing
        ? table.update(payload).eq("id", editing.id).eq("application_id", applicationId)
        : table.insert({ ...payload, application_id: applicationId });

      const { data, error } = await query.select(columns).single();
      if (error) throw error;

      const saved: Campaign = data;
      setCampaigns((current) =>
        editing
          ? (current ?? []).map((item) => item.id === saved.id ? saved : item)
          : [saved, ...(current ?? [])],
      );
      form.reset();
      setEditing(null);
      setMessage(editing ? "Đã cập nhật chiến dịch." : "Đã thêm chiến dịch.");
    } catch {
      setMessage("Chưa lưu được chiến dịch. Dữ liệu bạn nhập vẫn còn trong biểu mẫu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-5 space-y-4 rounded-xl border border-green-200 bg-white p-4">
      <h2 className="font-semibold">Chiến dịch hợp tác</h2>

      {campaigns?.length === 0 && <p>Chưa có chiến dịch hợp tác.</p>}

      {campaigns?.map((campaign) => (
        <article key={campaign.id} className="space-y-1 rounded-lg border p-3">
          <h3 className="font-semibold">{campaign.campaign_name}</h3>
          <p className="text-sm">{statuses[campaign.status]}</p>
          <p className="text-sm">
            Lượt nhấp: {campaign.link_clicks ?? "Chưa có"} ·
            {" "}Đơn hàng: {campaign.order_count ?? "Chưa có"} ·
            {" "}Doanh thu: {campaign.revenue_vnd === null
              ? "Chưa có"
              : `${BigInt(campaign.revenue_vnd).toLocaleString("vi-VN")} ₫`}
          </p>
          <button
            type="button"
            disabled={saving}
            className="text-sm font-medium text-[#286347] underline"
            onClick={() => {
              setEditing(campaign);
              setMessage("");
            }}
          >
            Chỉnh sửa chiến dịch
          </button>
        </article>
      ))}

      {campaigns && (
        <form key={editing?.id ?? "new"} onSubmit={save}>
          <fieldset disabled={saving} className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-3 font-medium">
              {editing ? `Chỉnh sửa ${editing.campaign_name}` : "Thêm chiến dịch"}
            </legend>

            <label className="grid gap-1 text-sm">
              Tên chiến dịch
              <input className={inputClass} name="campaign_name"
                defaultValue={editing?.campaign_name} maxLength={200} required />
            </label>

            <label className="grid gap-1 text-sm">
              Trạng thái
              <select className={inputClass} name="status"
                defaultValue={editing?.status ?? "planned"}>
                {Object.entries(statuses).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              Ngày bắt đầu
              <input className={inputClass} type="date" name="starts_on"
                defaultValue={editing?.starts_on ?? ""} />
            </label>

            <label className="grid gap-1 text-sm">
              Ngày kết thúc
              <input className={inputClass} type="date" name="ends_on"
                defaultValue={editing?.ends_on ?? ""} />
            </label>

            <label className="grid gap-1 text-sm">
              Lượt nhấp
              <input className={inputClass} type="number" name="link_clicks"
                min={0} max={2147483647} step={1}
                defaultValue={editing?.link_clicks ?? ""} />
            </label>

            <label className="grid gap-1 text-sm">
              Số đơn hàng
              <input className={inputClass} type="number" name="order_count"
                min={0} max={2147483647} step={1}
                defaultValue={editing?.order_count ?? ""} />
            </label>

            <label className="grid gap-1 text-sm">
              Doanh thu (VND)
              <input className={inputClass} name="revenue_vnd" inputMode="numeric"
                pattern="[0-9]+" maxLength={19}
                defaultValue={editing?.revenue_vnd ?? ""} />
            </label>

            <label className="grid gap-1 text-sm sm:col-span-2">
              Ghi chú
              <textarea className={inputClass} name="notes" rows={3}
                maxLength={5000} defaultValue={editing?.notes ?? ""} />
            </label>

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button type="submit"
                className="rounded-lg bg-[#286347] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Đang lưu…" : "Lưu chiến dịch"}
              </button>
              {editing && (
                <button type="button" className="text-sm underline"
                  onClick={() => {
                    setEditing(null);
                    setMessage("");
                  }}>
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </fieldset>
        </form>
      )}

      {message && <p role="status" className="text-sm">{message}</p>}
    </section>
  );
}