import {
  useGetCompanyHolidayCalendarsQuery,
  useGetEventCalendarsQuery,
  useGetHolidayCalendarsQuery,
} from "@entities/calendar/api/calendarApi";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import InfoIcon from "@mui/icons-material/Info";
import LockIcon from "@mui/icons-material/Lock";
import {
  Alert,
  Box,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  TableCell,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { shiftPlanYearByTargetYear } from "@shared/api/graphql/documents/queries";
import type { ShiftPlanYearByTargetYearQuery } from "@shared/api/graphql/types";
import Page from "@shared/ui/page/Page";
import { GraphQLResult } from "aws-amplify/api";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import {
  type FC,
  memo,
  type MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AuthContext } from "@/context/AuthContext";
import { graphqlClient } from "@/shared/api/amplify/graphqlClient";

import { ActiveUsersList } from "../../../features/shift/collaborative/components/ActiveUsersList";
import { BatchEditToolbar } from "../../../features/shift/collaborative/components/BatchEditToolbar";
import { ChangeHistoryPanel } from "../../../features/shift/collaborative/components/ChangeHistoryPanel";
import { ConflictResolutionDialog } from "../../../features/shift/collaborative/components/ConflictResolutionDialog";
import { KeyboardShortcutsHelp } from "../../../features/shift/collaborative/components/KeyboardShortcutsHelp";
import {
  PresenceNotificationContainer,
  usePresenceNotifications,
} from "../../../features/shift/collaborative/components/PresenceNotification";
import { PrintShiftDialog } from "../../../features/shift/collaborative/components/PrintShiftDialog";
import { ShiftSuggestionsPanel } from "../../../features/shift/collaborative/components/ShiftSuggestionsPanel";
import { UndoRedoToolbar } from "../../../features/shift/collaborative/components/UndoRedoToolbar";
import { VirtualizedShiftTable } from "../../../features/shift/collaborative/components/VirtualizedShiftTable";
import { useCollaborativeShift } from "../../../features/shift/collaborative/context/CollaborativeShiftContext";
import { useClipboard } from "../../../features/shift/collaborative/hooks/useClipboard";
import { useKeyboardShortcuts } from "../../../features/shift/collaborative/hooks/useKeyboardShortcuts";
import { useMultiSelect } from "../../../features/shift/collaborative/hooks/useMultiSelect";
import { usePrintShift } from "../../../features/shift/collaborative/hooks/usePrintShift";
import { useShiftNavigation } from "../../../features/shift/collaborative/hooks/useShiftNavigation";
import { useShiftSuggestions } from "../../../features/shift/collaborative/hooks/useShiftSuggestions";
import { CollaborativeShiftProvider } from "../../../features/shift/collaborative/providers/CollaborativeShiftProvider";
import { SuggestedAction } from "../../../features/shift/collaborative/rules/shiftRules";
import { ShiftState } from "../../../features/shift/collaborative/types/collaborative.types";

// シフト状態の表示設定
const shiftStateConfig: Record<
  ShiftState,
  { label: string; color: string; text: string }
> = {
  work: { label: "○", color: "success.main", text: "出勤" },
  fixedOff: { label: "固", color: "error.main", text: "固定休" },
  requestedOff: { label: "希", color: "warning.main", text: "希望休" },
  auto: { label: "△", color: "info.main", text: "自動調整枠" },
  empty: { label: "-", color: "text.disabled", text: "未入力" },
};

const SHIFT_CELL_SIZE = 50;
const SHIFT_CELL_BASE_SX = {
  position: "relative",
  cursor: "pointer",
  minWidth: SHIFT_CELL_SIZE,
  maxWidth: SHIFT_CELL_SIZE,
  textAlign: "center",
  p: 0.5,
  "&:focus": {
    outline: "none",
  },
  userSelect: "none", // ドラッグ選択時のテキスト選択を防止
} as const;

interface ShiftCellProps {
  staffId: string;
  date: string;
  state: ShiftState;
  isLocked: boolean;
  isEditing: boolean;
  editorName?: string;
  lastChangedBy?: string;
  lastChangedAt?: string;
  onClick: (event: MouseEvent) => void;
  onRegisterRef?: (element: HTMLElement | null) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onMouseEnter?: () => void;
  isFocused?: boolean;
  isSelected?: boolean;
}

const ShiftCellBase: FC<ShiftCellProps> = ({
  state,
  isLocked,
  isEditing,
  editorName,
  lastChangedBy,
  lastChangedAt,
  onClick,
  onRegisterRef,
  onMouseDown,
  onMouseEnter,
  isFocused = false,
  isSelected = false,
}: ShiftCellProps) => {
  const config = shiftStateConfig[state];
  const isPending = false; // TODO: pendingChangesから取得
  const tooltipTitle = isLocked ? (
    "確定済み"
  ) : isEditing ? (
    `${editorName}が編集中`
  ) : (
    <Box>
      <Typography variant="caption">{config.text}</Typography>
      {lastChangedBy && (
        <Typography variant="caption" component="div">
          {lastChangedBy} ({lastChangedAt})
        </Typography>
      )}
    </Box>
  );

  return (
    <TableCell
      ref={onRegisterRef}
      tabIndex={0}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      sx={{
        ...SHIFT_CELL_BASE_SX,
        bgcolor: isEditing
          ? alpha("#2196f3", 0.1)
          : isPending
            ? alpha("#ff9800", 0.1)
            : isSelected
              ? alpha("#9c27b0", 0.15)
              : "background.paper",
        border: isEditing
          ? "2px solid #2196f3"
          : isFocused
            ? "2px solid #9c27b0"
            : undefined,
        "&:hover": isLocked
          ? {}
          : {
              bgcolor: alpha("#2196f3", 0.05),
            },
        "&:focus": {
          border: "2px solid #9c27b0",
        },
      }}
    >
      <Tooltip title={tooltipTitle}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            opacity: isLocked ? 0.5 : 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: config.color,
              fontWeight: 600,
            }}
          >
            {config.label}
          </Typography>
          {isLocked && <LockIcon sx={{ fontSize: 12 }} />}
          {isPending && (
            <Box
              sx={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                bgcolor: "warning.main",
              }}
            />
          )}
        </Box>
      </Tooltip>
    </TableCell>
  );
};

