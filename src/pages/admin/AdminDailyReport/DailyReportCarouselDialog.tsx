import { AuthContext } from "@app/providers/auth/AuthContext";
import {
  logDailyReportCommentAdd,
  logDailyReportReactionUpdate,
} from "@entities/operation-log/model/dailyReportOperationLog";
import useCognitoUser from "@entities/staff/model/useCognitoUser";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { sendDailyReportCommentNotification } from "@features/attendance/daily-report/lib/sendDailyReportCommentNotification";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  buildVersionOrUpdatedAtCondition,
  getGraphQLErrorMessage,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import { updateDailyReport } from "@shared/api/graphql/documents/mutations";
import { getDailyReport } from "@shared/api/graphql/documents/queries";
import type {
  DailyReportComment,
  DailyReportReaction,
  GetDailyReportQuery,
  UpdateDailyReportMutation,
} from "@shared/api/graphql/types";
import { formatDateSlash, formatDateTimeReadable } from "@shared/lib/time";
import { SectionTitle, SubsectionTitle } from "@shared/ui/typography";
import type { GraphQLResult } from "aws-amplify/api";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  type AdminDailyReport,
  mapDailyReport,
  REACTION_META,
  type ReactionType,
  STATUS_META,
} from "./data";
import { useCurrentStaff } from "./useCurrentStaff";

interface DailyReportCarouselDialogProps {
  open: boolean;
  onClose: () => void;
  selectedReport: AdminDailyReport;
  filteredReports: AdminDailyReport[];
}

const STATUS_BADGE_CLASS: Record<"default" | "info" | "success", string> = {
  default:
    "inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600",
  info: "inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700",
  success:
    "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700",
};

const normalizeReactions = (
  entries?: (DailyReportReaction | null)[] | null,
): DailyReportReaction[] =>
  entries?.filter((entry): entry is DailyReportReaction => Boolean(entry)) ??
  [];

const normalizeComments = (
  entries?: (DailyReportComment | null)[] | null,
): DailyReportComment[] =>
  entries?.filter((entry): entry is DailyReportComment => Boolean(entry)) ?? [];

const buildDailyReportBeforeSnapshot = ({
  report,
  reactionEntries,
  commentEntries,
}: {
  report: AdminDailyReport;
  reactionEntries: DailyReportReaction[] | null;
  commentEntries: DailyReportComment[] | null;
}) => ({
  id: report.id,
  staffId: report.staffId,
  reportDate: report.date,
  title: report.title,
  content: report.content,
  status: report.status,
  reactions: reactionEntries ?? [],
  comments: commentEntries ?? [],
  createdAt: report.createdAt ?? null,
  updatedAt: report.updatedAt,
  version: report.version ?? null,
});

interface PreloadedReport {
  report: AdminDailyReport;
  reactionEntries: DailyReportReaction[];
  commentEntries: DailyReportComment[];
}

