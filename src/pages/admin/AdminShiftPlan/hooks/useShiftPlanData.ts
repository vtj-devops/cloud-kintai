import { EditableField, ShiftPlanRow } from "../shiftPlanUtils";
import { useShiftPlanFetching } from "./useShiftPlanFetching";
import { useShiftPlanRows } from "./useShiftPlanRows";
import { useShiftPlanSave } from "./useShiftPlanSave";

export type ShiftPlanRecordMeta = {
  id: string;
  version?: number | null;
  updatedAt?: string | null;
};

type ShiftPlanDataState = {
  selectedYear: number;
  currentRows: ShiftPlanRow[];
  isDirty: boolean;
  isPending: boolean;
  isFetchingYear: boolean;
  isSaving: boolean;
  setIsSaving: (value: boolean | ((prev: boolean) => boolean)) => void;
  yearRecordIds: Record<number, ShiftPlanRecordMeta>;
  lastAutoSaveTime: string | null;
  handleYearChange: (delta: number) => void;
  handleFieldChange: (month: number, field: EditableField, value: string) => void;
  handleToggleEnabled: (month: number) => void;
  handleDailyCapacityChange: (
    month: number,
    dayIndex: number,
    value: string,
  ) => void;
  handleSaveAll: () => Promise<void>;
  performSave: (
    rows: ShiftPlanRow[],
    year: number,
    recordIds: Record<number, ShiftPlanRecordMeta>,
    showNotification?: boolean,
  ) => Promise<boolean>;
};

export const useShiftPlanData = (): ShiftPlanDataState => {
  const rows = useShiftPlanRows();
  const save = useShiftPlanSave({
    selectedYear: rows.selectedYear,
    currentRows: rows.currentRows,
    setSavedYearlyPlans: rows.setSavedYearlyPlans,
  });
  const { isFetchingYear } = useShiftPlanFetching({
    selectedYear: rows.selectedYear,
    setYearlyPlans: rows.setYearlyPlans,
    setSavedYearlyPlans: rows.setSavedYearlyPlans,
    setYearRecordIds: save.setYearRecordIds,
  });

  return {
    selectedYear: rows.selectedYear,
    currentRows: rows.currentRows,
    isDirty: rows.isDirty,
    isPending: rows.isPending,
    isFetchingYear,
    isSaving: save.isSaving,
    setIsSaving: save.setIsSaving,
    yearRecordIds: save.yearRecordIds,
    lastAutoSaveTime: save.lastAutoSaveTime,
    handleYearChange: rows.handleYearChange,
    handleFieldChange: rows.handleFieldChange,
    handleToggleEnabled: rows.handleToggleEnabled,
    handleDailyCapacityChange: rows.handleDailyCapacityChange,
    handleSaveAll: save.handleSaveAll,
    performSave: save.performSave,
  };
};