ShiftCellBase.propTypes = {
  state: PropTypes.oneOf(["work", "fixedOff", "requestedOff", "auto", "empty"])
    .isRequired,
  isLocked: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  editorName: PropTypes.string,
  lastChangedBy: PropTypes.string,
  lastChangedAt: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  onRegisterRef: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseEnter: PropTypes.func,
  isFocused: PropTypes.bool,
  isSelected: PropTypes.bool,
};

const ShiftCell = memo(ShiftCellBase);

type ActiveUser = {
  userId: string;
  userName: string;
  color: string;
  lastActivity: number;
};

type ShiftEvent = {
  label: string;
  start: dayjs.Dayjs;
  end?: dayjs.Dayjs;
  color: string;
};

const useShiftCalendar = (
  currentMonth: dayjs.Dayjs,
  registeredEventCalendars: Array<{
    id: string;
    eventDate: string;
    name: string;
  }>,
  holidays: Array<{
    holidayDate: string;
    name: string;
  }>,
  companyHolidays: Array<{
    holidayDate: string;
    name: string;
  }>,
) => {
  const theme = useTheme();
  const monthStart = useMemo(
    () => currentMonth.startOf("month"),
    [currentMonth],
  );
  const daysInMonth = monthStart.daysInMonth();
  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }).map((_, i) =>
        monthStart.add(i, "day"),
      ),
    [monthStart, daysInMonth],
  );
  const eventCalendar = useMemo<ShiftEvent[]>(() => {
    const events: ShiftEvent[] = [];

    // イベントカレンダー
    events.push(
      ...registeredEventCalendars.map((event) => ({
        label: event.name,
        start: dayjs(event.eventDate),
        end: dayjs(event.eventDate),
        color: theme.palette.info.main,
      })),
    );

    // 祝祭日カレンダー
    events.push(
      ...holidays.map((holiday) => ({
        label: holiday.name,
        start: dayjs(holiday.holidayDate),
        end: dayjs(holiday.holidayDate),
        color: theme.palette.error.main,
      })),
    );

    // 会社休日カレンダー
    events.push(
      ...companyHolidays.map((holiday) => ({
        label: holiday.name,
        start: dayjs(holiday.holidayDate),
        end: dayjs(holiday.holidayDate),
        color: theme.palette.warning.main,
      })),
    );

    return events;
  }, [registeredEventCalendars, holidays, companyHolidays, theme]);
  const dateKeys = useMemo(() => days.map((day) => day.format("DD")), [days]);

  return { days, dateKeys, eventCalendar };
};

const useSelectionState = (staffIds: string[], dateKeys: string[]) => {
  const { focusedCell, registerCell, focusCell, navigate, clearFocus } =
    useShiftNavigation({
      staffIds,
      dates: dateKeys,
    });

  const {
    selectedCells,
    selectionCount,
    isCellSelected,
    selectCell,
    toggleCell,
    selectRange,
    startDragSelect,
    updateDragSelect,
    endDragSelect,
    selectAll,
    clearSelection,
    isDragging,
  } = useMultiSelect({
    staffIds,
    dates: dateKeys,
  });

  return {
    focusedCell,
    registerCell,
    focusCell,
    navigate,
    clearFocus,
    selectedCells,
    selectionCount,
    isCellSelected,
    selectCell,
    toggleCell,
    selectRange,
    startDragSelect,
    updateDragSelect,
    endDragSelect,
    selectAll,
    clearSelection,
    isDragging,
  };
};

