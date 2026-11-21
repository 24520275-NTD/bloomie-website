"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";
import CreatorEvidence from "../../components/creator-evidence";
import CreatorEvaluation from "./creator-evaluation";
import { creatorRubric } from "./creator-rubric";

const labels = {
  pending: "Chờ xét duyệt",
  reviewing: "Đang xem xét",
  approved: "Đã duyệt",
  rejected: "Chưa được duyệt",
};

type Status = keyof typeof labels;

type Application = {
  id: string;
  user_id: string;
  full_name: string;
  channel_name: string;
  platform: string;
  status: Status;
  contact_email: string;
  phone: string;
  channel_url: string;
  content_field: string;
  followers: number;
  introduction: string;
  professional_background: string;
};

export default function CreatorAdminPage() {
  const [supabase] = useState(() => createClient());
  const [applications, setApplications] = useState<Application[]>([]);
  const [progressById, setProgressById] = useState<Record<
    string,
    number
  > | null>(null);
  const [progressError, setProgressError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [progressFilter, setProgressFilter] = useState<
    "all" | "ungraded" | "partial" | "complete"
  >("all");

  const progressReady = progressById !== null && !progressError;
  const progressCounts = applications.reduce(
    (counts, item) => {
      const gradedCount = progressById?.[item.id] ?? 0;

      if (gradedCount === 0) {
        counts.ungraded += 1;
      } else if (gradedCount === creatorRubric.length) {
        counts.complete += 1;
      } else {
        counts.partial += 1;
      }

      return counts;
    },
    { ungraded: 0, partial: 0, complete: 0 },
  );
  const [search, setSearch] = useState("");
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const query = search.trim().toLocaleLowerCase("vi");
  const visibleApplications = applications.filter((item) => {
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesSearch = [
      item.full_name,
      item.channel_name,
      item.platform,
      item.content_field,
    ].some((value) => value?.toLocaleLowerCase("vi").includes(query));
    if (!matchesStatus || !matchesSearch) return false;
    if (progressFilter === "all" || !progressReady) return true;

    const gradedCount = progressById?.[item.id] ?? 0;
    const totalCriteria = creatorRubric.length;

    if (progressFilter === "ungraded") return gradedCount === 0;
    if (progressFilter === "partial") {
      return gradedCount > 0 && gradedCount < totalCriteria;
    }

    return gradedCount === totalCriteria;
  });
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

        const { data: isAdmin, error } = await supabase.rpc("is_creator_admin");
        if (error) throw error;

        if (isAdmin !== true) {
          if (active) setMessage("Tài khoản này chưa có quyền duyệt hồ sơ.");
          return;
        }

        const { data, error: listError } = await supabase
          .from("creator_applications")
          .select(
            "id,user_id,full_name,channel_name,platform,status,contact_email,phone,channel_url,content_field,followers,introduction,professional_background",
          )
          .order("created_at", { ascending: false });

        if (listError) throw listError;
        if (!active) return;

        setApplications(data ?? []);
        setAllowed(true);
        setMessage("");
        const applicationIds = (data ?? []).map(({ id }) => id);

        if (applicationIds.length > 0) {
          try {
            const { data: evaluations, error: evaluationError } = await supabase
              .from("creator_evaluations")
              .select("application_id,scores")
              .in("application_id", applicationIds);

            if (evaluationError) throw evaluationError;
            if (!active) return;

            const nextProgress: Record<string, number> = {};

            for (const evaluation of evaluations ?? []) {
              nextProgress[evaluation.application_id] = creatorRubric.filter(
                ({ id }) => typeof evaluation.scores?.[id] === "number",
              ).length;
            }

            setProgressById(nextProgress);
            setProgressError(false);
          } catch {
            if (active) setProgressError(true);
          }
        }
      } catch {
        if (active) {
          setMessage(
            "Chưa tải được hồ sơ. Kiểm tra lại bước cấp quyền trong Supabase.",
          );
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
          item.id === data.id ? { ...item, status: data.status } : item,
        ),
      );
      setMessage("Đã lưu trạng thái hồ sơ.");
    } catch {
      setMessage("Chưa lưu được trạng thái. Hãy kiểm tra quyền quản trị.");
    } finally {
      setBusy(false);
    }
  }
  function getProgressLabel(applicationId: string) {
    if (progressError) return "Chưa tải được tiến độ";
    if (progressById === null) return "Đang tải tiến độ…";

    const gradedCount = progressById[applicationId] ?? 0;
    const totalCriteria = creatorRubric.length;

    if (gradedCount === 0) return "Chưa chấm";
    if (gradedCount === totalCriteria) {
      return `Đã chấm đủ ${gradedCount}/${totalCriteria} tiêu chí`;
    }

    return `Đã chấm ${gradedCount}/${totalCriteria} tiêu chí`;
  }
  return (
    <main className="min-h-screen bg-[#fffdf8] p-8 text-[#243c32]">
      <div className="mx-auto max-w-3xl">
        <Link href="/tai-khoan" className="underline">
          Tài khoản Bloomie
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Duyệt hồ sơ Creator</h1>
        <p role="status" className="mt-4">
          {message}
        </p>
        {allowed && (progressReady || applications.length === 0) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {(
              [
                {
                  value: "ungraded",
                  label: "Chưa chấm",
                  count: progressCounts.ungraded,
                },
                {
                  value: "partial",
                  label: "Chấm một phần",
                  count: progressCounts.partial,
                },
                {
                  value: "complete",
                  label: "Đã chấm đủ",
                  count: progressCounts.complete,
                },
              ] as const
            ).map(({ value, label, count }) => (
              <button
                key={value}
                type="button"
                aria-pressed={progressFilter === value}
                disabled={!progressReady}
                onClick={() =>
                  setProgressFilter((current) =>
                    current === value ? "all" : value,
                  )
                }
                className={`rounded-xl border p-4 text-left ${
                  progressFilter === value
                    ? "border-green-400 bg-green-50"
                    : "border-green-100 bg-white"
                }`}
              >
                <span className="block text-sm text-[#286347]">{label}</span>
                <span className="mt-1 block text-2xl font-bold">{count}</span>
              </button>
            ))}
          </div>
        )}

        {allowed && (
          <div className="mt-6 flex flex-wrap items-end gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Trạng thái hồ sơ
              <select
                className="rounded-lg border border-green-200 bg-white px-3 py-2"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as Status | "all")
                }
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">{labels.pending}</option>
                <option value="reviewing">{labels.reviewing}</option>
                <option value="approved">{labels.approved}</option>
                <option value="rejected">{labels.rejected}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Tiến độ chấm
              <select
                className="rounded-lg border border-green-200 bg-white px-3 py-2"
                value={progressFilter}
                disabled={!progressReady}
                onChange={(event) =>
                  setProgressFilter(event.target.value as typeof progressFilter)
                }
              >
                <option value="all">Tất cả tiến độ</option>
                <option value="ungraded">Chưa chấm</option>
                <option value="partial">Chấm một phần</option>
                <option value="complete">Đã chấm đủ</option>
              </select>
            </label>
            <label className="grid flex-1 gap-2 text-sm font-medium">
              Tìm hồ sơ Creator
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tên, kênh, nền tảng hoặc lĩnh vực"
                className="min-w-56 rounded-lg border border-green-200 bg-white px-3 py-2"
              />
            </label>
            <button
              type="button"
              className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-[#286347] disabled:opacity-50"
              disabled={
                statusFilter === "all" &&
                progressFilter === "all" &&
                search === ""
              }
              onClick={() => {
                setStatusFilter("all");
                setProgressFilter("all");
                setSearch("");
              }}
            >
              Xóa bộ lọc
            </button>
            <p className="pb-2 text-sm" aria-live="polite">
              Hiển thị {visibleApplications.length}/{applications.length} hồ sơ
            </p>
          </div>
        )}

        {allowed && visibleApplications.length === 0 && (
          <p className="mt-6">
            {applications.length === 0
              ? "Chưa có hồ sơ nào."
              : "Không có hồ sơ phù hợp với bộ lọc."}
          </p>
        )}

        {allowed &&
          visibleApplications.map((item) => (
            <article key={item.id} className="mt-6 rounded-2xl border bg-white">
              <form
                key={item.status}
                className="space-y-4 p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const status = new FormData(event.currentTarget).get(
                    "status",
                  );
                  if (
                    typeof status === "string" &&
                    Object.hasOwn(labels, status)
                  ) {
                    void saveStatus(item.id, status as Status);
                  }
                }}
              >
                <h2 className="text-xl font-bold">{item.full_name}</h2>
                <p>
                  {item.channel_name} · {item.platform}
                </p>
                <p className="text-sm font-medium text-[#286347]">
                  {getProgressLabel(item.id)}
                </p>
                <details className="rounded-xl bg-[#f5f8f1] p-4">
                  <summary className="cursor-pointer font-semibold text-[#286347]">
                    Xem chi tiết hồ sơ
                  </summary>

                  <div className="mt-4 space-y-2 break-words text-sm leading-6">
                    <p>
                      <strong>Email:</strong> {item.contact_email}
                    </p>
                    <p>
                      <strong>Điện thoại:</strong> {item.phone}
                    </p>
                    <p>
                      <strong>Đường dẫn kênh:</strong> {item.channel_url}
                    </p>
                    <p>
                      <strong>Lĩnh vực:</strong> {item.content_field}
                    </p>
                    <p>
                      <strong>Người theo dõi:</strong>{" "}
                      {item.followers.toLocaleString("vi-VN")}
                    </p>
                    <p className="whitespace-pre-wrap">
                      <strong>Giới thiệu:</strong>{" "}
                      {item.introduction || "Chưa bổ sung"}
                    </p>
                    <p className="whitespace-pre-wrap">
                      <strong>Kinh nghiệm:</strong>{" "}
                      {item.professional_background || "Chưa bổ sung"}
                    </p>
                  </div>
                  <CreatorEvidence key={item.user_id} userId={item.user_id} />
                </details>
                <label className="block">
                  Trạng thái
                  <select
                    name="status"
                    defaultValue={item.status}
                    disabled={busy}
                    className="ml-3 rounded border p-2"
                  >
                    {Object.entries(labels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
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
              <section
                className="rounded-b-2xl border-t border-green-100 bg-[#f5f8f1] p-5"
                aria-label="Chấm điểm hồ sơ"
              >
                <button
                  type="button"
                  className="font-semibold text-[#286347] underline"
                  aria-expanded={evaluationId === item.id}
                  onClick={() =>
                    setEvaluationId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                >
                  {evaluationId === item.id
                    ? "Đóng bảng đánh giá"
                    : "Đánh giá Creator"}
                </button>
                {evaluationId === item.id && (
                  <CreatorEvaluation
                    applicationId={item.id}
                    onSaved={(gradedCount) => {
                      setProgressById((previous) => ({
                        ...(previous ?? {}),
                        [item.id]: gradedCount,
                      }));
                    }}
                  />
                )}
              </section>
            </article>
          ))}
      </div>
    </main>
  );
}