export default function DailyReportCarouselDialog({
  open,
  onClose,
  selectedReport,
  filteredReports,
}: DailyReportCarouselDialogProps) {
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs, loading: isStaffLoading } = useStaffs({ isAuthenticated });
  const { cognitoUser } = useCognitoUser();
  const [currentIndex, setCurrentIndex] = useState(
    filteredReports.findIndex((r) => r.id === selectedReport.id),
  );
  const [report, setReport] = useState<AdminDailyReport>(selectedReport);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [preloadedReports, setPreloadedReports] = useState<
    Map<string, PreloadedReport>
  >(new Map());
  const [commentInput, setCommentInput] = useState<string>("");
  const [reactionEntries, setReactionEntries] = useState<
    DailyReportReaction[] | null
  >(null);
  const [commentEntries, setCommentEntries] = useState<
    DailyReportComment[] | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSavingReaction, setIsSavingReaction] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const {
    currentStaffId,
    currentStaffName,
    isResolving: isResolvingCurrentStaff,
  } = useCurrentStaff(cognitoUser);

  const reactions = useMemo(() => report?.reactions ?? [], [report]);
  const comments = useMemo(() => report?.comments ?? [], [report]);
  const selectedReactions = useMemo(() => {
    if (!reactionEntries || !currentStaffId) return [];
    return reactionEntries
      .filter((entry) => entry.staffId === currentStaffId)
      .map((entry) => entry.type as ReactionType);
  }, [currentStaffId, reactionEntries]);

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

  const currentReport = filteredReports[currentIndex];

  const fetchReport = useCallback(async () => {
    if (!currentReport) return;

    const preloaded = preloadedReports.get(currentReport.id);
    if (preloaded) {
      setReport(preloaded.report);
      setReactionEntries(preloaded.reactionEntries);
      setCommentEntries(preloaded.commentEntries);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const response = (await graphqlClient.graphql({
        query: getDailyReport,
        variables: { id: currentReport.id },
        authMode: "userPool",
      })) as GraphQLResult<GetDailyReportQuery>;

      if (response.errors?.length) {
        throw new Error(response.errors.map((err) => err.message).join("\n"));
      }

      const record = response.data?.getDailyReport;
      if (!record) throw new Error("日報が見つかりませんでした。");

      const fetchedReactions = normalizeReactions(record.reactions);
      const fetchedComments = normalizeComments(record.comments);
      const mappedReport = mapDailyReport(
        record,
        buildStaffName(record.staffId),
      );

      setReactionEntries(fetchedReactions);
      setCommentEntries(fetchedComments);
      setReport(mappedReport);

      setPreloadedReports((prev) =>
        new Map(prev).set(currentReport.id, {
          report: mappedReport,
          reactionEntries: fetchedReactions,
          commentEntries: fetchedComments,
        }),
      );
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "日報の取得に失敗しました。",
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentReport, buildStaffName, preloadedReports]);

  useEffect(() => {
    if (open) {
      setCurrentIndex(
        filteredReports.findIndex((r) => r.id === selectedReport.id),
      );
      setPreloadedReports(new Map());
    }
  }, [open, selectedReport.id, filteredReports]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (!open || filteredReports.length === 0) return;
    let mounted = true;
    const preloadReports = async () => {
      for (let i = 0; i < filteredReports.length; i++) {
        if (!mounted) break;
        const reportToPreload = filteredReports[i];
        if (
          preloadedReports.has(reportToPreload.id) ||
          reportToPreload.id === currentReport?.id
        ) {
          continue;
        }
        try {
          const response = (await graphqlClient.graphql({
            query: getDailyReport,
            variables: { id: reportToPreload.id },
            authMode: "userPool",
          })) as GraphQLResult<GetDailyReportQuery>;

          if (!mounted) break;
          if (response.errors?.length) continue;

          const record = response.data?.getDailyReport;
          if (!record) continue;

          const preloadedReactions = normalizeReactions(record.reactions);
          const preloadedComments = normalizeComments(record.comments);
          const mappedReport = mapDailyReport(
            record,
            buildStaffName(record.staffId),
          );

          if (mounted) {
            setPreloadedReports((prev) =>
              new Map(prev).set(reportToPreload.id, {
                report: mappedReport,
                reactionEntries: preloadedReactions,
                commentEntries: preloadedComments,
              }),
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch {
          // silently skip failed preloads
        }
      }
    };
    void preloadReports();
    return () => {
      mounted = false;
    };
  }, [open, filteredReports, buildStaffName, currentReport, preloadedReports]);

  useEffect(() => {
    setCommentInput("");
  }, [report]);

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < filteredReports.length - 1)
      setCurrentIndex(currentIndex + 1);
  };

  const handleToggleReaction = async (type: ReactionType) => {
    if (!report) return;
    if (!reactionEntries) {
      setActionError(
        "リアクション情報の取得中です。少し待ってから再度お試しください。",
      );
      return;
    }
    if (!currentStaffId || isResolvingCurrentStaff) {
      setActionError(
        "スタッフ情報が取得できないため、リアクションを登録できません。",
      );
      return;
    }
    if (isSavingReaction) return;

    setIsSavingReaction(true);
    setActionError(null);

    const hasReaction = reactionEntries.some(
      (entry) => entry.staffId === currentStaffId && entry.type === type,
    );
    const timestamp = new Date().toISOString();
    const nextEntries = hasReaction
      ? reactionEntries.filter(
          (entry) => entry.staffId !== currentStaffId || entry.type !== type,
        )
      : [
          ...reactionEntries,
          {
            __typename: "DailyReportReaction",
            staffId: currentStaffId,
            type,
            createdAt: timestamp,
          },
        ];

    try {
      const beforeReport = buildDailyReportBeforeSnapshot({
        report,
        reactionEntries,
        commentEntries,
      });
      const response = (await graphqlClient.graphql({
        query: updateDailyReport,
        variables: {
          condition: buildVersionOrUpdatedAtCondition(
            report.version,
            report.updatedAt,
          ),
          input: {
            id: report.id,
            reactions: nextEntries.map(({ staffId, type, createdAt }) => ({
              staffId,
              type,
              createdAt,
            })),
            updatedAt: timestamp,
            version: getNextVersion(report.version),
          },
        },
        authMode: "userPool",
      })) as GraphQLResult<UpdateDailyReportMutation>;

      if (response.errors?.length) {
        throw new Error(
          getGraphQLErrorMessage(
            response.errors,
            "リアクションの更新に失敗しました。",
          ),
        );
      }

      const updated = response.data?.updateDailyReport;
      if (!updated) throw new Error("リアクションの更新に失敗しました。");

      await logDailyReportReactionUpdate({
        actorStaffId: currentStaffId,
        before: beforeReport,
        after: updated,
        operation: hasReaction ? "remove" : "add",
        reactionType: type,
      });

      setReactionEntries(normalizeReactions(updated.reactions));
      setCommentEntries(normalizeComments(updated.comments));
      setReport(mapDailyReport(updated, buildStaffName(updated.staffId)));
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "リアクションの登録に失敗しました。",
      );
    } finally {
      setIsSavingReaction(false);
    }
  };

  const handleSubmitComment = async () => {
    const body = commentInput.trim();
    if (!body) return;
    if (!report) return;
    if (!commentEntries) {
      setActionError(
        "コメント情報の取得中です。少し待ってから再度お試しください。",
      );
      return;
    }
    if (!currentStaffId || isResolvingCurrentStaff) {
      setActionError(
        "スタッフ情報が取得できないため、コメントを登録できません。",
      );
      return;
    }
    if (isSavingComment) return;

    setIsSavingComment(true);
    setActionError(null);

    const timestamp = new Date().toISOString();
    const newCommentEntry: DailyReportComment = {
      __typename: "DailyReportComment",
      id: `admin-comment-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      staffId: currentStaffId,
      authorName: currentStaffName,
      body,
      createdAt: timestamp,
    };
    const nextComments = [newCommentEntry, ...commentEntries];

    try {
      const beforeReport = buildDailyReportBeforeSnapshot({
        report,
        reactionEntries,
        commentEntries,
      });
      const response = (await graphqlClient.graphql({
        query: updateDailyReport,
        variables: {
          condition: buildVersionOrUpdatedAtCondition(
            report.version,
            report.updatedAt,
          ),
          input: {
            id: report.id,
            comments: nextComments.map(
              ({
                id: commentId,
                staffId,
                authorName,
                body: commentBody,
                createdAt,
              }) => ({
                id: commentId,
                staffId,
                authorName,
                body: commentBody,
                createdAt,
              }),
            ),
            updatedAt: timestamp,
            version: getNextVersion(report.version),
          },
        },
        authMode: "userPool",
      })) as GraphQLResult<UpdateDailyReportMutation>;

      if (response.errors?.length) {
        throw new Error(
          getGraphQLErrorMessage(
            response.errors,
            "コメントの更新に失敗しました。",
          ),
        );
      }

      const updated = response.data?.updateDailyReport;
      if (!updated) throw new Error("コメントの更新に失敗しました。");

      try {
        await sendDailyReportCommentNotification({
          staffs,
          report: updated,
          commentAuthorName: currentStaffName,
          commentBody: body,
        });
      } catch (mailError) {
        console.error(
          "Failed to send daily report comment notification:",
          mailError,
        );
      }

      await logDailyReportCommentAdd({
        actorStaffId: currentStaffId,
        before: beforeReport,
        after: updated,
        comment: newCommentEntry,
      });

      setReactionEntries(normalizeReactions(updated.reactions));
      setCommentEntries(normalizeComments(updated.comments));
      setReport(mapDailyReport(updated, buildStaffName(updated.staffId)));
      setCommentInput("");
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "コメントの登録に失敗しました。",
      );
    } finally {
      setIsSavingComment(false);
    }
  };

  const chipsDisabled =
    !reactionEntries ||
    !currentStaffId ||
    isSavingReaction ||
    isResolvingCurrentStaff;
  const isCommentDisabled =
    !commentInput.trim() ||
    !currentStaffId ||
    !commentEntries ||
    isSavingComment ||
    isResolvingCurrentStaff;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
          <SectionTitle className="text-base font-bold text-slate-800">日報を確認</SectionTitle>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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

        {/* Carousel navigation */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex <= 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
          <span className="text-xs text-slate-500">
            {currentIndex + 1} / {filteredReports.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= filteredReports.length - 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading || isStaffLoading ? (
            <p className="py-8 text-center text-sm text-slate-400">
              読み込み中...
            </p>
          ) : loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </div>
          ) : !report ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              日報が見つかりません
            </div>
          ) : (
            <div className="space-y-4">
              {actionError && (
                <div className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span>{actionError}</span>
                  <button
                    type="button"
                    onClick={() => setActionError(null)}
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

              {/* Report header */}
              <div>
                <SubsectionTitle className="text-base font-bold text-slate-800">
                  {report.title}
                </SubsectionTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">
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
                <p className="mt-0.5 text-xs text-slate-400">
                  最終更新: {formatDateTimeReadable(report.updatedAt) || "-"}
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Content */}
              <pre className="whitespace-pre-wrap font-[inherit] text-sm leading-relaxed text-slate-700">
                {report.content || "内容は登録されていません"}
              </pre>

              <hr className="border-slate-100" />

              {/* Reactions */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  リアクション
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(REACTION_META) as ReactionType[]).map(
                    (type) => {
                      const meta = REACTION_META[type];
                      const count =
                        reactions.find((r) => r.type === type)?.count ?? 0;
                      const isSelected = selectedReactions.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={chipsDisabled}
                          onClick={() => {
                            void handleToggleReaction(type);
                          }}
                          className={[
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition",
                            isSelected
                              ? "border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                            chipsDisabled
                              ? "cursor-not-allowed opacity-50"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {meta.emoji} {meta.label}
                          {count > 0 && (
                            <span className="ml-1 text-slate-400">
                              ({count})
                            </span>
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
                {reactions.length === 0 && (
                  <p className="text-xs text-slate-400">
                    まだリアクションはありません。
                  </p>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Comments */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  コメント
                </p>
                <textarea
                  value={commentInput}
                  onChange={(e) => {
                    if (actionError) setActionError(null);
                    setCommentInput(e.target.value);
                  }}
                  placeholder="コメントを入力"
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSubmitComment();
                    }}
                    disabled={isCommentDisabled}
                    className="inline-flex h-8 items-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    追加
                  </button>
                </div>

                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    まだコメントはありません。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            {comment.author}
                          </span>
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatDateTimeReadable(comment.createdAt) ||
                              comment.createdAt}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {comment.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