const useClipboardOps = (
  staffIds: string[],
  dateKeys: string[],
  getShiftState: (staffId: string, date: string) => ShiftState | undefined,
) =>
  useClipboard({
    staffIds,
    dates: dateKeys,
    getShiftState,
  });

function useShiftMetrics<T extends { state: ShiftState }>(
  days: dayjs.Dayjs[],
  staffIds: string[],
  shiftDataMap: Map<string, Map<string, T>>,
) {
  const dailyCountsByKey = useMemo(() => {
    const counts = new Map<
      string,
      { work: number; fixedOff: number; requestedOff: number }
    >();
    days.forEach((day) => {
      const dayKey = day.format("DD");
      counts.set(dayKey, { work: 0, fixedOff: 0, requestedOff: 0 });
    });

    staffIds.forEach((staffId) => {
      const staffMap = shiftDataMap.get(staffId);
      if (!staffMap) return;
      days.forEach((day) => {
        const dayKey = day.format("DD");
        const cell = staffMap.get(dayKey);
        if (!cell) return;
        const count = counts.get(dayKey);
        if (!count) return;
        if (cell.state === "work") count.work += 1;
        else if (cell.state === "fixedOff") count.fixedOff += 1;
        else if (cell.state === "requestedOff") count.requestedOff += 1;
      });
    });

    return counts;
  }, [days, staffIds, shiftDataMap]);

  const calculateDailyCount = useCallback(
    (
      dayKey: string,
    ): { work: number; fixedOff: number; requestedOff: number } =>
      dailyCountsByKey.get(dayKey) ?? { work: 0, fixedOff: 0, requestedOff: 0 },
    [dailyCountsByKey],
  );

  const progress = useMemo(() => {
    let confirmedCount = 0;
    let needsAdjustmentCount = 0;
    let emptyCount = 0;

    days.forEach((day) => {
      const dayKey = day.format("DD");
      const count = dailyCountsByKey.get(dayKey);
      const workCount = count?.work ?? 0;

      if (day.date() <= 10) {
        confirmedCount++;
      } else if (workCount < 2) {
        needsAdjustmentCount++;
      } else if (workCount === 0) {
        emptyCount++;
      }
    });

    const totalDays = days.length;
    const confirmedPercent = (confirmedCount / totalDays) * 100;
    const adjustmentPercent = (needsAdjustmentCount / totalDays) * 100;

    return {
      confirmedCount,
      confirmedPercent,
      needsAdjustmentCount,
      adjustmentPercent,
      emptyCount,
    };
  }, [days, dailyCountsByKey]);

  return { calculateDailyCount, progress };
}

