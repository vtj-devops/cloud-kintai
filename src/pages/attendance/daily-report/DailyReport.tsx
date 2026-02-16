import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import {
  DailyReportCalendar,
  DailyReportFormChangeHandler,
  DailyReportFormData,
  DailyReportFormFields,
} from "@features/attendance/daily-report";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"; // 保存時刻の表示形式
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  createDailyReport,
  updateDailyReport,
} from "@shared/api/graphql/documents/mutations";
import { dailyReportsByStaffId } from "@shared/api/graphql/documents/queries";
import type {
  CreateDailyReportMutation,
  DailyReport as DailyReportModel,
  DailyReportComment,
  DailyReportReaction,
  DailyReportReactionType,
  DailyReportsByStaffIdQuery,
  UpdateDailyReportMutation,
} from "@shared/api/graphql/types";
import {
  DailyReportStatus,
  ModelSortDirection,
} from "@shared/api/graphql/types";
import Page from "@shared/ui/page/Page";
import { GraphQLResult } from "aws-amplify/api";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import useCognitoUser from "@/hooks/useCognitoUser";
import { graphqlClient } from "@/shared/api/amplify/graphqlClient";
import { formatDateSlash, formatDateTimeReadable } from "@/shared/lib/time";
import { dashboardInnerSurfaceSx, PageSection } from "@/shared/ui/layout";

/**
 * 定数定義
 */
// 自動保存の遅延時間（ミリ秒）
const AUTO_SAVE_DELAY = 1000;
// 保存時刻の表示フォーマット
const TIME_FORMAT = "HH:mm:ss";
// 日付のフォーマット（YYYY-MM-DD）
const DATE_FORMAT = "YYYY-MM-DD";

type ReportStatus = DailyReportStatus;
type EditableStatus = Extract<ReportStatus, "DRAFT" | "SUBMITTED">;
type ReactionType = DailyReportReactionType;

interface ReportReaction {
  type: ReactionType;
  count: number;
}

interface AdminComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

interface DailyReportItem {
  id: string;
  staffId: string;
  date: string;
  author: string;
  title: string;
  content: string;
  status: ReportStatus;
  updatedAt?: string | null;
  createdAt?: string | null;
  reactions: ReportReaction[];
  comments: AdminComment[];
}

type DailyReportForm = DailyReportFormData;

const STATUS_META: Record<
  ReportStatus,
  { label: string; color: "default" | "info" | "success" }
> = {
  DRAFT: { label: "下書き", color: "default" },
  SUBMITTED: { label: "提出済", color: "info" },
  APPROVED: { label: "確認済", color: "success" },
};

const REACTION_META: Record<ReactionType, { label: string; emoji: string }> = {
  CHEER: { label: "GOOD", emoji: "👍" },
  CHECK: { label: "確認済", emoji: "✅" },
  THANKS: { label: "感謝", emoji: "🙌" },
  LOOK: { label: "見ました", emoji: "👀" },
};

/**
 * ヘルパー関数
 */

/** DateオブジェクトをYYYY-MM-DD形式の文字列に変換 */
const formatDateInput = (value: Date) => value.toISOString().slice(0, 10);

/** 日付から日報のデフォルトタイトルを生成 */
const buildDefaultTitle = (date: string) => (date ? `${date}の日報` : "日報");

/** 空の日報フォームを作成 */
const emptyForm = (
  initialDate?: string,
  initialAuthor?: string,
): DailyReportForm => {
  const date = initialDate ?? formatDateInput(new Date());
  return {
    date,
    author: initialAuthor ?? "",
    title: buildDefaultTitle(date),
    content: "",
  };
};

/** リアクション配列を集計してタイプごとのカウントに変換 */
const aggregateReactions = (
  entries?: (DailyReportReaction | null)[] | null,
): ReportReaction[] => {
  if (!entries?.length) return [];
  const counts = new Map<ReactionType, number>();
  entries
    .filter((entry): entry is DailyReportReaction => Boolean(entry))
    .forEach((entry) => {
      const type = entry.type as ReactionType;
      counts.set(type, (counts.get(type) ?? 0) + 1);
    });
  return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
};

