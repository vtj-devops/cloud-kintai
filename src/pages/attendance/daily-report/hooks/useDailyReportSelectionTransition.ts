import type { Dayjs } from "dayjs";
import { type Dispatch, type SetStateAction,useEffect } from "react";

import type { DailyReportForm, DailyReportItem } from "../dailyReportTypes";

interface UseDailyReportSelectionTransitionParams {
  calendarDate: Dayjs;
  reports: DailyReportItem[];
  reportsByDate: Map<string, DailyReportItem>;
  selectedReportId: string | "create" | null;
  isAutoSaving: boolean;
  setSelectedReportId: Dispatch<SetStateAction<string | "create" | null>>;
  setEditingReportId: Dispatch<SetStateAction<string | null>>;
  setEditDraft: Dispatch<SetStateAction<DailyReportForm | null>>;
  setEditDraftSavedState: Dispatch<SetStateAction<DailyReportForm | null>>;
  setEditDraftLastSavedAt: Dispatch<SetStateAction<string | null>>;
  setActionError: Dispatch<SetStateAction<string | null>>;
}

export function useDailyReportSelectionTransition({
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
}: UseDailyReportSelectionTransitionParams) {
  useEffect(() => {
    if (selectedReportId === "create") {
      return;
    }

    if (reports.length === 0) {
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

    if (!selectedReportId && reportForCalendarDate) {
      setSelectedReportId(reportForCalendarDate.id);
    }
  }, [
    calendarDate,
    reports,
    reportsByDate,
    selectedReportId,
    isAutoSaving,
    setSelectedReportId,
    setEditingReportId,
    setEditDraft,
  ]);

  useEffect(() => {
    setEditingReportId(null);
    setEditDraft(null);
    setEditDraftSavedState(null);
    setEditDraftLastSavedAt(null);
    setActionError(null);
  }, [
    selectedReportId,
    setActionError,
    setEditDraft,
    setEditDraftLastSavedAt,
    setEditDraftSavedState,
    setEditingReportId,
  ]);
}
