import { useEffect, useRef } from "react";

import type { DailyReportForm } from "../dailyReportTypes";

interface UseDailyReportAutoSaveParams {
  delay: number;
  isCreateMode: boolean;
  createForm: DailyReportForm;
  isCreateFormDirty: boolean;
  onCreateDraftAutoSave: () => void;
  editingReportId: string | null;
  editDraft: DailyReportForm | null;
  isEditDraftDirty: boolean;
  isSelectedReportSubmitted: boolean;
  onEditDraftAutoSave: () => void;
}

export function useDailyReportAutoSave({
  delay,
  isCreateMode,
  createForm,
  isCreateFormDirty,
  onCreateDraftAutoSave,
  editingReportId,
  editDraft,
  isEditDraftDirty,
  isSelectedReportSubmitted,
  onEditDraftAutoSave,
}: UseDailyReportAutoSaveParams) {
  const createFormAutoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const editDraftAutoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (createFormAutoSaveTimerRef.current) {
      clearTimeout(createFormAutoSaveTimerRef.current);
    }

    if (
      isCreateMode &&
      isCreateFormDirty &&
      createForm.title.trim() !== "" &&
      createForm.content.trim() !== ""
    ) {
      createFormAutoSaveTimerRef.current = setTimeout(() => {
        onCreateDraftAutoSave();
      }, delay);
    }

    return () => {
      if (createFormAutoSaveTimerRef.current) {
        clearTimeout(createFormAutoSaveTimerRef.current);
      }
    };
  }, [
    createForm,
    delay,
    isCreateFormDirty,
    isCreateMode,
    onCreateDraftAutoSave,
  ]);

  useEffect(() => {
    if (editDraftAutoSaveTimerRef.current) {
      clearTimeout(editDraftAutoSaveTimerRef.current);
    }

    if (
      editingReportId &&
      editDraft &&
      isEditDraftDirty &&
      !isSelectedReportSubmitted &&
      editDraft.title.trim() !== ""
    ) {
      editDraftAutoSaveTimerRef.current = setTimeout(() => {
        onEditDraftAutoSave();
      }, delay);
    }

    return () => {
      if (editDraftAutoSaveTimerRef.current) {
        clearTimeout(editDraftAutoSaveTimerRef.current);
      }
    };
  }, [
    delay,
    editDraft,
    editingReportId,
    isEditDraftDirty,
    isSelectedReportSubmitted,
    onEditDraftAutoSave,
  ]);
}
