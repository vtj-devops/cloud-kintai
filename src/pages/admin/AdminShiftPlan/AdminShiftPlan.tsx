import { useCalendars } from "@entities/calendar/model/useCalendars";
import { designTokenVar } from "@shared/designSystem";
import { useAppNotification } from "@shared/lib/useAppNotification";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo } from "react";

import * as MESSAGE_CODE from "@/errors";

import { ShiftPlanFooter, ShiftPlanHeader, ShiftPlanTable } from "./components";
import { useAutoSave, useDayCellFocus, useShiftPlanData } from "./hooks";

const PAGE_PADDING_X_XS = designTokenVar("spacing.sm", "8px");
const PAGE_PADDING_X_MD = designTokenVar("spacing.xxl", "32px");
const PAGE_PADDING_Y = designTokenVar("spacing.xxl", "32px");
const PAGE_SECTION_GAP = designTokenVar("spacing.lg", "16px");

export default function AdminShiftPlan() {
  const { notify } = useAppNotification();
  const {
    selectedYear,
    currentRows,
    isDirty,
    isPending,
    isFetchingYear,
    isSaving,
    yearRecordIds,
    lastAutoSaveTime,
    handleYearChange,
    handleFieldChange,
    handleToggleEnabled,
    handleDailyCapacityChange,
    handleSaveAll,
    performSave,
  } = useShiftPlanData();
  const { registerCellRef, focusCell } = useDayCellFocus();
  const { holidayCalendars, error: calendarsError } = useCalendars();

  useEffect(() => {
    if (calendarsError) {
      console.error(calendarsError);
      notify({
        title: "エラー",
        description: MESSAGE_CODE.E00001,
        tone: "error",
        dedupeKey: "holiday-calendar-error",
      });
    }
  }, [calendarsError, notify]);

  const holidayNameMap = useMemo(() => {
    if (!holidayCalendars.length) return new Map<string, string>();
    return new Map(
      holidayCalendars.map((calendar) => [
        dayjs(calendar.holidayDate).format("YYYY-MM-DD"),
        calendar.name,
      ]),
    );
  }, [holidayCalendars]);

  const handleTabNextDay = useCallback(
    (month: number, dayIndex: number) => {
      // 次の日のインデックスを計算
      const monthCursor = dayjs()
        .year(selectedYear)
        .month(month - 1);
      const daysInMonth = monthCursor.daysInMonth();

      let nextMonth = month;
      let nextDayIndex = dayIndex + 1;

      // 月を超える場合
      if (nextDayIndex >= daysInMonth) {
        nextMonth = month === 12 ? 1 : month + 1;
        nextDayIndex = 0;
      }

      // 次のセルへフォーカスを移す
      const nextCellId = `cell-${selectedYear}-${nextMonth}-${nextDayIndex}`;
      focusCell(nextCellId);
    },
    [selectedYear, focusCell],
  );

  const { isAutoSaving } = useAutoSave({
    isDirty,
    currentRows,
    selectedYear,
    yearRecordIds,
    performSave,
  });
  const isBusy = isPending || isFetchingYear || isSaving || isAutoSaving;
  const { dialog } = usePageLeaveGuard({
    isDirty,
    isBusy: isSaving || isAutoSaving,
  });

  return (
    <section
      className="flex flex-col flex-1 w-full box-border"
      style={{
        "--page-px-xs": PAGE_PADDING_X_XS,
        "--page-px-md": PAGE_PADDING_X_MD,
        paddingTop: PAGE_PADDING_Y,
        paddingBottom: PAGE_PADDING_Y,
        gap: PAGE_SECTION_GAP,
      } as React.CSSProperties}
    >
      {dialog}
      <div className="px-[var(--page-px-xs)] md:px-[var(--page-px-md)] flex flex-col gap-[inherit]">
        <ShiftPlanHeader
          selectedYear={selectedYear}
          isBusy={isBusy}
          onYearChange={handleYearChange}
        />

        <ShiftPlanTable
          selectedYear={selectedYear}
          rows={currentRows}
          isBusy={isBusy}
          holidayNameMap={holidayNameMap}
          onFieldChange={handleFieldChange}
          onToggleEnabled={handleToggleEnabled}
          onDailyCapacityChange={handleDailyCapacityChange}
          onTabNextDay={handleTabNextDay}
          onRegisterCellRef={registerCellRef}
        />

        <ShiftPlanFooter
          isAutoSaving={isAutoSaving}
          lastAutoSaveTime={lastAutoSaveTime}
          isBusy={isBusy}
          onSaveAll={handleSaveAll}
        />
      </div>
    </section>
  );
}