/** コメント配列を整形し、作成日時の降順でソート */
const mapComments = (
  entries?: (DailyReportComment | null)[] | null,
): AdminComment[] => {
  if (!entries?.length) return [];
  return entries
    .filter((entry): entry is DailyReportComment => Boolean(entry))
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((entry) => ({
      id: entry.id,
      author: entry.authorName || "管理者",
      body: entry.body,
      createdAt: entry.createdAt,
    }));
};

/** GraphQLレスポンスの日報データを内部形式に変換 */
const mapDailyReport = (
  record: DailyReportModel,
  authorFallback: string,
): DailyReportItem => ({
  id: record.id,
  staffId: record.staffId,
  date: record.reportDate,
  author: authorFallback,
  title: record.title,
  content: record.content ?? "",
  status: record.status,
  updatedAt: record.updatedAt ?? record.createdAt ?? null,
  createdAt: record.createdAt ?? null,
  reactions: aggregateReactions(record.reactions),
  comments: mapComments(record.comments),
});

/** 日報を日付の降順、同日の場合は更新日時の降順でソート */
const sortReports = (items: DailyReportItem[]) =>
  items.toSorted((a, b) => {
    if (a.date === b.date) {
      const aTime = a.updatedAt ?? "";
      const bTime = b.updatedAt ?? "";
      return bTime.localeCompare(aTime);
    }
    return b.date.localeCompare(a.date);
  });