const useCollaborativePageState = (targetMonth: string) => {
  const {
    state,
    updateShift,
    batchUpdateShifts,
    isBatchUpdating,
    startEditingCell,
    isCellBeingEdited,
    getCellEditor,
    triggerSync,
    updateUserActivity,
    canUndo,
    canRedo,
    undo,
    redo,
    getLastUndo,
    getLastRedo,
    undoHistory,
    redoHistory,
    showHistory,
    toggleHistory,
    addComment,
    updateComment,
    deleteComment,
    getCommentsByCell,
    replyToComment,
    deleteCommentReply,
  } = useCollaborativeShift();

  const isAdmin = true; // TODO: 認可情報から取得する

  const currentMonth = useMemo(() => dayjs(targetMonth), [targetMonth]);

  // イベントカレンダーを取得
  const { data: registeredEventCalendars = [] } = useGetEventCalendarsQuery();

  // 祝祭日カレンダーを取得
  const { data: holidays = [] } = useGetHolidayCalendarsQuery();

  // 会社休日カレンダーを取得
  const { data: companyHolidays = [] } = useGetCompanyHolidayCalendarsQuery();

  const { days, dateKeys, eventCalendar } = useShiftCalendar(
    currentMonth,
    registeredEventCalendars,
    holidays,
    companyHolidays,
  );

  // シフト計画データを取得
  const [shiftPlanCapacities, setShiftPlanCapacities] = useState<number[]>([]);

  useEffect(() => {
    const fetchShiftPlan = async () => {
      try {
        const result = (await graphqlClient.graphql({
          query: shiftPlanYearByTargetYear,
          variables: { targetYear: currentMonth.year(), limit: 1 },
          authMode: "userPool",
        })) as GraphQLResult<ShiftPlanYearByTargetYearQuery>;

        if (result.errors?.length) {
          throw new Error(
            result.errors.map((error) => error.message).join(","),
          );
        }

        const shiftPlanYear =
          result.data?.shiftPlanYearByTargetYear?.items?.find(
            (item): item is NonNullable<typeof item> => item !== null,
          ) ?? null;
        const monthPlan = shiftPlanYear?.plans?.find(
          (plan) => plan?.month === currentMonth.month() + 1,
        );

        if (monthPlan?.dailyCapacities) {
          setShiftPlanCapacities(
            monthPlan.dailyCapacities.map((capacity) => capacity ?? Number.NaN),
          );
        } else {
          setShiftPlanCapacities([]);
        }
      } catch (error) {
        console.error("Failed to fetch shift plan:", error);
        setShiftPlanCapacities([]);
      }
    };

    void fetchShiftPlan();
  }, [currentMonth]);

  // スタッフリストを取得（shiftDataMapから）
  const staffIds = useMemo(
    () => Array.from(state.shiftDataMap.keys()),
    [state.shiftDataMap],
  );

  // キーボードショートカット用の状態
  const [showHelp, setShowHelp] = useState(false);

  // フォーカス管理と複数選択
  const {
    focusedCell,
    registerCell,
    focusCell,
    navigate,
    clearFocus,
    selectedCells,
    selectionCount,
    isCellSelected,
    selectCell,
    toggleCell,
    selectRange,
    startDragSelect,
    updateDragSelect,
    endDragSelect,
    selectAll,
    clearSelection,
    isDragging,
  } = useSelectionState(staffIds, dateKeys);

  // シフト状態取得ヘルパー
  const getShiftState = useCallback(
    (staffId: string, date: string): ShiftState | undefined => {
      return state.shiftDataMap.get(staffId)?.get(date)?.state;
    },
    [state.shiftDataMap],
  );

  const getEventsForDay = useCallback(
    (day: dayjs.Dayjs) =>
      eventCalendar.filter((event) => {
        const end = event.end ?? event.start;
        return (
          day.isSame(event.start, "day") ||
          day.isSame(end, "day") ||
          (day.isAfter(event.start, "day") && day.isBefore(end, "day"))
        );
      }),
    [eventCalendar],
  );

  const getCellData = useCallback(
    (staffId: string, date: string) => {
      return state.shiftDataMap.get(staffId)?.get(date);
    },
    [state.shiftDataMap],
  );

  const isCellLocked = useCallback(
    (staffId: string, date: string) => {
      return getCellData(staffId, date)?.isLocked ?? false;
    },
    [getCellData],
  );

  // クリップボード管理
  const { copy, paste, hasClipboard, clearClipboard } = useClipboardOps(
    staffIds,
    dateKeys,
    getShiftState,
  );

  // シフト提案機能
  const { violations, isAnalyzing, analyzeShifts } = useShiftSuggestions({
    shiftDataMap: state.shiftDataMap,
    staffIds,
    dateKeys,
    enabled: true,
    shiftPlanCapacities,
    days,
  });

  /**
   * セルの状態を変更
   */
  const changeCellState = useCallback(
    (staffId: string, date: string, newState: ShiftState) => {
      if (isCellLocked(staffId, date)) {
        return;
      }

      if (isCellBeingEdited(staffId, date)) {
        return;
      }

      updateUserActivity();
      void updateShift({ staffId, date, newState });
    },
    [isCellBeingEdited, updateUserActivity, updateShift, isCellLocked],
  );

  /**
   * フォーカス中のセルまたは選択中のセルの状態を変更
   */
  const handleChangeState = useCallback(
    (newState: ShiftState) => {
      if (selectionCount > 0) {
        const updates = selectedCells.map(({ staffId, date }) => ({
          staffId,
          date,
          newState,
        }));
        void batchUpdateShifts(updates);
        return;
      }

      if (focusedCell) {
        changeCellState(focusedCell.staffId, focusedCell.date, newState);
      }
    },
    [
      focusedCell,
      selectedCells,
      selectionCount,
      batchUpdateShifts,
      changeCellState,
    ],
  );

  const applyLockState = useCallback(
    (locked: boolean) => {
      if (!locked && !isAdmin) {
        return;
      }

      const targets =
        selectionCount > 0
          ? Array.from(selectedCells)
          : focusedCell
            ? [focusedCell]
            : [];

      // ロック状態を変更するセルのみを抽出
      const updates = targets
        .map(({ staffId, date }) => {
          const cell = getCellData(staffId, date);
          if (!cell || cell.isLocked === locked) return null;
          return { staffId, date, isLocked: locked };
        })
        .filter(
          (
            update,
          ): update is { staffId: string; date: string; isLocked: boolean } =>
            update !== null,
        );

      if (updates.length === 0) return;

      // バッチ更新で一括ロック
      void batchUpdateShifts(updates);
    },
    [
      selectionCount,
      selectedCells,
      focusedCell,
      getCellData,
      isAdmin,
      batchUpdateShifts,
    ],
  );

  /**
   * コピー処理
   */
  const handleCopy = useCallback(() => {
    if (selectionCount > 0) {
      copy(selectedCells);
    }
  }, [selectionCount, selectedCells, copy]);

  const handleLockCells = useCallback(() => {
    applyLockState(true);
  }, [applyLockState]);

  const handleUnlockCells = useCallback(() => {
    applyLockState(false);
  }, [applyLockState]);

  const selectionTargets = useMemo(() => {
    if (selectionCount > 0) return Array.from(selectedCells);
    if (focusedCell) return [focusedCell];
    return [];
  }, [selectionCount, selectedCells, focusedCell]);

  const hasLocked = useMemo(
    () =>
      selectionTargets.some((t) => getCellData(t.staffId, t.date)?.isLocked),
    [selectionTargets, getCellData],
  );

  const hasUnlocked = useMemo(
    () =>
      selectionTargets.some((t) => !getCellData(t.staffId, t.date)?.isLocked),
    [selectionTargets, getCellData],
  );

  /**
   * ペースト処理
   */
  const handlePaste = useCallback(() => {
    if (!focusedCell) return;

    const updates = paste(focusedCell);
    updates.forEach(({ staffId, date, newState }) => {
      changeCellState(staffId, date, newState);
    });
  }, [focusedCell, paste, changeCellState]);

  /**
   * 全セルを選択
   */
  const handleSelectAll = useCallback(() => {
    selectAll();
  }, [selectAll]);

  /**
   * 選択解除・モーダルクローズ
   */
  const handleEscape = useCallback(() => {
    if (showHelp) {
      setShowHelp(false);
    } else {
      clearSelection();
      clearFocus();
      clearClipboard();
    }
  }, [showHelp, clearSelection, clearFocus, clearClipboard]);

  /**
   * 提案アクションを適用
   */
  const handleApplySuggestion = useCallback(
    (action: SuggestedAction) => {
      action.changes.forEach(({ staffId, date, newState }) => {
        changeCellState(staffId, date, newState);
      });
    },
    [changeCellState],
  );

  // キーボードショートカットの設定
  useKeyboardShortcuts({
    enabled: true,
    onNavigate: navigate,
    onChangeState: handleChangeState,
    onSelectAll: handleSelectAll,
    onShowHelp: () => setShowHelp(true),
    onEscape: handleEscape,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onUndo: undo,
    onRedo: redo,
  });

  /**
   * セルクリックハンドラー
   */
  const handleCellClick = useCallback(
    (staffId: string, date: string, event: MouseEvent) => {
      // バッチ更新中は操作不可
      if (isBatchUpdating) {
        return;
      }

      if (isCellBeingEdited(staffId, date)) {
        return; // 他のユーザーが編集中
      }

      updateUserActivity();

      // Shift+クリック: 範囲選択
      if (event.shiftKey) {
        selectRange(staffId, date);
        return;
      }

      // Ctrl/Cmd+クリック: 個別追加選択
      if (event.ctrlKey || event.metaKey) {
        toggleCell(staffId, date);
        focusCell(staffId, date);
        return;
      }

      // 通常クリック: 単一選択して編集開始
      selectCell(staffId, date);
      focusCell(staffId, date);
      startEditingCell(staffId, date);
    },
    [
      isBatchUpdating,
      isCellBeingEdited,
      updateUserActivity,
      selectRange,
      toggleCell,
      focusCell,
      selectCell,
      startEditingCell,
    ],
  );

  /**
   * セルのマウスダウン（ドラッグ選択開始）
   */
  const handleCellMouseDown = useCallback(
    (staffId: string, date: string, event: MouseEvent) => {
      // バッチ更新中は操作不可
      if (isBatchUpdating) {
        return;
      }

      // 修飾キーがある場合はドラッグ選択しない
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }

      startDragSelect(staffId, date);
    },
    [isBatchUpdating, startDragSelect],
  );

  /**
   * セルのマウスエンター（ドラッグ選択更新）
   */
  const handleCellMouseEnter = useCallback(
    (staffId: string, date: string) => {
      if (isDragging) {
        updateDragSelect(staffId, date);
      }
    },
    [isDragging, updateDragSelect],
  );

  /**
   * マウスアップ（ドラッグ選択終了）
   */
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      endDragSelect();
    }
  }, [isDragging, endDragSelect]);

  /**
   * 手動同期
   */
  const handleSync = async () => {
    await triggerSync();
  };

  const { calculateDailyCount, progress } = useShiftMetrics(
    days,
    staffIds,
    state.shiftDataMap,
  );

  return {
    state,
    isAdmin,
    currentMonth,
    days,
    staffIds,
    focusedCell,
    isCellSelected,
    registerCell,
    handleCellClick,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMouseUp,
    handleSync,
    progress,
    calculateDailyCount,
    getEventsForDay,
    selectionCount,
    hasLocked,
    hasUnlocked,
    hasClipboard,
    handleCopy,
    handlePaste,
    clearSelection,
    handleChangeState,
    handleLockCells,
    handleUnlockCells,
    handleApplySuggestion,
    violations,
    isAnalyzing,
    analyzeShifts,
    showHelp,
    setShowHelp,
    getCellEditor,
    isCellBeingEdited,
    isBatchUpdating,
    canUndo,
    canRedo,
    undo,
    redo,
    getLastUndo,
    getLastRedo,
    undoHistory,
    redoHistory,
    showHistory,
    toggleHistory,
    addComment,
    updateComment,
    deleteComment,
    getCommentsByCell,
    replyToComment,
    deleteCommentReply,
  };
};

