import dayjs from "dayjs";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  areRowsEqual,
  createDefaultRows,
  EditableField,
  getOrInitYearRows,
  sanitizeCapacityValue,
  ShiftPlanRow,
} from "../shiftPlanUtils";

export type UseShiftPlanRowsReturn = {
  selectedYear: number;
  currentRows: ShiftPlanRow[];
  isDirty: boolean;
  isPending: boolean;
  yearlyPlans: Record<number, ShiftPlanRow[]>;
  setYearlyPlans: Dispatch<SetStateAction<Record<number, ShiftPlanRow[]>>>;
  savedYearlyPlans: Record<number, ShiftPlanRow[]>;
  setSavedYearlyPlans: Dispatch<SetStateAction<Record<number, ShiftPlanRow[]>>>;
  updateYearRows: (
    year: number,
    updater: (rows: ShiftPlanRow[]) => ShiftPlanRow[],
  ) => void;
  handleYearChange: (delta: number) => void;
  handleFieldChange: (month: number, field: EditableField, value: string) => void;
  handleToggleEnabled: (month: number) => void;
  handleDailyCapacityChange: (
    month: number,
    dayIndex: number,
    value: string,
  ) => void;
};

export const useShiftPlanRows = (): UseShiftPlanRowsReturn => {
  const initialYear = dayjs().year();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [yearlyPlans, setYearlyPlans] = useState<Record<number, ShiftPlanRow[]>>(
    () => ({ [initialYear]: createDefaultRows(initialYear) }),
  );
  const [isPending, startTransition] = useTransition();
  const [savedYearlyPlans, setSavedYearlyPlans] = useState<
    Record<number, ShiftPlanRow[]>
  >(() => ({ [initialYear]: createDefaultRows(initialYear) }));

  useEffect(() => {
    setYearlyPlans((prev) => {
      if (prev[selectedYear]) return prev;
      return { ...prev, [selectedYear]: getOrInitYearRows(selectedYear, prev) };
    });
    setSavedYearlyPlans((prev) => {
      if (prev[selectedYear]) return prev;
      return { ...prev, [selectedYear]: getOrInitYearRows(selectedYear, prev) };
    });
  }, [selectedYear]);

  const currentRows = yearlyPlans[selectedYear] ?? [];

  const isDirty = useMemo(() => {
    const current = yearlyPlans[selectedYear];
    const saved = savedYearlyPlans[selectedYear];
    if (!current || !saved) return false;
    return !areRowsEqual(current, saved);
  }, [yearlyPlans, savedYearlyPlans, selectedYear]);

  const updateYearRows = useCallback(
    (year: number, updater: (rows: ShiftPlanRow[]) => ShiftPlanRow[]) => {
      setYearlyPlans((prev) => {
        const rows = getOrInitYearRows(year, prev);
        return { ...prev, [year]: updater(rows) };
      });
    },
    [],
  );

  const ensureYearRows = useCallback(
    (year: number) => {
      updateYearRows(year, (rows) => rows);
    },
    [updateYearRows],
  );

  const handleYearChange = useCallback(
    (delta: number) => {
      const nextYear = selectedYear + delta;
      startTransition(() => {
        ensureYearRows(nextYear);
        setSelectedYear(nextYear);
      });
    },
    [ensureYearRows, selectedYear, startTransition],
  );

  const handleFieldChange = useCallback(
    (month: number, field: EditableField, value: string) => {
      updateYearRows(selectedYear, (rows) =>
        rows.map((row) => (row.month === month ? { ...row, [field]: value } : row)),
      );
    },
    [selectedYear, updateYearRows],
  );

  const handleToggleEnabled = useCallback(
    (month: number) => {
      updateYearRows(selectedYear, (rows) =>
        rows.map((row) =>
          row.month === month ? { ...row, enabled: !row.enabled } : row,
        ),
      );
    },
    [selectedYear, updateYearRows],
  );

  const handleDailyCapacityChange = useCallback(
    (month: number, dayIndex: number, value: string) => {
      const normalizedValue = sanitizeCapacityValue(value);
      updateYearRows(selectedYear, (rows) =>
        rows.map((row) => {
          if (row.month !== month) return row;
          const nextCapacity = [...row.dailyCapacity];
          nextCapacity[dayIndex] = normalizedValue;
          return { ...row, dailyCapacity: nextCapacity };
        }),
      );
    },
    [selectedYear, updateYearRows],
  );

  return {
    selectedYear,
    currentRows,
    isDirty,
    isPending,
    yearlyPlans,
    setYearlyPlans,
    savedYearlyPlans,
    setSavedYearlyPlans,
    updateYearRows,
    handleYearChange,
    handleFieldChange,
    handleToggleEnabled,
    handleDailyCapacityChange,
  };
};
