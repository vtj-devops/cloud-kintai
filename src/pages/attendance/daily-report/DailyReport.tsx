import "./styles.scss";

import { logDailyReportMutation } from "@entities/operation-log/model/dailyReportOperationLog";
import {
  DailyReportCalendar,
  DailyReportFormChangeHandler,
} from "@features/attendance/daily-report";
import { sendDailyReportSubmissionNotification } from "@features/attendance/daily-report/lib/sendDailyReportSubmissionNotification";
import type { DailyReport as DailyReportModel } from "@shared/api/graphql/types";
import { DailyReportStatus } from "@shared/api/graphql/types";
import { useAppNotification } from "@shared/lib/useAppNotification";
import {
  DashboardInnerSurface,
  PageContent,
  PageSection,
} from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";
import { type Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  AlertBox,
  CreateReportSection,
  EditActionSection,
  HeroSection,
  LoadingSection,
  NoReportSection,
  Panel,
  ReportDetailSection,
  ReportSummaryHeader,
  VStack,
} from "./dailyReportComponents";
import {
  buildDefaultTitle,
  emptyForm,
  formatDateInput,
  mapDailyReport,
  sortReports,
} from "./dailyReportHelpers";
import type {
  DailyReportForm,
  DailyReportItem,
  EditableStatus,
} from "./dailyReportTypes";
import { useDailyReportAutoSave } from "./hooks/useDailyReportAutoSave";
import { useDailyReportData } from "./hooks/useDailyReportData";
import { useDailyReportSelectionTransition } from "./hooks/useDailyReportSelectionTransition";
import { useDailyReportUrlSync } from "./hooks/useDailyReportUrlSync";
import {
  createDailyReportRecord,
  updateDailyReportRecord,
} from "./services/dailyReportMutations";

const AUTO_SAVE_DELAY = 1000;
const DATE_FORMAT = "YYYY-MM-DD";
const DEFAULT_AUTHOR_NAME = "スタッフ";