type CollaborativeHeaderProps = {
  currentMonth: dayjs.Dayjs;
  activeUsers: ActiveUser[];
  editingCells: Map<
    string,
    { userId: string; userName: string; startTime: number }
  >;
};

const CollaborativeHeaderBase: FC<CollaborativeHeaderProps> = ({
  currentMonth,
  activeUsers,
  editingCells,
}) => (
  <Stack direction="row" alignItems="center" spacing={2} mb={3}>
    <Typography variant="h4">シフト調整(共同)</Typography>
    <Chip
      label={currentMonth.format("YYYY年 M月")}
      color="primary"
      variant="outlined"
    />

    <Box sx={{ flex: 1 }} />
    <ActiveUsersList
      activeUsers={activeUsers}
      editingCells={editingCells}
      compact={false}
    />
  </Stack>
);

const CollaborativeHeader = memo(CollaborativeHeaderBase);

CollaborativeHeaderBase.propTypes = {
  currentMonth: PropTypes.object.isRequired,
  activeUsers: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string.isRequired,
      userName: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      lastActivity: PropTypes.number.isRequired,
    }).isRequired,
  ).isRequired,
  editingCells: PropTypes.instanceOf(Map).isRequired,
};

type ProgressPanelProps = {
  progress: {
    confirmedCount: number;
    confirmedPercent: number;
    needsAdjustmentCount: number;
  };
  totalDays: number;
};

