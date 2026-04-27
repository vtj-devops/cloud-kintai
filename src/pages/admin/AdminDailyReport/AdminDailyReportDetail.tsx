import { formatDateSlash, formatDateTimeReadable } from "@shared/lib/time";
import { DashboardInnerSurface } from "@shared/ui/layout";
import { SectionTitle } from "@shared/ui/typography";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { DailyReportCommentSection } from "./components/DailyReportCommentSection";
import { DailyReportReactionSection } from "./components/DailyReportReactionSection";
import { type AdminDailyReport, STATUS_META } from "./data";
import { useAdminDailyReportDetailState } from "./hooks/useAdminDailyReportDetailState";

type LocationState = {
  report?: AdminDailyReport;
};

const STATUS_BADGE_CLASS: Record<"default" | "info" | "success", string> = {
  default:
    "inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600",
  info: "inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700",
  success:
    "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700",
};

interface AdminDailyReportDetailProps {
  overrideId?: string;
}

export default function AdminDailyReportDetail({
  overrideId,
}: AdminDailyReportDetailProps = {}) {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const id = overrideId ?? paramId;
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const initialReport = locationState?.report ?? null;
  const isCompact = overrideId !== undefined;

  const {
    report,
    reactions,
    comments,
    selectedReactions,
    commentInput,
    actionError,
    loadError,
    reactionEntries,
    commentEntries,
    isResolvingCurrentStaff,
    chipsDisabled,
    isCommentDisabled,
    shouldShowLoading,
    handleToggleReaction,
    handleSubmitComment,
    setCommentInput,
    clearActionError,
  } = useAdminDailyReportDetailState(id, initialReport);

  return (
    <div
      className={`w-full ${isCompact ? "px-2 pb-4 pt-0" : "px-2 pb-6 pt-4 sm:px-4 md:px-6"}`}
    >
      <div className="space-y-3">
        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        {actionError && (
          <div className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={clearActionError}
              className="ml-3 shrink-0 text-red-400 hover:text-red-600"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <DashboardInnerSurface>
            {shouldShowLoading ? (
              <p className="py-8 text-center text-sm text-slate-400">
                読み込み中...
              </p>
            ) : !report ? (
              <div className="space-y-3 py-4">
                <p className="font-semibold text-slate-700">
                  日報が見つかりません
                </p>
                <p className="text-sm text-slate-500">
                  URLが正しいか、一覧から改めて選択してください。
                </p>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  戻る
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/daily-report")}
                    className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    一覧に戻る
                  </button>
                </div>

                <div>
                  <SectionTitle className="text-lg font-bold text-slate-800">
                    {report.title}
                  </SectionTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-500">
                      {formatDateSlash(report.date) || report.date} |{" "}
                      {report.author}
                    </span>
                    <span
                      className={
                        STATUS_BADGE_CLASS[STATUS_META[report.status].color]
                      }
                    >
                      {STATUS_META[report.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    最終更新: {formatDateTimeReadable(report.updatedAt) || "-"}
                  </p>
                </div>

                <pre className="whitespace-pre-wrap font-[inherit] text-sm leading-relaxed text-slate-700">
                  {report.content || "内容は登録されていません"}
                </pre>

                <hr className="border-slate-100" />

                <DailyReportReactionSection
                  reactions={reactions}
                  selectedReactions={selectedReactions}
                  isDisabled={chipsDisabled}
                  isResolving={isResolvingCurrentStaff}
                  hasEntries={reactionEntries !== null}
                  onToggle={(type) => {
                    void handleToggleReaction(type);
                  }}
                />

                <hr className="border-slate-100" />

                <DailyReportCommentSection
                  comments={comments}
                  commentInput={commentInput}
                  isSubmitDisabled={isCommentDisabled}
                  isResolving={isResolvingCurrentStaff}
                  hasEntries={commentEntries !== null}
                  onInputChange={setCommentInput}
                  onClearError={clearActionError}
                  onSubmit={() => {
                    void handleSubmitComment();
                  }}
                />
              </div>
            )}
          </DashboardInnerSurface>
        </div>
      </div>
    </div>
  );
}