export default function DailyReport() {
  const { notify } = useAppNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createForm, setCreateForm] = useState<DailyReportForm>(() =>
    emptyForm(),
  );
  const [isHeroDescriptionExpanded, setIsHeroDescriptionExpanded] =
    useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DailyReportForm | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<
    string | "create" | null
  >(null);
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
  const [createFormSavedState, setCreateFormSavedState] =
    useState<DailyReportForm>(() => emptyForm());
  const [editDraftSavedState, setEditDraftSavedState] =
    useState<DailyReportForm | null>(null);
  const createdReportIdRef = useRef<string | null>(null);
  const {
    authorName,
    staffId,
    staffs,
    reports,
    setReports,
    requestError,
    setRequestError,
    isInitialViewPending,
  } = useDailyReportData(DEFAULT_AUTHOR_NAME);
  const {
    dateMap: reportsByDate,
    dateSet: reportedDateSet,
    idMap: reportsById,
  } = useMemo(() => {
    const dateMap = new Map<string, DailyReportItem>();
    const dateSet = new Set<string>();
    const idMap = new Map<string, DailyReportItem>();
    reports.forEach((report) => {
      if (!dateMap.has(report.date)) {
        dateMap.set(report.date, report);
      }
      idMap.set(report.id, report);
      dateSet.add(report.date);
    });
    return { dateMap, dateSet, idMap };
  }, [reports]);
  const isCreateMode = selectedReportId === "create";
  const resolvedAuthorName = authorName || DEFAULT_AUTHOR_NAME;
  const notifyAdminsForSubmission = useCallback(
    async (report: DailyReportModel) => {
      try {
        await sendDailyReportSubmissionNotification({
          staffs,
          report,
          fallbackAuthorName: resolvedAuthorName,
        });
      } catch (mailError) {
        console.error(
          "Failed to send daily report submission notification:",
          mailError,
        );
        notify({
          title: "メール送信エラー",
          description: "管理者への通知メールの送信に失敗しました。",
          tone: "error",
          dedupeKey: "daily-report-mail-error",
        });
      }
    },
    [notify, resolvedAuthorName, staffs],
  );
  const isCreateFormDirty = useMemo(
    () => JSON.stringify(createForm) !== JSON.stringify(createFormSavedState),
    [createForm, createFormSavedState],
  );
  const isEditDraftDirty = useMemo(
    () =>
      Boolean(
        editDraft &&
          JSON.stringify(editDraft) !== JSON.stringify(editDraftSavedState),
      ),
    [editDraft, editDraftSavedState],
  );
  const canSubmit = Boolean(staffId && createForm.title.trim());
  const canEditSubmit = Boolean(editDraft && editDraft.title.trim());
  const selectedReport =
    selectedReportId && selectedReportId !== "create"
      ? (reportsById.get(selectedReportId) ?? null)
      : null;
  const showInitialLoading = isInitialViewPending;
  const isSelectedReportSubmitted =
    selectedReport?.status === DailyReportStatus.SUBMITTED;
  const { calendarDate, syncCalendarDateToUrl } = useDailyReportUrlSync({
    dateFormat: DATE_FORMAT,
    searchParams,
    setSearchParams,
    onInitialize: (dateKey) => {
      setCreateForm((prev) =>
        emptyForm(dateKey, prev.author || resolvedAuthorName),
      );
    },
  });

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

  useDailyReportSelectionTransition({
    calendarDate,
    reports,
    reportsByDate,
    selectedReportId,
    isAutoSaving,
    setSelectedReportId,
    setEditingReportId,
    setEditDraft,
    setEditDraftSavedState,
    setEditDraftLastSavedAt,
    setActionError,
  });

  const handleCalendarChange = (value: Dayjs | null) => {
    if (!value) return;
    const { dateKey } = syncCalendarDateToUrl(value);

    const reportForDate = reportsByDate.get(dateKey);
    if (reportForDate) {
      setSelectedReportId(reportForDate.id);
      return;
    }

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

  const getReportConcurrencyState = (reportId: string) => {
    const target = reportsById.get(reportId);
    return {
      version: target?.version,
      updatedAt: target?.updatedAt,
    };
  };

  const upsertReport = (next: DailyReportItem) => {
    setReports((prev) =>
      sortReports([next, ...prev.filter((report) => report.id !== next.id)]),
    );
  };

  const resetCreateFormWithToday = () => {
    const resetDate = formatDateInput(new Date());
    setCreateForm(() => emptyForm(resetDate, resolvedAuthorName));
  };

  const applyCreateSaveResult = ({
    mappedId,
    showNotification,
    shouldClearCreatedReportId,
  }: {
    mappedId: string;
    showNotification: boolean;
    shouldClearCreatedReportId: boolean;
  }) => {
    setCreateFormLastSavedAt(new Date().toISOString());
    setCreateFormSavedState(createForm);

    if (showNotification) {
      setSelectedReportId(mappedId);
      if (shouldClearCreatedReportId) {
        createdReportIdRef.current = null;
      }
      resetCreateFormWithToday();
      return;
    }

    setSelectedReportId("create");
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
    if (!showNotification) {
      setIsAutoSaving(true);
    }
    const resolvedAuthor =
      (createForm.author || resolvedAuthorName).trim() || resolvedAuthorName;

    try {
      if (createdReportIdRef.current) {
        const beforeReport =
          reportsById.get(createdReportIdRef.current) ?? null;
        const concurrencyState = getReportConcurrencyState(
          createdReportIdRef.current,
        );
        const updated = await updateDailyReportRecord({
          id: createdReportIdRef.current,
          reportDate: createForm.date,
          title: createForm.title.trim(),
          content: createForm.content,
          status,
          concurrencyState,
        });

        if (showNotification && status === DailyReportStatus.SUBMITTED) {
          await notifyAdminsForSubmission(updated);
        }

        if (showNotification) {
          await logDailyReportMutation({
            actorStaffId: staffId,
            before: beforeReport,
            after: updated,
            action:
              status === DailyReportStatus.SUBMITTED ? "submit" : "update",
          });
        }

        const mapped = mapDailyReport(updated, resolvedAuthor);
        upsertReport(mapped);
        applyCreateSaveResult({
          mappedId: mapped.id,
          showNotification,
          shouldClearCreatedReportId: true,
        });
      } else {
        const created = await createDailyReportRecord({
          staffId,
          reportDate: createForm.date,
          title: createForm.title.trim(),
          content: createForm.content,
          status,
        });

        if (showNotification && status === DailyReportStatus.SUBMITTED) {
          await notifyAdminsForSubmission(created);
        }

        if (showNotification) {
          await logDailyReportMutation({
            actorStaffId: staffId,
            before: null,
            after: created,
            action:
              status === DailyReportStatus.SUBMITTED ? "submit" : "create",
          });
        }

        const mapped = mapDailyReport(created, resolvedAuthor);
        upsertReport(mapped);

        if (!showNotification) {
          createdReportIdRef.current = created.id;
        }
        applyCreateSaveResult({
          mappedId: mapped.id,
          showNotification,
          shouldClearCreatedReportId: false,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "日報の作成に失敗しました。";
      setActionError(errorMessage);
    } finally {
      setIsSubmitting(false);
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
    if (!showNotification) {
      setIsAutoSaving(true);
    }

    try {
      const beforeReport = reportsById.get(editingReportId) ?? null;
      const concurrencyState = getReportConcurrencyState(editingReportId);
      const updated = await updateDailyReportRecord({
        id: editingReportId,
        reportDate: editDraft.date,
        title: editDraft.title.trim(),
        content: editDraft.content,
        status,
        concurrencyState,
      });

      if (showNotification && status === DailyReportStatus.SUBMITTED) {
        await notifyAdminsForSubmission(updated);
      }

      if (showNotification && staffId) {
        await logDailyReportMutation({
          actorStaffId: staffId,
          before: beforeReport,
          after: updated,
          action: status === DailyReportStatus.SUBMITTED ? "submit" : "update",
        });
      }

      const mapped = mapDailyReport(updated, resolvedAuthorName);
      setReports((prev) =>
        sortReports(
          prev.map((report) => (report.id === mapped.id ? mapped : report)),
        ),
      );

      setEditDraftLastSavedAt(new Date().toISOString());
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
      setIsAutoSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setEditDraft(null);
    setActionError(null);
  };

  const handleClearCreateForm = () => {
    setActionError(null);
    const newForm = emptyForm(undefined, resolvedAuthorName);
    setCreateForm(() => newForm);
    setCreateFormSavedState(newForm);
    setCreateFormLastSavedAt(null);
  };

  const handleSaveCreateDraft = () => {
    void handleCreateSubmit(DailyReportStatus.DRAFT, true);
  };

  const handleSubmitCreateReport = () => {
    void handleCreateSubmit(DailyReportStatus.SUBMITTED, true);
  };

  const handleStartCreateForCalendarDate = () => {
    setSelectedReportId("create");
    setCreateForm(
      emptyForm(calendarDate.format("YYYY-MM-DD"), resolvedAuthorName),
    );
    createdReportIdRef.current = null;
  };

  const handleSaveEditedDraft = () => {
    void handleSaveEdit(DailyReportStatus.DRAFT, true);
  };

  const handleSubmitEditedReport = () => {
    void handleSaveEdit(DailyReportStatus.SUBMITTED, true);
  };

  const handleEditSelectedReport = () => {
    if (selectedReport) {
      handleStartEdit(selectedReport);
    }
  };

  useDailyReportAutoSave({
    delay: AUTO_SAVE_DELAY,
    isCreateMode,
    createForm,
    isCreateFormDirty,
    onCreateDraftAutoSave: () => {
      void handleCreateSubmit(DailyReportStatus.DRAFT, false);
    },
    editingReportId,
    editDraft,
    isEditDraftDirty,
    isSelectedReportSubmitted,
    onEditDraftAutoSave: () => {
      void handleSaveEdit(DailyReportStatus.DRAFT, false);
    },
  });

  return (
    <Page title="日報" width="full" showDefaultHeader={false}>
      <PageContent width="content">
        <PageSection
          layoutVariant="dashboard"
          variant="plain"
          className="daily-report-section"
        >
          <VStack className="daily-report-page">
            <HeroSection
              isDescriptionExpanded={isHeroDescriptionExpanded}
              onToggleDescription={() =>
                setIsHeroDescriptionExpanded((current) => !current)
              }
            />

            {requestError && (
              <AlertBox tone="error" onClose={() => setRequestError(null)}>
                {requestError}
              </AlertBox>
            )}

            <div className="daily-report-grid">
              <div className="daily-report-sidebar">
                <Panel className="dr-panel--calendar">
                  <VStack className="dr-gap-1">
                    <div>
                      <p className="daily-report-calendar-label">日付を選択</p>
                    </div>
                    <DashboardInnerSurface>
                      <DailyReportCalendar
                        value={calendarDate}
                        onChange={handleCalendarChange}
                        reportedDateSet={reportedDateSet}
                      />
                    </DashboardInnerSurface>
                  </VStack>
                </Panel>
              </div>

              <div>
                <Panel className="dr-panel--detail">
                  <VStack className="daily-report-card-body">
                    <ReportSummaryHeader calendarDate={calendarDate} />

                    {actionError && (
                      <AlertBox
                        tone="error"
                        onClose={() => setActionError(null)}
                      >
                        {actionError}
                      </AlertBox>
                    )}

                    {showInitialLoading ? (
                      <LoadingSection />
                    ) : isCreateMode ? (
                      <CreateReportSection
                        createForm={createForm}
                        createFormLastSavedAt={createFormLastSavedAt}
                        canSubmit={canSubmit}
                        isSubmitting={isSubmitting}
                        onChange={handleCreateChange}
                        onClear={handleClearCreateForm}
                        onSaveDraft={handleSaveCreateDraft}
                        onSubmit={handleSubmitCreateReport}
                      />
                    ) : selectedReportId ? (
                      selectedReport ? (
                        <ReportDetailSection
                          report={selectedReport}
                          isEditing={
                            editingReportId === selectedReport.id &&
                            Boolean(editDraft)
                          }
                          editDraft={editDraft}
                          isSelectedReportSubmitted={isSelectedReportSubmitted}
                          editDraftLastSavedAt={editDraftLastSavedAt}
                          onEditChange={handleEditChange}
                        />
                      ) : (
                        <p className="dr-not-found-message">
                          選択中の日報が見つかりません。
                        </p>
                      )
                    ) : (
                      <NoReportSection
                        onCreate={handleStartCreateForCalendarDate}
                      />
                    )}

                    {!isCreateMode && selectedReportId && (
                      <EditActionSection
                        isEditing={Boolean(editingReportId && editDraft)}
                        canEditSubmit={canEditSubmit}
                        isUpdating={isUpdating}
                        isSelectedReportSubmitted={isSelectedReportSubmitted}
                        onSaveDraft={handleSaveEditedDraft}
                        onSubmit={handleSubmitEditedReport}
                        onCancel={handleCancelEdit}
                        onEdit={handleEditSelectedReport}
                      />
                    )}
                  </VStack>
                </Panel>
              </div>
            </div>
          </VStack>
        </PageSection>
      </PageContent>
    </Page>
  );
}