const ProgressPanelBase: FC<ProgressPanelProps> = ({ progress, totalDays }) => (
  <Paper sx={{ p: 2, mb: 3 }}>
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          調整状況
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress.confirmedPercent}
          sx={{ height: 8, borderRadius: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          確定: {progress.confirmedCount} / {totalDays}日 (
          {progress.confirmedPercent.toFixed(0)}%)
        </Typography>
      </Box>

      {progress.needsAdjustmentCount > 0 && (
        <Alert severity="warning" icon={<InfoIcon />}>
          調整が必要な日: {progress.needsAdjustmentCount}日
        </Alert>
      )}
    </Stack>
  </Paper>
);

const ProgressPanel = memo(ProgressPanelBase);

ProgressPanelBase.propTypes = {
  progress: PropTypes.shape({
    confirmedCount: PropTypes.number.isRequired,
    confirmedPercent: PropTypes.number.isRequired,
    needsAdjustmentCount: PropTypes.number.isRequired,
  }).isRequired,
  totalDays: PropTypes.number.isRequired,
};

// 週末判定ヘルパー
const isWeekend = (day: dayjs.Dayjs): boolean =>
  day.day() === 0 || day.day() === 6;

interface ShiftCollaborativePageInnerProps {
  staffs: ReturnType<typeof useStaffs>["staffs"];
  targetMonth: string;
}

/**
 * メインコンポーネント（内部実装）
 */
const ShiftCollaborativePageInner = memo<ShiftCollaborativePageInnerProps>(
  ({ staffs, targetMonth }: ShiftCollaborativePageInnerProps) => {
    const {
      state,
      isCellBeingEdited,
      getCellEditor,
      focusedCell,
      isCellSelected,
      registerCell,
      handleCellClick,
      handleCellMouseDown,
      handleCellMouseEnter,
      handleMouseUp,
      handleSync: _handleSync,
      progress,
      calculateDailyCount,
      getEventsForDay,
      selectionCount,
      hasLocked,
      hasUnlocked,
      hasClipboard,
      handleCopy,
      handlePaste,
      clearSelection,
      handleChangeState,
      handleLockCells,
      handleUnlockCells,
      handleApplySuggestion,
      violations,
      isAnalyzing,
      analyzeShifts,
      showHelp,
      setShowHelp,
      isAdmin,
      currentMonth,
      days,
      staffIds,
      canUndo,
      canRedo,
      undo,
      redo,
      getLastUndo,
      getLastRedo,
      undoHistory,
      redoHistory,
      showHistory,
      toggleHistory,
      isBatchUpdating,
      addComment,
      getCommentsByCell,
    } = useCollaborativePageState(targetMonth);

    // プレゼンス通知
    const { notifications, dismissNotification } = usePresenceNotifications();

    // 印刷機能
    const { isPrintDialogOpen, openPrintDialog, closePrintDialog } =
      usePrintShift();

    const staffNameMap = useMemo(
      () =>
        new Map(
          staffs.map((staff) => [
            staff.id,
            `${staff.familyName || ""}${staff.givenName || ""}`.trim() ||
              staff.id,
          ]),
        ),
      [staffs],
    );

    // コンフリクト解決ダイアログ状態
    const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

    // 複数セルへのコメント一括追加ハンドラー
    const handleAddCommentsToSelectedCells = useCallback(
      async (content: string) => {
        // 選択されているセルがある場合は、最初の10セルまでコメント追加
        const cellCount = Math.min(selectionCount, 10);
        let addedCount = 0;

        // state.shiftDataMap から選択されているセルを取得
        const staffIds = Array.from(state.shiftDataMap.keys());
        for (const staffId of staffIds) {
          if (addedCount >= cellCount) break;

          const staffData = state.shiftDataMap.get(staffId);
          if (!staffData) continue;

          for (const dateKey of staffData.keys()) {
            if (addedCount >= cellCount) break;

            if (isCellSelected(staffId, dateKey)) {
              try {
                const cellKey = `${staffId}#${dateKey}`;
                await addComment(cellKey, content, []);
                addedCount++;
              } catch (error) {
                console.error("Failed to add comment:", error);
              }
            }
          }
        }
      },
      [state.shiftDataMap, isCellSelected, addComment, selectionCount],
    );

    // コメント機能付きのShiftCellコンポーネント
    const ShiftCellWithComments = useMemo(() => {
      const ShiftCellWithCommentsComponent = ({
        staffId,
        date,
        ...restProps
      }: ShiftCellProps) => {
        return <ShiftCell {...restProps} staffId={staffId} date={date} />;
      };
      Object.defineProperty(ShiftCellWithCommentsComponent, "displayName", {
        value: "ShiftCellWithComments",
      });
      return ShiftCellWithCommentsComponent;
    }, []) as React.FC<ShiftCellProps>;

    return (
      <Page title="シフト調整(共同)">
        <Container maxWidth={false} sx={{ py: 3 }} onMouseUp={handleMouseUp}>
          <CollaborativeHeader
            currentMonth={currentMonth}
            activeUsers={state.activeUsers}
            editingCells={state.editingCells}
          />

          {/* 取り消し/やり直し/変更履歴ツールバー */}
          <UndoRedoToolbar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            lastUndoDescription={getLastUndo()?.description}
            lastRedoDescription={getLastRedo()?.description}
            showHistory={showHistory}
            onToggleHistory={toggleHistory}
            onShowHelp={() => setShowHelp(true)}
            onPrint={openPrintDialog}
          />

          {/* 変更履歴ダイアログ */}
          <ChangeHistoryPanel
            undoHistory={undoHistory}
            redoHistory={redoHistory}
            staffNameMap={staffNameMap}
            open={showHistory}
            onClose={toggleHistory}
          />

          {/* シフト提案パネル */}
          <ShiftSuggestionsPanel
            violations={violations}
            isAnalyzing={isAnalyzing}
            onApplyAction={handleApplySuggestion}
            onRefresh={analyzeShifts}
          />

          {/* 進捗パネル */}
          <ProgressPanel progress={progress} totalDays={days.length} />

          {/* シフト調整テーブル */}
          <VirtualizedShiftTable
            days={days}
            staffIds={staffIds}
            shiftDataMap={state.shiftDataMap}
            isLoading={state.isLoading}
            staffs={staffs.map((staff) => ({
              id: staff.id,
              familyName: staff.familyName ?? undefined,
              givenName: staff.givenName ?? undefined,
            }))}
            focusedCell={focusedCell}
            isCellSelected={isCellSelected}
            isCellBeingEdited={isCellBeingEdited}
            getCellEditor={getCellEditor}
            onCellClick={handleCellClick}
            onCellRegisterRef={registerCell}
            onCellMouseDown={handleCellMouseDown}
            onCellMouseEnter={handleCellMouseEnter}
            calculateDailyCount={(day) => calculateDailyCount(day.format("DD"))}
            getEventsForDay={getEventsForDay}
            ShiftCellComponent={ShiftCellWithComments}
            isWeekend={isWeekend}
          />

          <BatchEditToolbar
            selectionCount={selectionCount}
            selectedCells={
              focusedCell
                ? [{ staffId: focusedCell.staffId, date: focusedCell.date }]
                : []
            }
            comments={
              focusedCell
                ? getCommentsByCell(
                    `${focusedCell.staffId}#${focusedCell.date}`,
                  )
                : []
            }
            onCopy={handleCopy}
            onPaste={handlePaste}
            onClear={clearSelection}
            onChangeState={handleChangeState}
            onLock={handleLockCells}
            onUnlock={handleUnlockCells}
            onAddComments={handleAddCommentsToSelectedCells}
            canUnlock={isAdmin}
            showLock={hasUnlocked}
            showUnlock={hasLocked}
            hasClipboard={hasClipboard}
            canPaste={focusedCell !== null}
            isUpdating={isBatchUpdating}
          />

          {/* コンフリクト解決ダイアログ */}
          <ConflictResolutionDialog
            open={conflictDialogOpen}
            conflicts={[]}
            onResolve={async () => {
              // コンフリクト解決処理
            }}
            onClose={() => setConflictDialogOpen(false)}
          />

          {/* ヘルプダイアログ */}
          <KeyboardShortcutsHelp
            open={showHelp}
            onClose={() => setShowHelp(false)}
          />

          {/* 印刷ダイアログ */}
          <PrintShiftDialog
            open={isPrintDialogOpen}
            onClose={closePrintDialog}
            days={days}
            staffs={staffs
              .filter(
                (staff) =>
                  staff.enabled &&
                  (staff as unknown as Record<string, unknown>).workType ===
                    "shift",
              )
              .map((staff) => ({
                id: staff.id,
                familyName: staff.familyName ?? undefined,
                givenName: staff.givenName ?? undefined,
              }))}
            shiftDataMap={state.shiftDataMap}
            targetMonth={targetMonth}
          />

          {/* プレゼンス通知 */}
          <PresenceNotificationContainer
            notifications={notifications}
            onDismiss={dismissNotification}
          />
        </Container>
      </Page>
    );
  },
);

ShiftCollaborativePageInner.displayName = "ShiftCollaborativePageInner";

/**
 * エクスポート用コンポーネント（Providerでラップ）
 */
export default function ShiftCollaborativePage() {
  const { authStatus, cognitoUser } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs, loading: staffsLoading } = useStaffs({ isAuthenticated });

  const targetMonth = dayjs().format("YYYY-MM");

  // 認証ユーザーのスタッフIDを取得
  const currentUserId = useMemo(() => {
    if (!cognitoUser?.id) return "";
    const currentStaff = staffs.find(
      (staff) => staff.cognitoUserId === cognitoUser.id,
    );
    return currentStaff?.id ?? "";
  }, [cognitoUser, staffs]);

  // 認証ユーザーの名前を取得
  const currentUserName = useMemo(() => {
    if (!cognitoUser?.id) return "Current User";
    const currentStaff = staffs.find(
      (staff) => staff.cognitoUserId === cognitoUser.id,
    );
    return currentStaff
      ? `${currentStaff.familyName || ""}${currentStaff.givenName || ""}`
      : "Current User";
  }, [cognitoUser, staffs]);

  // シフト勤務で有効なスタッフのみを取得
  const staffIds = useMemo(
    () =>
      staffs
        .filter(
          (staff) =>
            staff.enabled &&
            (staff as unknown as Record<string, unknown>).workType === "shift",
        )
        .map((staff) => staff.id),
    [staffs],
  );

  // 最初のシフトリクエストIDを使用（実装を簡略化）
  const shiftRequestId = staffIds[0] ?? "";

  if (staffsLoading) {
    return <LinearProgress />;
  }

  if (staffIds.length === 0) {
    return (
      <Page title="シフト調整(共同)">
        <Container maxWidth={false} sx={{ py: 3 }}>
          <Alert severity="info">スタッフデータが見つかりません</Alert>
        </Container>
      </Page>
    );
  }

  return (
    <CollaborativeShiftProvider
      staffIds={staffIds}
      targetMonth={targetMonth}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      shiftRequestId={shiftRequestId}
    >
      <ShiftCollaborativePageInner staffs={staffs} targetMonth={targetMonth} />
    </CollaborativeShiftProvider>
  );
}
