import { AuthContext } from "@app/providers/auth/AuthContext";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { useSplitView } from "@features/splitView";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { listDailyReports } from "@shared/api/graphql/documents/queries";
import type { ListDailyReportsQuery } from "@shared/api/graphql/types";
import { formatDateTimeReadable } from "@shared/lib/time";
import { AppButton } from "@shared/ui/button";
import type { GraphQLResult } from "aws-amplify/api";
import dayjs, { type Dayjs } from "dayjs";
import { Download } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DailyReportCarouselDialog from "./DailyReportCarouselDialog";
import DailyReportDetailPanel from "./DailyReportDetailPanel";
import {
  type AdminDailyReport,
  DISPLAY_STATUSES,
  type DisplayStatus,
  mapDailyReport,
  STATUS_META,
} from "./data";

const CSV_HEADER = [
  "日付",
  "スタッフID",
  "スタッフ名",
  "タイトル",
  "内容",
  "作成日時",
  "更新日時",
];

const compareReportByDateDesc = (a: AdminDailyReport, b: AdminDailyReport) => {
  if (a.date === b.date) {
    return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
  }
  return b.date.localeCompare(a.date);
};

const sanitizeCsvValue = (value: string): string => {
  const normalized = value.replace(/\r?\n/g, " ");
  const escaped = normalized.replace(/"/g, '""');
  if (/[",]/.test(escaped)) return `"${escaped}"`;
  return escaped;
};

export const buildDailyReportCsv = (reports: AdminDailyReport[]): string => {
  const sortedReports = reports.toSorted(compareReportByDateDesc);
  const lines = sortedReports.map((report) =>
    [
      report.date,
      report.staffId,
      report.author,
      report.title,
      report.content,
      report.createdAt ?? "",
      report.updatedAt ?? "",
    ]
      .map((value) => sanitizeCsvValue(value ?? ""))
      .join(","),
  );
  return [CSV_HEADER.join(","), ...lines].join("\n");
};

export const formatDailyReportFileName = (timestamp: Dayjs = dayjs()): string =>
  `daily_reports_${timestamp.format("YYYYMMDD_HHmmss")}.csv`;

const STATUS_BADGE_CLASS: Record<"default" | "info" | "success", string> = {
  default:
    "inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600",
  info: "inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700",
  success:
    "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700",
};

const SELECT_CLASS =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200";

const INPUT_DATE_CLASS =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200";

export default function AdminDailyReport() {
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const navigate = useNavigate();
  const { enableSplitMode, setRightPanel } = useSplitView();
  const {
    staffs,
    loading: isStaffLoading,
    error: staffError,
  } = useStaffs({ isAuthenticated });
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "">("");
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reports, setReports] = useState<AdminDailyReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminDailyReport | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const buildStaffName = useCallback(
    (staffId: string) => {
      const staff = staffs.find((item) => item.id === staffId);
      if (!staff) return "スタッフ";
      const name = [staff.familyName, staff.givenName]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(" ");
      return name || "スタッフ";
    },
    [staffs],
  );

  const fetchReports = useCallback(async () => {
    setIsLoadingReports(true);
    setLoadError(null);
    try {
      const aggregated: AdminDailyReport[] = [];
      let nextToken: string | null | undefined = undefined;

      do {
        const response = (await graphqlClient.graphql({
          query: listDailyReports,
          variables: { limit: 100, nextToken },
          authMode: "userPool",
        })) as GraphQLResult<ListDailyReportsQuery>;

        if (response.errors?.length) {
          throw new Error(response.errors.map((err) => err.message).join("\n"));
        }

        const items = response.data?.listDailyReports?.items ?? [];
        items.forEach((record) => {
          if (!record) return;
          aggregated.push(
            mapDailyReport(record, buildStaffName(record.staffId)),
          );
        });

        nextToken = response.data?.listDailyReports?.nextToken;
      } while (nextToken);

      setReports(aggregated.toSorted(compareReportByDateDesc));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "日報の取得に失敗しました。",
      );
    } finally {
      setIsLoadingReports(false);
    }
  }, [buildStaffName]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const visibleReports = useMemo(
    () =>
      reports.filter((report) =>
        DISPLAY_STATUSES.includes(report.status as DisplayStatus),
      ),
    [reports],
  );

  const staffOptions = useMemo(() => {
    const unique = Array.from(
      new Set(visibleReports.map((report) => report.author)),
    );
    return unique.toSorted((a, b) => a.localeCompare(b, "ja"));
  }, [visibleReports]);

  const filteredReports = useMemo(() => {
    return visibleReports.filter((report) => {
      if (statusFilter && report.status !== statusFilter) return false;
      if (staffFilter && report.author !== staffFilter) return false;
      if (startDate && report.date < startDate) return false;
      if (endDate && report.date > endDate) return false;
      return true;
    });
  }, [endDate, staffFilter, startDate, statusFilter, visibleReports]);

  const paginatedReports = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredReports.slice(start, start + rowsPerPage);
  }, [filteredReports, page, rowsPerPage]);

  const statusSummary = useMemo(() => {
    return DISPLAY_STATUSES.map((key) => {
      const count = visibleReports.filter(
        (report) => report.status === key,
      ).length;
      return { ...STATUS_META[key], count, key };
    });
  }, [visibleReports]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedReport(null);
  };

  const handleNavigateDetail = (report: AdminDailyReport) => {
    navigate(`/admin/daily-report/${report.id}`, { state: { report } });
  };

  const handleOpenInRightPanel = useCallback(
    (report: AdminDailyReport) => {
      enableSplitMode();
      setRightPanel({
        id: `daily-report-${report.id}`,
        title: `日報詳細 - ${report.date}`,
        component: DailyReportDetailPanel,
      });
    },
    [enableSplitMode, setRightPanel],
  );

  const handleOpenCarousel = () => {
    if (filteredReports.length > 0) {
      setSelectedReport(filteredReports[0]);
      setIsDialogOpen(true);
    }
  };

  const handleExportCsv = useCallback(() => {
    if (filteredReports.length === 0) return;
    const exportData = buildDailyReportCsv(filteredReports);
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, exportData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = formatDailyReportFileName();
    anchor.href = url;
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }, [filteredReports]);

  const totalPages = Math.ceil(filteredReports.length / rowsPerPage);
  const rangeStart = filteredReports.length > 0 ? page * rowsPerPage + 1 : 0;
  const rangeEnd = Math.min((page + 1) * rowsPerPage, filteredReports.length);

  return (
    <div className="w-full px-2 pb-6 pt-4 sm:px-4 md:px-6">
      <div className="space-y-3">
        <section className="rounded-[18px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {statusSummary.map((status) => (
                <span
                  key={status.key}
                  className={STATUS_BADGE_CLASS[status.color]}
                >
                  {status.label} {status.count}
                </span>
              ))}
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs font-medium text-emerald-700">
                合計 {visibleReports.length}
              </span>
            </div>
          </div>
        </section>

        {(loadError || staffError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError || staffError?.message || "データの取得に失敗しました。"}
          </div>
        )}

        <section className="rounded-2xl border border-emerald-100 bg-white/95 px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                ステータス
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as DisplayStatus | "");
                  setPage(0);
                }}
                className={SELECT_CLASS}
              >
                <option value="">すべて</option>
                {DISPLAY_STATUSES.map((key) => (
                  <option key={key} value={key}>
                    {STATUS_META[key].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                スタッフ
              </label>
              <select
                value={staffFilter}
                onChange={(e) => {
                  setStaffFilter(e.target.value);
                  setPage(0);
                }}
                className={SELECT_CLASS}
              >
                <option value="">すべて</option>
                {staffOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                開始日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                className={INPUT_DATE_CLASS}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                終了日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                className={INPUT_DATE_CLASS}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
          <AppButton
            onClick={handleExportCsv}
            disabled={filteredReports.length === 0}
            size="sm"
            variant="solid"
            tone="primary"
            className="app-save-button"
            startIcon={<Download size={16} strokeWidth={2} />}
          >
            CSV出力
          </AppButton>

          <button
            type="button"
            onClick={handleOpenCarousel}
            disabled={filteredReports.length === 0}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold tracking-wide text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            まとめて確認
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/95">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-[44px] px-2 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    日付
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    スタッフ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    タイトル
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                    最終更新
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingReports || isStaffLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-400"
                    >
                      読み込み中...
                    </td>
                  </tr>
                ) : paginatedReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-400"
                    >
                      条件に一致する日報がありません。
                    </td>
                  </tr>
                ) : (
                  paginatedReports.map((report) => (
                    <tr
                      key={report.id}
                      className="group transition hover:bg-emerald-50/40"
                    >
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          title="右側で開く"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInRightPanel(report);
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 border-0 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </button>
                      </td>
                      <td
                        className="cursor-pointer px-4 py-3 text-slate-700"
                        onClick={() => handleNavigateDetail(report)}
                      >
                        {report.date}
                      </td>
                      <td
                        className="cursor-pointer px-4 py-3 text-slate-700"
                        onClick={() => handleNavigateDetail(report)}
                      >
                        {report.author}
                      </td>
                      <td
                        className="cursor-pointer px-4 py-3 text-slate-700"
                        onClick={() => handleNavigateDetail(report)}
                      >
                        {report.title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            STATUS_BADGE_CLASS[STATUS_META[report.status].color]
                          }
                        >
                          {STATUS_META[report.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {report.updatedAt
                          ? formatDateTimeReadable(report.updatedAt)
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>表示件数:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                {filteredReports.length > 0
                  ? `${rangeStart}–${rangeEnd} / ${filteredReports.length}件`
                  : "0件"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 0}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {selectedReport && (
        <DailyReportCarouselDialog
          open={isDialogOpen}
          onClose={handleCloseDialog}
          selectedReport={selectedReport}
          filteredReports={filteredReports}
        />
      )}
    </div>
  );
}
