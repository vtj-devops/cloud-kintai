import useCognitoUser from "@entities/staff/model/useCognitoUser";
import { Box, Container, useMediaQuery, useTheme } from "@mui/material";
import { useAppNotification } from "@shared/lib/useAppNotification";
import { useAutoSave } from "@shared/lib/useAutoSave";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";

import { createShiftRequestSummary } from "../model/shiftRequestSummary";
import { useShiftCalendarSelection } from "../model/useShiftCalendarSelection";
import { useShiftPatterns } from "../model/useShiftPatterns";
import { useShiftRequestData } from "../model/useShiftRequestData";
import { useShiftRequestPersist } from "../model/useShiftRequestPersist";
import {
  createStatusBackgroundMap,
  DEFAULT_NEW_PATTERN_MAPPING,
} from "./constants";
import { ShiftCalendarPanel } from "./ShiftCalendarPanel";
import { ShiftDayDetailPanel } from "./ShiftDayDetailPanel";
import { ShiftPatternCreateDialog } from "./ShiftPatternCreateDialog";
import { ShiftPatternListDialog } from "./ShiftPatternListDialog";
import { ShiftRequestHeader } from "./ShiftRequestHeader";
import { ShiftRequestNoteForm } from "./ShiftRequestNoteForm";
import { ShiftRequestToolbar } from "./ShiftRequestToolbar";