export default function DailyReport() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { cognitoUser, loading: isCognitoUserLoading } = useCognitoUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<DailyReportItem[]>([]);
  const [createForm, setCreateForm] = useState<DailyReportForm>(() =>
    emptyForm(),
  );
  const [calendarDate, setCalendarDate] = useState<Dayjs>(() =>
    dayjs().startOf("day"),
  );
  const [isInitializedFromUrl, setIsInitializedFromUrl] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DailyReportForm | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<
    string | "create" | null
  >(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [staffId, setStaffId] = useState<string | null>(null);
  const [isInitialViewPending, setIsInitialViewPending] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [createFormLastSavedAt, setCreateFormLastSavedAt] = useState<
    string | null
  >(null);
  const [editDraftLastSavedAt, setEditDraftLastSavedAt] = useState<
    string | null
  >(null);
  const createFormAutoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editDraftAutoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [createFormSavedState, setCreateFormSavedState] =
    useState<DailyReportForm>(() => emptyForm());
  const [editDraftSavedState, setEditDraftSavedState] =
    useState<DailyReportForm | null>(null);
  const createdReportIdRef = useRef<string | null>(null);
  const processedUserIdRef = useRef<string | null>(null);
  const { dateMap: reportsByDate, dateSet: reportedDateSet } = useMemo(() => {
    const dateMap = new Map<string, DailyReportItem>();
    const dateSet = new Set<string>();
    reports.forEach((report) => {
      if (!dateMap.has(report.date)) {
        dateMap.set(report.date, report);
      }
      dateSet.add(report.date);
    });
    return { dateMap, dateSet };
  }, [reports]);
  const isCreateMode = selectedReportId === "create";
  const resolvedAuthorName = authorName || "スタッフ";
  const isCreateFormDirty = useMemo(
    () => JSON.stringify(createForm) !== JSON.stringify(createFormSavedState),
    [createForm, createFormSavedState],
  );
  const isEditDraftDirty = useMemo(
    () =>
      editDraft &&
      JSON.stringify(editDraft) !== JSON.stringify(editDraftSavedState),
    [editDraft, editDraftSavedState],
  );
  const canSubmit = Boolean(staffId && createForm.title.trim());
  const canEditSubmit = Boolean(editDraft && editDraft.title.trim());
  const selectedReport =
    selectedReportId && selectedReportId !== "create"
      ? (reports.find((report) => report.id === selectedReportId) ?? null)
      : null;
  const showInitialLoading = isInitialViewPending;
  const isSelectedReportSubmitted =
    selectedReport?.status === DailyReportStatus.SUBMITTED;

  /**
   * URLパラメータから日付を初期化（マウント時のみ実行）
   * URLに日付がある場合はその日付を、ない場合は当日を表示する
   */
  useEffect(() => {
    if (isInitializedFromUrl) return;

    const dateParam = searchParams.get("date");
    let targetDate = dayjs().startOf("day");

    // URLパラメータから日付を取得
    if (dateParam) {
      const parsed = dayjs(dateParam, DATE_FORMAT);
      if (parsed.isValid()) {
        targetDate = parsed.startOf("day");
      }
    }

    // カレンダー日付と作成フォームを初期化
    setCalendarDate(targetDate);
    const dateKey = targetDate.format(DATE_FORMAT);
    setCreateForm((prev) =>
      emptyForm(dateKey, prev.author || resolvedAuthorName),
    );

    // URLパラメータがない、または無効な場合は当日をURLに設定
    if (!dateParam || !dayjs(dateParam, DATE_FORMAT).isValid()) {
      setSearchParams({ date: dateKey }, { replace: true });
    }

    setIsInitializedFromUrl(true);
  }, []);

  useEffect(() => {
    const nextDateString = selectedReport ? selectedReport.date : null;

    if (!nextDateString) return;

    // URLパラメータがある場合はcalendarDateを更新しない
    const dateParam = searchParams.get("date");
    if (dateParam) {
      return;
    }

    setCalendarDate((current) => {
      const nextDate = dayjs(nextDateString).startOf("day");
      return current.isSame(nextDate, "day") ? current : nextDate;
    });
  }, [selectedReport, searchParams]);

  useEffect(() => {
    if (isCognitoUserLoading) {
      return;
    }

    if (!cognitoUser?.id) {
      setAuthorName("スタッフ");
      setStaffId(null);
      setIsInitialViewPending(false);
      processedUserIdRef.current = null;
      return;
    }

    if (processedUserIdRef.current !== cognitoUser.id) {
      setIsInitialViewPending(true);
      processedUserIdRef.current = cognitoUser.id;
    }

    const currentUser = cognitoUser;
    const buildName = (family?: string | null, given?: string | null) =>
      [family, given]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(" ");

    let mounted = true;

    async function load() {
      try {
        const staff = await fetchStaff(currentUser.id);
        if (!mounted) return;
        const staffName = buildName(
          staff?.familyName ?? null,
          staff?.givenName ?? null,
        );
        const fallback = buildName(
          currentUser.familyName ?? null,
          currentUser.givenName ?? null,
        );
        setAuthorName(staffName || fallback || "スタッフ");
        setStaffId(staff?.id ?? null);
        if (!staff?.id) {
          setIsInitialViewPending(false);
        }
      } catch {
        if (!mounted) return;
        const fallback = buildName(
          currentUser.familyName ?? null,
          currentUser.givenName ?? null,
        );
        setAuthorName(fallback || "スタッフ");
        setStaffId(null);
        setIsInitialViewPending(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [cognitoUser, isCognitoUserLoading]);

  useEffect(() => {
    if (!authorName) return;
    setCreateForm((prev) =>
      prev.author === resolvedAuthorName
        ? prev
        : { ...prev, author: resolvedAuthorName },
    );
    setReports((prev) =>
      prev.map((report) => ({ ...report, author: resolvedAuthorName })),
    );
  }, [authorName, resolvedAuthorName]);

  const fetchReports = useCallback(async () => {
    if (!staffId) {
      setReports([]);
      setIsLoadingReports(false);
      setRequestError(null);
      setIsInitialViewPending(false);
      return;
    }

    setIsLoadingReports(true);
    setRequestError(null);
    try {
      const aggregated: DailyReportItem[] = [];
      let nextToken: string | null | undefined = undefined;

      do {
        const response = (await graphqlClient.graphql({
          query: dailyReportsByStaffId,
          variables: {
            staffId,
            sortDirection: ModelSortDirection.DESC,
            limit: 50,
            nextToken,
          },
          authMode: "userPool",
        })) as GraphQLResult<DailyReportsByStaffIdQuery>;

        if (response.errors?.length) {
          throw new Error(
            response.errors.map((error) => error.message).join("\n"),
          );
        }

        const items =
          response.data?.dailyReportsByStaffId?.items?.filter(
            (item): item is NonNullable<typeof item> => item !== null,
          ) ?? [];

        items.forEach((item) => {
          aggregated.push(mapDailyReport(item, resolvedAuthorName));
        });

        nextToken = response.data?.dailyReportsByStaffId?.nextToken;
      } while (nextToken);

      setReports(sortReports(aggregated));
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "日報の取得に失敗しました。",
      );
    } finally {
      setIsLoadingReports(false);
      setIsInitialViewPending(false);
    }
  }, [resolvedAuthorName, staffId]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    // selectedReportIdが明示的に"create"の場合は作成フォームを保持
    // 自動保存によってreportForCalendarDateが作成されても遷移しない
    if (selectedReportId === "create") {
      return;
    }

    if (reports.length === 0) {
      // 日報が一つもない場合は何も表示しない
      setSelectedReportId(null);
      setEditingReportId(null);
      setEditDraft(null);
      return;
    }

    if (selectedReportId && selectedReportId !== "create") {
      const exists = reports.some((report) => report.id === selectedReportId);
      if (!exists) {
        setSelectedReportId(reports[0].id);
      }
      return;
    }

    const calendarKey = calendarDate.format("YYYY-MM-DD");
    const reportForCalendarDate = reportsByDate.get(calendarKey) ?? null;

    // 初回ロード時や日付変更時：データがある場合のみ詳細画面を表示
    if (!selectedReportId && reportForCalendarDate) {
      setSelectedReportId(reportForCalendarDate.id);
    }
  }, [calendarDate, reports, reportsByDate, selectedReportId, isAutoSaving]);

  useEffect(() => {
    setEditingReportId(null);
    setEditDraft(null);
    setEditDraftSavedState(null);
    setEditDraftLastSavedAt(null);
    setActionError(null);
  }, [selectedReportId]);

  /**
   * カレンダーで日付を変更したときの処理
   * - 選択した日付をURLパラメータに反映
   * - 日報がある場合は詳細表示、ない場合は作成ボタンを表示
   * - フォーム内容と自動保存状態をリセット
   */
  const handleCalendarChange = (value: Dayjs | null) => {
    if (!value) return;
    const normalized = value.startOf("day");
    setCalendarDate(normalized);
    const dateKey = normalized.format(DATE_FORMAT);

    // URLに日付パラメータを反映
    setSearchParams({ date: dateKey });

    const reportForDate = reportsByDate.get(dateKey);
    if (reportForDate) {
      // 既存の日報がある場合は詳細表示
      setSelectedReportId(reportForDate.id);
      return;
    }

    // 日報がない場合は作成ボタン表示状態にリセット
    setSelectedReportId(null);
    setCreateFormLastSavedAt(null);
    setCreateForm(emptyForm(dateKey, resolvedAuthorName));
    createdReportIdRef.current = null;
  };

  const handleCreateChange: DailyReportFormChangeHandler = (field, value) => {
    setCreateForm((prev) => {
      if (field === "date") {
        const nextDate = value;
        const nextDefaultTitle = buildDefaultTitle(nextDate);
        const prevDefaultTitle = buildDefaultTitle(prev.date);
        const shouldSyncTitle =
          prev.title.trim() === "" || prev.title === prevDefaultTitle;
        return {
          ...prev,
          date: nextDate,
          title: shouldSyncTitle ? nextDefaultTitle : prev.title,
        };
      }
      if (field === "title") {
        return { ...prev, title: value };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleCreateSubmit = async (
    status: EditableStatus,
    showNotification = true,
  ) => {
    if (!createForm.title.trim()) {
      setActionError("タイトルを入力してください。");
      return;
    }
    if (!staffId) {
      setActionError("スタッフ情報が取得できないため日報を作成できません。");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    // 自動保存の場合はフラグを設定
    if (!showNotification) {
      setIsAutoSaving(true);
    }
    const resolvedAuthor =
      (createForm.author || resolvedAuthorName).trim() || resolvedAuthorName;

    try {
      // 既に作成済みのレポートIDがある場合は更新、ない場合は新規作成
      if (createdReportIdRef.current) {
        // 更新処理
        const response = (await graphqlClient.graphql({
          query: updateDailyReport,
          variables: {
            input: {
              id: createdReportIdRef.current,
              reportDate: createForm.date,
              title: createForm.title.trim(),
              content: createForm.content,
              status,
              updatedAt: new Date().toISOString(),
            },
          },
          authMode: "userPool",
        })) as GraphQLResult<UpdateDailyReportMutation>;

        if (response.errors?.length) {
          throw new Error(
            response.errors.map((error) => error.message).join("\n"),
          );
        }

        const updated = response.data?.updateDailyReport;
        if (!updated) {
          throw new Error("日報の更新に失敗しました。");
        }

        const mapped = mapDailyReport(updated, resolvedAuthor);
        setReports((prev) =>
          sortReports([
            mapped,
            ...prev.filter((report) => report.id !== mapped.id),
          ]),
        );

        // 保存時刻を記録
        setCreateFormLastSavedAt(dayjs().format(TIME_FORMAT));
        // 保存済み状態を更新
        setCreateFormSavedState(createForm);

        // 手動保存時のみ詳細画面に遷移
        if (showNotification) {
          setSelectedReportId(mapped.id);
          // 手動保存時：作成済みレポートIDをクリア
          createdReportIdRef.current = null;
        } else {
          // 自動保存時：selectedReportIdを"create"に固定して詳細画面への遷移を防ぐ
          setSelectedReportId("create");
        }

        // 手動保存時のみフォームをリセット
        if (showNotification) {
          const resetDate = formatDateInput(new Date());
          setCreateForm(() => emptyForm(resetDate, resolvedAuthorName));
        }
      } else {
        // 新規作成処理
        const response = (await graphqlClient.graphql({
          query: createDailyReport,
          variables: {
            input: {
              staffId,
              reportDate: createForm.date,
              title: createForm.title.trim(),
              content: createForm.content,
              status,
              updatedAt: new Date().toISOString(),
              reactions: [],
              comments: [],
            },
          },
          authMode: "userPool",
        })) as GraphQLResult<CreateDailyReportMutation>;

        if (response.errors?.length) {
          throw new Error(
            response.errors.map((error) => error.message).join("\n"),
          );
        }

        const created = response.data?.createDailyReport;
        if (!created) {
          throw new Error("日報の作成に失敗しました。");
        }

        const mapped = mapDailyReport(created, resolvedAuthor);
        setReports((prev) =>
          sortReports([
            mapped,
            ...prev.filter((report) => report.id !== mapped.id),
          ]),
        );

        // 作成されたレポートIDを保持（自動保存時のみ）
        if (!showNotification) {
          createdReportIdRef.current = created.id;
        }

        // 保存時刻を記録
        setCreateFormLastSavedAt(dayjs().format(TIME_FORMAT));
        // 保存済み状態を更新
        setCreateFormSavedState(createForm);

        // 手動保存時のみ詳細画面に遷移
        if (showNotification) {
          setSelectedReportId(mapped.id);
        } else {
          // 自動保存時：selectedReportIdを"create"に固定して詳細画面への遷移を防ぐ
          setSelectedReportId("create");
        }

        // 手動保存時のみフォームをリセット
        if (showNotification) {
          const resetDate = formatDateInput(new Date());
          setCreateForm(() => emptyForm(resetDate, resolvedAuthorName));
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "日報の作成に失敗しました。";
      setActionError(errorMessage);
    } finally {
      setIsSubmitting(false);
      // 自動保存フラグをリセット
      setIsAutoSaving(false);
    }
  };

  const handleStartEdit = (report: DailyReportItem) => {
    setActionError(null);
    setEditingReportId(report.id);
    const editDraftForm = {
      date: report.date,
      author: report.author || resolvedAuthorName,
      title: report.title,
      content: report.content,
    };
    setEditDraft(editDraftForm);
    setEditDraftSavedState(editDraftForm);
    setEditDraftLastSavedAt(null);
  };

  const handleEditChange: DailyReportFormChangeHandler = (field, value) => {
    setEditDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveEdit = async (
    status: EditableStatus,
    showNotification = true,
  ) => {
    if (!editingReportId || !editDraft) return;
    if (!editDraft.title.trim()) {
      setActionError("タイトルを入力してください。");
      return;
    }

    setIsUpdating(true);
    setActionError(null);
    // 自動保存の場合はフラグを設定
    if (!showNotification) {
      setIsAutoSaving(true);
    }

    try {
      const response = (await graphqlClient.graphql({
        query: updateDailyReport,
        variables: {
          input: {
            id: editingReportId,
            reportDate: editDraft.date,
            title: editDraft.title.trim(),
            content: editDraft.content,
            status,
            updatedAt: new Date().toISOString(),
          },
        },
        authMode: "userPool",
      })) as GraphQLResult<UpdateDailyReportMutation>;

      if (response.errors?.length) {
        throw new Error(
          response.errors.map((error) => error.message).join("\n"),
        );
      }

      const updated = response.data?.updateDailyReport;
      if (!updated) {
        throw new Error("日報の更新に失敗しました。");
      }

      const mapped = mapDailyReport(updated, resolvedAuthorName);
      setReports((prev) =>
        sortReports(
          prev.map((report) => (report.id === mapped.id ? mapped : report)),
        ),
      );

      // 保存時刻を記録
      setEditDraftLastSavedAt(dayjs().format(TIME_FORMAT));
      // 保存済み状態を更新
      setEditDraftSavedState(editDraft);

      if (showNotification && status === DailyReportStatus.SUBMITTED) {
        setEditingReportId(null);
        setEditDraft(null);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "日報の更新に失敗しました。";
      setActionError(errorMessage);
    } finally {
      setIsUpdating(false);
      // 自動保存フラグをリセット
      setIsAutoSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setEditDraft(null);
    setActionError(null);
  };

  /**
   * 作成フォーム用の自動保存
   * - 入力停止後AUTO_SAVE_DELAY（1秒）経過後に自動保存を実行
   * - デバウンス処理により、連続入力中は保存しない
   * - タイトルと内容の両方が入力されている場合のみ保存
   */
  useEffect(() => {
    // 既存のタイマーをクリア（デバウンス処理）
    if (createFormAutoSaveTimerRef.current) {
      clearTimeout(createFormAutoSaveTimerRef.current);
    }

    // 保存条件: 作成モード、内容が変更されている、タイトルと内容が両方とも空ではない
    if (
      isCreateMode &&
      isCreateFormDirty &&
      createForm.title.trim() !== "" &&
      createForm.content.trim() !== ""
    ) {
      createFormAutoSaveTimerRef.current = setTimeout(() => {
        void handleCreateSubmit(DailyReportStatus.DRAFT, false);
      }, AUTO_SAVE_DELAY);
    }

    // クリーンアップ: コンポーネントのアンマウント時やdependenciesの変更時
    return () => {
      if (createFormAutoSaveTimerRef.current) {
        clearTimeout(createFormAutoSaveTimerRef.current);
      }
    };
  }, [createForm, isCreateFormDirty, isCreateMode, handleCreateSubmit]);

  /**
   * 編集フォーム用の自動保存
   * デバウンス処理により、入力停止後AUTO_SAVE_DELAY(3秒)経過後に自動保存
   */
  useEffect(() => {
    // 既存のタイマーをクリア（デバウンス処理）
    if (editDraftAutoSaveTimerRef.current) {
      clearTimeout(editDraftAutoSaveTimerRef.current);
    }

    // 保存条件: 編集中、内容が変更されている、提出済みではない、タイトルが空ではない
    if (
      editingReportId &&
      editDraft &&
      isEditDraftDirty &&
      !isSelectedReportSubmitted &&
      editDraft.title.trim() !== ""
    ) {
      editDraftAutoSaveTimerRef.current = setTimeout(() => {
        void handleSaveEdit(DailyReportStatus.DRAFT, false);
      }, AUTO_SAVE_DELAY);
    }

    // クリーンアップ: コンポーネントのアンマウント時やdependenciesの変更時
    return () => {
      if (editDraftAutoSaveTimerRef.current) {
        clearTimeout(editDraftAutoSaveTimerRef.current);
      }
    };
  }, [
    editDraft,
    isEditDraftDirty,
    editingReportId,
    isSelectedReportSubmitted,
    handleSaveEdit,
  ]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
      <Page title="日報" maxWidth="xl" showDefaultHeader={false}>
        <PageSection layoutVariant="dashboard">
          <Stack spacing={3}>
            <Box>
              <Typography variant="h1">日報</Typography>
            </Box>

            {requestError && (
              <Alert severity="error" onClose={() => setRequestError(null)}>
                {requestError}
              </Alert>
            )}

            <Grid
              container
              spacing={{ xs: 2, md: 3 }}
              alignItems="flex-start"
            >
              <Grid item xs={12} md={3}>
                <Box sx={dashboardInnerSurfaceSx}>
                  <DailyReportCalendar
                    value={calendarDate}
                    onChange={handleCalendarChange}
                    reportedDateSet={reportedDateSet}
                    isLoadingReports={isLoadingReports}
                    hasReports={reports.length > 0}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={9}>
                <Box sx={dashboardInnerSurfaceSx}>
                  <Stack spacing={3}>
                    {actionError && (
                      <Alert
                        severity="error"
                        onClose={() => setActionError(null)}
                      >
                        {actionError}
                      </Alert>
                    )}
                    {showInitialLoading ? (
                      <Stack spacing={2}>
                        <Skeleton variant="text" width="40%" height={32} />
                        <Skeleton variant="text" width="60%" height={48} />
                        <Skeleton variant="rectangular" height={160} />
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={2}
                        >
                          <Skeleton variant="rounded" width={120} height={36} />
                          <Skeleton variant="rounded" width={140} height={36} />
                          <Skeleton variant="rounded" width={140} height={36} />
                        </Stack>
                      </Stack>
                    ) : isCreateMode ? (
                      <Stack spacing={2}>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            新しい日報を登録
                          </Typography>
                          <Typography
                            variant="h5"
                            sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
                          >
                            日報作成フォーム
                          </Typography>
                        </Box>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          この日報はまだ提出されていません。下書き保存後、必ず「提出する」ボタンをクリックしてください。
                        </Alert>
                        <Divider />
                        <Box
                          component="form"
                          onSubmit={(event) => event.preventDefault()}
                        >
                          <Stack spacing={3}>
                            <DailyReportFormFields
                              form={createForm}
                              onChange={handleCreateChange}
                              resolvedAuthorName={resolvedAuthorName}
                            />
                            {createFormLastSavedAt && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                最終保存: {createFormLastSavedAt}
                              </Typography>
                            )}
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="flex-end"
                              spacing={2}
                              alignItems={{ xs: "stretch", sm: "center" }}
                            >
                              <Button
                                type="button"
                                variant="text"
                                fullWidth={isMobile}
                                onClick={() => {
                                  setActionError(null);
                                  const newForm = emptyForm(
                                    undefined,
                                    resolvedAuthorName,
                                  );
                                  setCreateForm(() => newForm);
                                  setCreateFormSavedState(newForm);
                                  setCreateFormLastSavedAt(null);
                                }}
                              >
                                クリア
                              </Button>
                              <Button
                                type="button"
                                variant="outlined"
                                fullWidth={isMobile}
                                disabled={!canSubmit || isSubmitting}
                                onClick={() => {
                                  void handleCreateSubmit(
                                    DailyReportStatus.DRAFT,
                                    true,
                                  );
                                }}
                              >
                                下書き保存
                              </Button>
                              <Button
                                type="button"
                                variant="contained"
                                fullWidth={isMobile}
                                disabled={!canSubmit || isSubmitting}
                                onClick={() => {
                                  void handleCreateSubmit(
                                    DailyReportStatus.SUBMITTED,
                                    true,
                                  );
                                }}
                              >
                                提出する
                              </Button>
                            </Stack>
                          </Stack>
                        </Box>
                      </Stack>
                    ) : selectedReportId ? (
                      (() => {
                        const report = selectedReport;
                        if (!report) {
                          return (
                            <Typography color="text.secondary">
                              選択中の日報が見つかりません。
                            </Typography>
                          );
                        }
                        const statusMeta = STATUS_META[report.status];
                        const isEditing =
                          editingReportId === report.id && Boolean(editDraft);
                        const hasReactions = report.reactions.length > 0;
                        const hasComments = report.comments.length > 0;

                        return (
                          <Stack spacing={2}>
                            <Stack
                              direction={{ xs: "column", md: "row" }}
                              justifyContent="space-between"
                              spacing={2}
                            >
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  color="text.secondary"
                                >
                                  {formatDateSlash(report.date) || report.date}{" "}
                                  | {report.author}
                                </Typography>
                                <Typography
                                  variant="h5"
                                  sx={{
                                    fontSize: { xs: "1.2rem", sm: "1.5rem" },
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {report.title}
                                </Typography>
                                {report.updatedAt && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    最終更新:{" "}
                                    {formatDateTimeReadable(report.updatedAt) ||
                                      "-"}
                                  </Typography>
                                )}
                              </Box>
                              <Chip
                                label={statusMeta.label}
                                color={statusMeta.color}
                                sx={{
                                  alignSelf: { xs: "flex-start", md: "center" },
                                }}
                              />
                            </Stack>

                            <Divider />

                            {report.status === DailyReportStatus.DRAFT && (
                              <Alert severity="warning">
                                この日報はまだ提出されていません。内容を確認して「提出する」ボタンをクリックしてください。
                              </Alert>
                            )}

                            {isEditing && editDraft ? (
                              <Stack spacing={2}>
                                <DailyReportFormFields
                                  form={editDraft}
                                  onChange={handleEditChange}
                                  resolvedAuthorName={resolvedAuthorName}
                                />
                                {editDraftLastSavedAt && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    最終保存: {editDraftLastSavedAt}
                                  </Typography>
                                )}
                              </Stack>
                            ) : (
                              <Typography
                                component="pre"
                                sx={{
                                  whiteSpace: "pre-wrap",
                                  fontFamily: "inherit",
                                }}
                              >
                                {report.content ||
                                  "内容はまだ入力されていません。"}
                              </Typography>
                            )}

                            {hasReactions && (
                              <>
                                <Divider />
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ mb: 1 }}
                                  >
                                    管理者からのリアクション
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                    sx={{ mb: 2 }}
                                  >
                                    {report.reactions.map((reaction) => {
                                      const meta = REACTION_META[reaction.type];
                                      if (!meta) return null;
                                      return (
                                        <Chip
                                          key={reaction.type}
                                          variant="outlined"
                                          size="small"
                                          label={`${meta.emoji} ${meta.label} ×${reaction.count}`}
                                        />
                                      );
                                    })}
                                  </Stack>
                                </Box>
                              </>
                            )}

                            {hasComments && (
                              <>
                                <Divider />
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    管理者からのコメント
                                  </Typography>
                                  <Stack spacing={1}>
                                    {report.comments.map((comment) => (
                                      <Paper
                                        key={comment.id}
                                        variant="outlined"
                                        sx={{ p: 1.5 }}
                                      >
                                        <Stack
                                          direction="row"
                                          justifyContent="space-between"
                                        >
                                          <Typography
                                            variant="body2"
                                            fontWeight={600}
                                          >
                                            {comment.author}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {formatDateTimeReadable(
                                              comment.createdAt,
                                            ) || comment.createdAt}
                                          </Typography>
                                        </Stack>
                                        <Typography sx={{ mt: 0.5 }}>
                                          {comment.body}
                                        </Typography>
                                      </Paper>
                                    ))}
                                  </Stack>
                                </Box>
                              </>
                            )}
                          </Stack>
                        );
                      })()
                    ) : (
                      <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary" textAlign="center">
                          {calendarDate.format("YYYY年MM月DD日")}
                          の日報はまだ登録されていません。
                        </Typography>
                        <Button
                          variant="contained"
                          fullWidth={isMobile}
                          onClick={() => {
                            setSelectedReportId("create");
                            setCreateForm(
                              emptyForm(
                                calendarDate.format("YYYY-MM-DD"),
                                resolvedAuthorName,
                              ),
                            );
                            // 新規作成ボタンを押したときは作成済みレポートIDをクリア
                            createdReportIdRef.current = null;
                          }}
                        >
                          この日の日報を作成する
                        </Button>
                      </Stack>
                    )}

                    {!isCreateMode && selectedReportId && (
                      <Stack spacing={2}>
                        <Divider />
                        {editingReportId && editDraft ? (
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ xs: "stretch", sm: "center" }}
                          >
                            <Button
                              variant="outlined"
                              fullWidth={isMobile}
                              disabled={!canEditSubmit || isUpdating}
                              onClick={() => {
                                void handleSaveEdit(
                                  DailyReportStatus.DRAFT,
                                  true,
                                );
                              }}
                            >
                              下書き保存
                            </Button>
                            <Button
                              variant="contained"
                              fullWidth={isMobile}
                              disabled={
                                !canEditSubmit ||
                                isUpdating ||
                                isSelectedReportSubmitted
                              }
                              onClick={() => {
                                void handleSaveEdit(
                                  DailyReportStatus.SUBMITTED,
                                  true,
                                );
                              }}
                            >
                              提出する
                            </Button>
                            <Button
                              variant="text"
                              fullWidth={isMobile}
                              onClick={handleCancelEdit}
                            >
                              キャンセル
                            </Button>
                          </Stack>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: {
                                xs: "stretch",
                                sm: "flex-end",
                              },
                            }}
                          >
                            <Button
                              variant="outlined"
                              fullWidth={isMobile}
                              disabled={isUpdating}
                              onClick={() => {
                                if (selectedReport) {
                                  handleStartEdit(selectedReport);
                                }
                              }}
                            >
                              編集
                            </Button>
                          </Box>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </PageSection>
      </Page>
    </LocalizationProvider>
  );
}
