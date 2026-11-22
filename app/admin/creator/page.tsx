"use client";

import Link from "next/link";
import { Icon } from "../../components/bloomie-icon";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";
import CreatorEvaluation from "./creator-evaluation";
import CreatorIntakeForm from "./creator-intake-form";
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
  user_id: string | null;
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
  const [listVersion, setListVersion] = useState(0);
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
  const [sortOrder, setSortOrder] = useState<
    "newest" | "least-graded" | "most-graded"
  >("newest");
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
  if (progressReady && sortOrder !== "newest") {
    visibleApplications.sort((a, b) => {
      const aCount = progressById?.[a.id] ?? 0;
      const bCount = progressById?.[b.id] ?? 0;

      return sortOrder === "least-graded" ? aCount - bCount : bCount - aCount;
    });
  }
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
  }, [supabase, listVersion]);

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
  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setProgressFilter("all");
    setSortOrder("newest");
  }

  const filtersActive =
    search !== "" ||
    statusFilter !== "all" ||
    progressFilter !== "all" ||
    sortOrder !== "newest";

  const filterClass =
    "min-w-0 w-full rounded-full border border-[#e4ebe0] bg-[#fffdf8] px-3 py-2 text-sm";

  const statusColors: Record<Status, string> = {
    pending: "bg-[#fff2cd] text-[#774c13]",
    reviewing: "bg-[#ffeddc] text-[#85451a]",
    approved: "bg-[#e7f2df] text-[#245c45]",
    rejected: "bg-[#fbe9e6] text-[#8e3028]",
  };

  return (
    <main className="min-h-screen bg-[#fffdf8] px-4 py-6 text-[#243c32] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="inline-block rounded-full bg-[#edf4e7] px-3 py-1 text-xs font-bold uppercase text-[#245c45] hover:underline"
            >
              Quản trị hệ thống
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Duyệt hồ sơ Creator
            </h1>
            <p className="mt-1 max-w-lg text-sm leading-6 text-[#52645a]">
              Xem xét, chấm điểm và cập nhật trạng thái các hồ sơ đăng ký làm
              Creator học liệu Bloomie.
            </p>
          </div>

          {allowed && (
            <CreatorIntakeForm
              supabase={supabase}
              onCreated={() => setListVersion((version) => version + 1)}
            />
          )}
        </header>

        <p role="status" className={message ? "mt-4 text-sm" : "sr-only"}>
          {message}
        </p>

        {allowed && (progressReady || applications.length === 0) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["ungraded", "Chưa chấm", "Cần xử lý sớm", "pencil"],
                ["partial", "Chấm một phần", "Đang hoàn thiện", "palette"],
                ["complete", "Đã chấm đủ", "Đã duyệt xong tiêu chí", "check"],
              ] as const
            ).map(([value, label, description, icon]) => (
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
                className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left shadow-sm ${
                  progressFilter === value
                    ? "border-[#8dad80] bg-[#f1f7ed]"
                    : "border-[#e4ebe0] bg-white"
                }`}
              >
                <span>
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-3xl font-bold">
                    {progressCounts[value]}
                  </span>
                  <span className="block text-xs text-[#52645a]">
                    {description}
                  </span>
                </span>
                <span className="rounded-xl bg-[#edf4e7] p-3 text-[#245c45]">
                  <Icon name={icon} />
                </span>
              </button>
            ))}
          </div>
        )}

        {allowed && (
          <div className="mt-5 grid items-center gap-2 rounded-2xl border border-[#e4ebe0] bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(10rem,2fr)_repeat(3,minmax(0,1fr))_auto_auto]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#52645a]"
              />
              <input
                type="search"
                aria-label="Tìm hồ sơ Creator"
                placeholder="Tên, kênh, nền tảng hoặc lĩnh vực…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full min-w-0 rounded-full border border-[#e4ebe0] bg-[#fffdf8] py-2 pr-3 pl-9 text-sm"
              />
            </div>

            <select
              aria-label="Trạng thái hồ sơ"
              className={filterClass}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as typeof statusFilter)
              }
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              aria-label="Tiến độ chấm"
              className={filterClass}
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

            <select
              aria-label="Sắp xếp hồ sơ"
              className={filterClass}
              value={sortOrder}
              disabled={!progressReady}
              onChange={(event) =>
                setSortOrder(event.target.value as typeof sortOrder)
              }
            >
              <option value="newest">Mới nhất</option>
              <option value="least-graded">Ít tiêu chí đã chấm trước</option>
              <option value="most-graded">Nhiều tiêu chí đã chấm trước</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!filtersActive}
              className="rounded-full bg-[#edf4e7] px-3 py-2 text-sm font-medium text-[#245c45] disabled:opacity-50"
            >
              Đặt lại
            </button>

            <p aria-live="polite" className="px-1 text-sm">
              Hiển thị{" "}
              <strong>
                {visibleApplications.length}/{applications.length}
              </strong>{" "}
              hồ sơ
            </p>
          </div>
        )}

        {allowed && visibleApplications.length === 0 && (
          <div className="mt-5 rounded-3xl border border-dashed border-[#cbdcc4] bg-white px-4 py-12 text-center">
            <Icon name="bag" className="mx-auto mb-3 size-7 text-[#245c45]" />
            <p className="font-semibold">
              {applications.length === 0
                ? "Chưa có hồ sơ Creator"
                : "Không có hồ sơ phù hợp với bộ lọc"}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 rounded-full bg-[#edf4e7] px-4 py-2 text-sm font-medium text-[#245c45]"
              >
                Làm mới bộ lọc
              </button>
            )}
          </div>
        )}

        {allowed &&
          visibleApplications.map((item, index) => (
            <article
              key={item.id}
              className="mt-5 rounded-3xl border border-[#e4ebe0] bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-[#edf4e7] font-bold text-[#245c45]"
                  >
                    {item.full_name.trim().charAt(0).toLocaleUpperCase("vi")}
                  </span>
                  <div className="min-w-0">
                    <h2 className="wrap-break-word text-lg font-bold">
                      {item.full_name}
                    </h2>
                    <p className="wrap-break-word text-sm text-[#52645a]">
                      {item.channel_name} · {item.platform}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-[#edf4e7] px-3 py-1 text-[#245c45]">
                    {getProgressLabel(item.id)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 ${statusColors[item.status]}`}
                  >
                    {labels[item.status]}
                  </span>
                </div>
              </div>

              <details
                open={index === 0}
                className="group mt-4 rounded-2xl border border-[#e4ebe0] bg-[#f5f8f1]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#245c45] [&::-webkit-details-marker]:hidden">
                  Chi tiết hồ sơ đăng ký
                  <span className="shrink-0 font-medium">
                    <span className="group-open:hidden">Mở rộng ↓</span>
                    <span className="hidden group-open:inline">Thu gọn ↑</span>
                  </span>
                </summary>

                <dl className="grid gap-3 px-4 pb-4 text-sm sm:grid-cols-2">
                  {(
                    [
                      ["Email liên hệ", item.contact_email],
                      ["Số điện thoại", item.phone],
                      ["Đường dẫn kênh", item.channel_url],
                      [
                        "Lượt theo dõi",
                        item.followers?.toLocaleString("vi-VN"),
                      ],
                      ["Lĩnh vực nội dung", item.content_field],
                      ["Giới thiệu bản thân", item.introduction],
                      [
                        "Học vấn, chuyên môn và kinh nghiệm",
                        item.professional_background,
                      ],
                    ] as const
                  ).map(([label, value], fieldIndex) => (
                    <div
                      key={label}
                      className={fieldIndex >= 4 ? "sm:col-span-2" : ""}
                    >
                      <dt className="text-xs font-semibold text-[#52645a]">
                        {label}
                      </dt>
                      <dd className="mt-0.5 wrap-break-word whitespace-pre-wrap">
                        {value || "Chưa bổ sung"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e4ebe0] pt-3">
                <form
                  key={item.status}
                  className="flex flex-wrap items-center gap-2 text-sm"
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
                  <label className="flex flex-wrap items-center gap-2">
                    Trạng thái
                    <select
                      name="status"
                      defaultValue={item.status}
                      disabled={busy}
                      className="rounded-full border border-[#e4ebe0] bg-[#fffdf8] px-3 py-2"
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
                    className="rounded-full bg-[#245c45] px-4 py-2 font-semibold text-white hover:bg-[#1c4b38] disabled:opacity-50"
                  >
                    Lưu trạng thái
                  </button>
                </form>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <Link
                    href={`/admin/creator/${item.id}`}
                    className="text-[#245c45] hover:underline"
                  >
                    Xem hồ sơ và minh chứng
                  </Link>
                  <button
                    type="button"
                    aria-expanded={evaluationId === item.id}
                    onClick={() =>
                      setEvaluationId((current) =>
                        current === item.id ? null : item.id,
                      )
                    }
                    className="font-semibold text-[#245c45] hover:underline"
                  >
                    {evaluationId === item.id
                      ? "Đóng bảng đánh giá"
                      : "Đánh giá Creator →"}
                  </button>
                </div>
              </div>

              {evaluationId === item.id && (
                <section
                  aria-label="Chấm điểm hồ sơ"
                  className="mt-4 rounded-2xl bg-[#f5f8f1] p-4"
                >
                  <CreatorEvaluation
                    applicationId={item.id}
                    onSaved={(gradedCount) => {
                      setProgressById((previous) => ({
                        ...(previous ?? {}),
                        [item.id]: gradedCount,
                      }));
                    }}
                  />
                </section>
              )}
            </article>
          ))}
      </div>
    </main>
  );
}