export default function ShiftRequestForm() {
  const { notify } = useAppNotification();
  const { cognitoUser, loading: cognitoUserLoading } = useCognitoUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));

  const statusBackgroundMap = useMemo(
    () => createStatusBackgroundMap(theme),
    [theme],
  );

  const monthStart = useMemo(
    () => currentMonth.startOf("month"),
    [currentMonth],
  );
  const daysInMonth = monthStart.daysInMonth();

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }).map((_, index) =>
        monthStart.add(index, "day"),
      ),
    [monthStart, daysInMonth],
  );

  const calendarDays = useMemo(() => {
    const start = monthStart.startOf("week");
    const end = monthStart.endOf("month").endOf("week");
    const items: Dayjs[] = [];
    let cursor = start;
    while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
      items.push(cursor);
      cursor = cursor.add(1, "day");
    }
    return items;
  }, [monthStart]);

  const dayKeyList = useMemo(
    () => days.map((day) => day.format("YYYY-MM-DD")),
    [days],
  );

  const {
    staff,
    isLoadingStaff,
    isLoadingShiftRequest,
    shiftRequestId,
    histories,
    selectedDates,
    setSelectedDates,
    note,
    setNote,
    setHistories,
    setShiftRequestId,
  } = useShiftRequestData({
    cognitoUserId: cognitoUser?.id,
    monthStart,
  });

  const { saveShiftRequest, isSaving } = useShiftRequestPersist({
    staff,
    monthStart,
    selectedDates,
    note,
    histories,
    shiftRequestId,
    setShiftRequestId,
    setHistories,
  });

  const {
    dayDetailRef,
    focusedDateKey,
    isSelectionMode,
    selectedRowKeys,
    hasRowSelection,
    canBulkSelectByWeekday,
    clearRowSelection,
    toggleAllRowsSelection,
    applyStatusToSelection,
    setStatusForDate,
    clearDateSelection,
    handleCalendarDayClick,
    handleWeekdayLabelClick,
    setIsSelectionMode,
  } = useShiftCalendarSelection({
    dayKeyList,
    days,
    monthStart,
    isMobile,
    setSelectedDates,
  });

  const {
    patterns,
    patternsLoading,
    patternDialogOpen,
    newPatternDialogOpen,
    newPatternName,
    newPatternMapping,
    setNewPatternName,
    setNewPatternMapping,
    openPatternDialog,
    closePatternDialog,
    closeNewPatternDialog,
    openCreateDialog,
    applyPattern,
    deletePattern,
    createPattern,
  } = useShiftPatterns({
    cognitoUser,
    cognitoUserLoading,
    days,
    setSelectedDates,
    notify,
    defaultMapping: DEFAULT_NEW_PATTERN_MAPPING,
  });

  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (isLoadingStaff || isLoadingShiftRequest || !staff) {
      return;
    }

    const timer = setTimeout(() => {
      setIsInitialLoadComplete(true);
    }, 500);

    return () => {
      clearTimeout(timer);
      setIsInitialLoadComplete(false);
    };
  }, [isLoadingStaff, isLoadingShiftRequest, staff]);

  const summary = useMemo(
    () => createShiftRequestSummary(selectedDates),
    [selectedDates],
  );

  const {
    isSaving: isAutoSaving,
    isPending: isAutoSavePending,
    lastSavedAt,
    lastChangedAt,
  } = useAutoSave({
    saveFn: async () => {
      if (!staff || isLoadingStaff || isLoadingShiftRequest) return;
      await saveShiftRequest(createShiftRequestSummary(selectedDates));
    },
    data: selectedDates,
    enabled:
      isInitialLoadComplete &&
      !!staff &&
      !isLoadingStaff &&
      !isLoadingShiftRequest,
    delay: 2000,
    onSaveSuccess: () => {
      notify({
        title: "自動保存完了",
        description: "シフトを自動保存しました",
        tone: "success",
        dedupeKey: "shift-auto-save-success",
      });
    },
    onSaveError: (error) => {
      console.error("Auto-save error:", error);
      notify({
        title: "自動保存エラー",
        description: "シフトの自動保存に失敗しました",
        tone: "error",
        dedupeKey: "shift-auto-save-error",
      });
    },
  });

  const interactionDisabled =
    !staff ||
    isLoadingStaff ||
    isLoadingShiftRequest ||
    isSaving ||
    isAutoSaving;
  const hasSelection = Object.keys(selectedDates).length > 0;

  const prevMonth = () => setCurrentMonth((month) => month.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth((month) => month.add(1, "month"));

  return (
    <Container
      disableGutters={isMobile}
      sx={{
        py: { xs: 1, sm: 2 },
        pb: isMobile ? 10 : 4,
        px: { xs: 1.5, sm: 2.5 },
        maxWidth: "1120px !important",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <ShiftRequestHeader />

        <ShiftRequestToolbar
          monthLabel={monthStart.format("YYYY年 M月")}
          isMobile={isMobile}
          isAutoSaving={isAutoSaving}
          isAutoSavePending={isAutoSavePending}
          lastSavedAt={lastSavedAt}
          lastChangedAt={lastChangedAt}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onOpenPatterns={openPatternDialog}
        />

        <ShiftCalendarPanel
          isLoading={isLoadingStaff || isLoadingShiftRequest}
          isMobile={isMobile}
          isTablet={isTablet}
          interactionDisabled={interactionDisabled}
          isSelectionMode={isSelectionMode}
          canBulkSelectByWeekday={canBulkSelectByWeekday}
          calendarDays={calendarDays}
          monthStart={monthStart}
          focusedDateKey={focusedDateKey}
          selectedRowKeys={selectedRowKeys}
          selectedDates={selectedDates}
          statusBackgroundMap={statusBackgroundMap}
          summary={summary}
          onToggleSelectionMode={setIsSelectionMode}
          onToggleAllRowsSelection={toggleAllRowsSelection}
          onClearRowSelection={clearRowSelection}
          onWeekdayLabelClick={handleWeekdayLabelClick}
          onCalendarDayClick={handleCalendarDayClick}
          detailPanel={
            <ShiftDayDetailPanel
              isMobile={isMobile}
              isSelectionMode={isSelectionMode}
              hasRowSelection={hasRowSelection}
              selectedRowCount={selectedRowKeys.length}
              focusedDateKey={focusedDateKey}
              selectedDates={selectedDates}
              interactionDisabled={interactionDisabled}
              dayDetailRef={dayDetailRef}
              onSelectStatus={applyStatusToSelection}
              onSelectStatusForDate={setStatusForDate}
              onClearDateSelection={clearDateSelection}
            />
          }
        />

        <ShiftRequestNoteForm
          note={note}
          isMobile={isMobile}
          isSaving={isSaving}
          interactionDisabled={interactionDisabled}
          hasSelection={hasSelection}
          summary={summary}
          onNoteChange={setNote}
          onSave={saveShiftRequest}
        />

        <ShiftPatternListDialog
          open={patternDialogOpen}
          isMobile={isMobile}
          patternsLoading={patternsLoading}
          patterns={patterns}
          onClose={closePatternDialog}
          onOpenCreate={openCreateDialog}
          onApply={applyPattern}
          onDelete={deletePattern}
        />

        <ShiftPatternCreateDialog
          open={newPatternDialogOpen}
          patternsLoading={patternsLoading}
          newPatternName={newPatternName}
          newPatternMapping={newPatternMapping}
          onClose={closeNewPatternDialog}
          onChangeName={setNewPatternName}
          onChangeMapping={(weekday, status) =>
            setNewPatternMapping((prev) => ({
              ...prev,
              [weekday]: status,
            }))
          }
          onSave={createPattern}
        />
      </Box>
    </Container>
  );
}
