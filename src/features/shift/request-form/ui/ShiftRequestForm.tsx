import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import dayjs, { Dayjs } from "dayjs";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";

import * as MESSAGE_CODE from "@/errors";
import { useAutoSave } from "@/hooks/useAutoSave";
import useCognitoUser from "@/hooks/useCognitoUser";
import { PANEL_HEIGHTS } from "@/shared/config/uiDimensions";
import {
  loadShiftPatterns,
  saveShiftPatterns,
} from "@/shared/lib/storage/shiftPatternStorage";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";

import { normalizeStatus, ShiftRequestDayStatus } from "../model/statusMapping";
import { useShiftRequestData } from "../model/useShiftRequestData";
import { useShiftRequestPersist } from "../model/useShiftRequestPersist";

type Status = ShiftRequestDayStatus;

export default function ShiftRequestForm() {
  const dispatch = useDispatch();
  const { cognitoUser, loading: cognitoUserLoading } = useCognitoUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf("month"));
  const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
  const statusLabelMap: Record<Status, string> = {
    work: "出勤",
    fixedOff: "固定休",
    requestedOff: "希望休",
    auto: "おまかせ",
  };
  const statusMobileLabelMap: Partial<Record<Status, string>> = {
    work: "出",
    fixedOff: "固",
    requestedOff: "希",
  };
  const statusColorMap: Record<
    Status,
    | "inherit"
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "info"
    | "warning"
  > = {
    work: "success",
    fixedOff: "error",
    requestedOff: "warning",
    auto: "info",
  };
  const statusBackgroundMap = useMemo(
    () => ({
      work: alpha(theme.palette.success.main, 0.25),
      fixedOff: alpha(theme.palette.error.main, 0.23),
      requestedOff: alpha(theme.palette.warning.main, 0.3),
      auto: alpha(theme.palette.info.main, 0.18),
    }),
    [theme]
  );
  const [focusedDateKey, setFocusedDateKey] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const dayDetailRef = useRef<HTMLDivElement | null>(null);
  // patterns
  type Pattern = {
    id: string;
    name: string;
    mapping: Record<number, Status>; // weekday (0=Sun) -> status
  };
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [patternDialogOpen, setPatternDialogOpen] = useState(false);
  const [newPatternDialogOpen, setNewPatternDialogOpen] = useState(false);
  const [newPatternName, setNewPatternName] = useState("");
  const [newPatternMapping, setNewPatternMapping] = useState<
    Record<number, Status>
  >(() => ({
    0: "fixedOff",
    1: "work",
    2: "work",
    3: "work",
    4: "work",
    5: "work",
    6: "fixedOff",
  }));

  const monthStart = useMemo(
    () => currentMonth.startOf("month"),
    [currentMonth]
  );
  const daysInMonth = monthStart.daysInMonth();

  const days = useMemo(
    () =>
      Array.from({ length: daysInMonth }).map((_, i) =>
        monthStart.add(i, "day")
      ),
    [monthStart.year(), monthStart.month(), daysInMonth]
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

  // 日付クリックのサイクルは今回のテーブル版では使わないため削除

  const dayKeyList = useMemo(
    () => days.map((d) => d.format("YYYY-MM-DD")),
    [days]
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

  // 初期データロード完了を追跡
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  useEffect(() => {
    // ロード中でなく、かつスタッフ情報がある場合は初期ロード完了とみなす
    if (!isLoadingStaff && !isLoadingShiftRequest && staff) {
      // 少し遅延を入れてから自動保存を有効にする（初期データ設定を確実に完了させるため）
      const timer = setTimeout(() => {
        setIsInitialLoadComplete(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoadingStaff, isLoadingShiftRequest, staff]);

  // 自動保存機能: selectedDates の変更を監視して自動的に保存する
  const {
    isSaving: isAutoSaving,
    isPending: isAutoSavePending,
    lastSavedAt,
    lastChangedAt,
  } = useAutoSave({
    saveFn: async () => {
      if (!staff || isLoadingStaff || isLoadingShiftRequest) return;
      // summary を saveFn 内で計算
      const currentSummary = {
        workDays: Object.values(selectedDates).filter(
          (v) => v.status === "work"
        ).length,
        fixedOffDays: Object.values(selectedDates).filter(
          (v) => v.status === "fixedOff"
        ).length,
        requestedOffDays: Object.values(selectedDates).filter(
          (v) => v.status === "requestedOff"
        ).length,
      };
      await saveShiftRequest(currentSummary);
    },
    data: selectedDates,
    enabled:
      isInitialLoadComplete &&
      !!staff &&
      !isLoadingStaff &&
      !isLoadingShiftRequest,
    delay: 2000, // 2秒のdebounce
    onSaveSuccess: () => {
      dispatch(setSnackbarSuccess("シフトを自動保存しました"));
    },
    onSaveError: (error) => {
      console.error("Auto-save error:", error);
      dispatch(setSnackbarError("シフトの自動保存に失敗しました"));
    },
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectionAnchorKey, setSelectionAnchorKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    const dayKeySet = new Set(dayKeyList);
    setSelectedRowKeys((prev) => prev.filter((key) => dayKeySet.has(key)));
  }, [dayKeyList]);

  useEffect(() => {
    if (selectionAnchorKey && !dayKeyList.includes(selectionAnchorKey)) {
      setSelectionAnchorKey(null);
    }
  }, [dayKeyList, selectionAnchorKey]);

  useEffect(() => {
    setSelectionAnchorKey(null);
  }, [isSelectionMode]);

  const clearRowSelection = useCallback(() => {
    setSelectedRowKeys([]);
    setSelectionAnchorKey(null);
  }, []);

  const isAllRowsSelected =
    selectedRowKeys.length === dayKeyList.length && dayKeyList.length > 0;

  const toggleAllRowsSelection = () => {
    if (isAllRowsSelected) {
      clearRowSelection();
    } else {
      setSelectedRowKeys([...dayKeyList]);
      setSelectionAnchorKey(dayKeyList[0] ?? null);
    }
  };

  const extendSelectionRange = useCallback(
    (anchorKey: string, targetKey: string) => {
      const startIndex = dayKeyList.indexOf(anchorKey);
      const endIndex = dayKeyList.indexOf(targetKey);
      if (startIndex === -1 || endIndex === -1) return;
      const [from, to] =
        startIndex <= endIndex
          ? [startIndex, endIndex]
          : [endIndex, startIndex];
      const rangeKeys = dayKeyList.slice(from, to + 1);
      setSelectedRowKeys((prev) => {
        const merged = new Set(prev);
        rangeKeys.forEach((rangeKey) => merged.add(rangeKey));
        return Array.from(merged);
      });
    },
    [dayKeyList]
  );

  const applyStatusToSelection = (status: Status) => {
    if (selectedRowKeys.length === 0) return;
    setSelectedDates((prev) => {
      const next = { ...prev };
      selectedRowKeys.forEach((key) => {
        next[key] = { status };
      });
      return next;
    });
  };

  const setStatusForDate = (key: string, status: Status) => {
    setFocusedDateKey(key);
    setSelectedDates((prev) => ({
      ...prev,
      [key]: { status },
    }));
  };

  const clearDateSelection = (key: string) => {
    setFocusedDateKey(key);
    setSelectedDates((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const scrollToDayDetail = useCallback(() => {
    if (!isMobile) return;
    if (dayDetailRef.current) {
      dayDetailRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isMobile]);

  const handleCalendarDayClick = useCallback(
    (dayValue: Dayjs, event?: React.MouseEvent<HTMLDivElement>) => {
      if (!dayValue.isSame(monthStart, "month")) return;
      const key = dayValue.format("YYYY-MM-DD");
      if (isSelectionMode) {
        if (!isMobile && event?.shiftKey && selectionAnchorKey) {
          extendSelectionRange(selectionAnchorKey, key);
        } else {
          setSelectedRowKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
          );
        }
        setSelectionAnchorKey(key);
        return;
      }
      setFocusedDateKey(key);
    },
    [
      extendSelectionRange,
      isMobile,
      isSelectionMode,
      monthStart,
      selectionAnchorKey,
    ]
  );

  const handleWeekdayLabelClick = useCallback(
    (weekdayIndex: number) => {
      if (isMobile || !isSelectionMode) return;
      const columnKeys = days
        .filter((day) => day.day() === weekdayIndex)
        .map((day) => day.format("YYYY-MM-DD"));
      if (columnKeys.length === 0) return;

      let nextAnchor: string | null = selectionAnchorKey;
      setSelectedRowKeys((prev) => {
        const prevSet = new Set(prev);
        const isColumnAlreadySelected = columnKeys.every((key) =>
          prevSet.has(key)
        );

        if (isColumnAlreadySelected) {
          columnKeys.forEach((key) => prevSet.delete(key));
          if (selectionAnchorKey && columnKeys.includes(selectionAnchorKey)) {
            nextAnchor = null;
          }
        } else {
          columnKeys.forEach((key) => prevSet.add(key));
          nextAnchor = columnKeys[0] ?? null;
        }

        return dayKeyList.filter((key) => prevSet.has(key));
      });
      setSelectionAnchorKey(nextAnchor ?? null);
    },
    [dayKeyList, days, isMobile, isSelectionMode, selectionAnchorKey]
  );

  useEffect(() => {
    if (focusedDateKey && !dayKeyList.includes(focusedDateKey)) {
      setFocusedDateKey(null);
    }
  }, [dayKeyList, focusedDateKey]);

  useEffect(() => {
    if (!focusedDateKey) return;
    scrollToDayDetail();
  }, [focusedDateKey, scrollToDayDetail]);

  useEffect(() => {
    if (isSelectionMode) {
      setFocusedDateKey(null);
    }
  }, [isSelectionMode]);

  useEffect(() => {
    if (cognitoUserLoading) {
      return;
    }
    if (!cognitoUser) {
      setPatterns([]);
      setPatternsLoading(false);
      return;
    }

    setPatternsLoading(true);
    let isMounted = true;
    const fetchPatterns = async () => {
      try {
        const stored = await loadShiftPatterns();
        if (!isMounted) return;
        setPatterns(
          stored.map((pattern) => ({
            id: pattern.id,
            name: pattern.name,
            mapping: Object.fromEntries(
              Object.entries(pattern.mapping).map(([weekday, status]) => [
                Number(weekday),
                normalizeStatus(status),
              ])
            ) as Record<number, Status>,
          }))
        );
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load shift patterns", error);
          setPatterns([]);
          dispatch(setSnackbarError(MESSAGE_CODE.E00001));
        }
      } finally {
        if (isMounted) {
          setPatternsLoading(false);
        }
      }
    };

    void fetchPatterns();

    return () => {
      isMounted = false;
    };
  }, [cognitoUser, cognitoUserLoading, dispatch]);

  const serializePatterns = useCallback(
    (patternList: Pattern[]) =>
      patternList.map((pattern) => ({
        id: pattern.id,
        name: pattern.name,
        mapping: Object.fromEntries(
          Object.entries(pattern.mapping).map(([weekday, status]) => [
            String(weekday),
            status,
          ])
        ),
      })),
    []
  );

  const persistPatterns = useCallback(
    async (nextPatterns: Pattern[]) => {
      setPatterns(nextPatterns);
      if (cognitoUserLoading || !cognitoUser) {
        return;
      }
      try {
        await saveShiftPatterns(serializePatterns(nextPatterns));
      } catch (error) {
        console.error("Failed to save shift patterns", error);
        dispatch(setSnackbarError(MESSAGE_CODE.E00001));
      }
    },
    [cognitoUser, cognitoUserLoading, dispatch, serializePatterns]
  );

  const applyPattern = (pattern: Pattern) => {
    const next: Record<string, { status: Status }> = {};
    days.forEach((d) => {
      const wd = d.day();
      const status = normalizeStatus(pattern.mapping[wd]);
      next[d.format("YYYY-MM-DD")] = { status };
    });
    setSelectedDates(next);
    setPatternDialogOpen(false);
  };

  const deletePattern = (id: string) => {
    void persistPatterns(patterns.filter((p) => p.id !== id));
  };

  const createPattern = (name: string, mapping: Record<number, Status>) => {
    const p: Pattern = { id: String(Date.now()), name, mapping };
    void persistPatterns([p, ...patterns]);
    setNewPatternDialogOpen(false);
    setNewPatternName("");
  };

  const prevMonth = () => setCurrentMonth((m) => m.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth((m) => m.add(1, "month"));

  // 一括で選択中の日にステータスを適用（未使用のため保持しない）

  // カウント：出勤と休み
  const workCount = useMemo(
    () =>
      Object.values(selectedDates).filter((v) => v.status === "work").length,
    [selectedDates]
  );
  const fixedOffCount = useMemo(
    () =>
      Object.values(selectedDates).filter((v) => v.status === "fixedOff")
        .length,
    [selectedDates]
  );
  const requestedOffCount = useMemo(
    () =>
      Object.values(selectedDates).filter((v) => v.status === "requestedOff")
        .length,
    [selectedDates]
  );

  const summary = useMemo(
    () => ({
      workDays: workCount,
      fixedOffDays: fixedOffCount,
      requestedOffDays: requestedOffCount,
    }),
    [fixedOffCount, requestedOffCount, workCount]
  );

  const interactionDisabled =
    !staff ||
    isLoadingStaff ||
    isLoadingShiftRequest ||
    isSaving ||
    isAutoSaving;
  const hasSelection = Object.keys(selectedDates).length > 0;
  const hasRowSelection = selectedRowKeys.length > 0;

  useEffect(() => {
    if (!isSelectionMode) return;
    if (!hasRowSelection) return;
    scrollToDayDetail();
  }, [hasRowSelection, isSelectionMode, scrollToDayDetail]);

  const getStatusBgColor = (status?: Status) =>
    status ? statusBackgroundMap[status] : undefined;

  const renderSummary = () => (
    <Typography variant="body2">
      出勤: {summary.workDays}日 / 固定休: {summary.fixedOffDays}日 / 希望休:{" "}
      {summary.requestedOffDays}日
    </Typography>
  );

  const StatusButtons = ({
    dateKey,
    selected,
  }: {
    dateKey: string;
    selected?: Status;
  }) => (
    <ButtonGroup
      size="small"
      variant="outlined"
      sx={{ flexWrap: isMobile ? "wrap" : "nowrap" }}
    >
      <Button
        variant={selected === "work" ? "contained" : "outlined"}
        color={statusColorMap.work}
        disabled={interactionDisabled}
        onClick={() => setStatusForDate(dateKey, "work")}
      >
        出勤
      </Button>
      <Button
        variant={selected === "fixedOff" ? "contained" : "outlined"}
        color={statusColorMap.fixedOff}
        disabled={interactionDisabled}
        onClick={() => setStatusForDate(dateKey, "fixedOff")}
      >
        固定休
      </Button>
      <Button
        variant={selected === "requestedOff" ? "contained" : "outlined"}
        color={statusColorMap.requestedOff}
        disabled={interactionDisabled}
        onClick={() => setStatusForDate(dateKey, "requestedOff")}
      >
        希望休
      </Button>
      <Button
        variant={selected === "auto" ? "contained" : "outlined"}
        color={statusColorMap.auto}
        disabled={interactionDisabled}
        onClick={() => setStatusForDate(dateKey, "auto")}
      >
        おまかせ
      </Button>
    </ButtonGroup>
  );

  const renderDayDetail = ({ isMobileView }: { isMobileView: boolean }) => {
    const padding = isMobileView ? 1.5 : 2;
    const actionVerb = isMobileView ? "タップ" : "クリック";

    if (isSelectionMode) {
      if (!hasRowSelection) {
        return (
          <Paper
            variant="outlined"
            sx={{ p: padding }}
            ref={isMobileView ? dayDetailRef : undefined}
          >
            <Typography variant="body2" color="text.secondary">
              カレンダー上で日付を{actionVerb}
              して選択してください。選択した日付はここで一括操作できます。
            </Typography>
          </Paper>
        );
      }

      return (
        <Paper
          variant="outlined"
          sx={{ p: padding }}
          ref={isMobileView ? dayDetailRef : undefined}
        >
          <Stack spacing={isMobileView ? 1.5 : 2}>
            <Typography variant="subtitle1">
              選択中: {selectedRowKeys.length}日
            </Typography>
            <Typography variant="body2" color="text.secondary">
              下のボタンで選択した日付へステータスを一括適用できます。
            </Typography>
            <ButtonGroup
              size="small"
              variant="outlined"
              sx={{ flexWrap: isMobileView ? "wrap" : "nowrap" }}
            >
              <Button
                color={statusColorMap.work}
                disabled={interactionDisabled}
                onClick={() => applyStatusToSelection("work")}
              >
                出勤
              </Button>
              <Button
                color={statusColorMap.fixedOff}
                disabled={interactionDisabled}
                onClick={() => applyStatusToSelection("fixedOff")}
              >
                固定休
              </Button>
              <Button
                color={statusColorMap.requestedOff}
                disabled={interactionDisabled}
                onClick={() => applyStatusToSelection("requestedOff")}
              >
                希望休
              </Button>
              <Button
                color={statusColorMap.auto}
                disabled={interactionDisabled}
                onClick={() => applyStatusToSelection("auto")}
              >
                おまかせ
              </Button>
            </ButtonGroup>
          </Stack>
        </Paper>
      );
    }

    if (!focusedDateKey) {
      return (
        <Paper
          variant="outlined"
          sx={{ p: padding }}
          ref={isMobileView ? dayDetailRef : undefined}
        >
          <Typography variant="body2" color="text.secondary">
            カレンダー上の日付を{actionVerb}してステータスを設定してください。
          </Typography>
        </Paper>
      );
    }

    const focusedDay = dayjs(focusedDateKey);
    const weekday = weekdayLabels[focusedDay.day()];
    const selected = selectedDates[focusedDateKey]?.status;

    return (
      <Paper
        variant="outlined"
        sx={{ p: padding }}
        ref={isMobileView ? dayDetailRef : undefined}
      >
        <Stack spacing={isMobileView ? 1.5 : 2}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobileView ? "flex-start" : "center",
              gap: 1,
              flexDirection: isMobileView ? "column" : "row",
            }}
          >
            <Typography variant={isMobileView ? "subtitle1" : "h6"}>
              {`${focusedDay.format("M/D")}(${weekday})`}
            </Typography>
            {selected && (
              <Button
                size="small"
                disabled={interactionDisabled}
                onClick={() => clearDateSelection(focusedDateKey)}
              >
                解除
              </Button>
            )}
          </Box>
          <StatusButtons dateKey={focusedDateKey} selected={selected} />
        </Stack>
      </Paper>
    );
  };

  const canBulkSelectByWeekday = !isMobile && isSelectionMode;

  return (
    <Container
      disableGutters={isMobile}
      sx={{ py: { xs: 2, sm: 3 }, pb: isMobile ? 10 : 3, px: { xs: 1.5, sm: 2 } }}
    >
      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Typography variant="h1">希望シフト</Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1.5, sm: 2 },
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <IconButton size="small" onClick={prevMonth} aria-label="前の月">
              <ArrowBackIcon />
            </IconButton>
            <Typography>{monthStart.format("YYYY年 M月")}</Typography>
            <IconButton size="small" onClick={nextMonth} aria-label="次の月">
              <ArrowForwardIcon />
            </IconButton>

            {/* 自動保存ステータス表示 */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}
            >
              {isAutoSaving && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CircularProgress size={14} />
                  <Typography variant="caption" color="text.secondary">
                    保存中...
                  </Typography>
                </Box>
              )}
              {isAutoSavePending && !isAutoSaving && (
                <Typography variant="caption" color="text.secondary">
                  保存待ち
                  {lastChangedAt &&
                    ` (${dayjs(lastChangedAt).format("M/D HH:mm:ss")})`}
                </Typography>
              )}
              {!isAutoSaving && !isAutoSavePending && lastSavedAt && (
                <Typography variant="caption" color="success.main">
                  最終保存: {dayjs(lastSavedAt).format("M/D HH:mm:ss")}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setPatternDialogOpen(true)}
              fullWidth={isMobile}
            >
              マイパターン
            </Button>
          </Box>
        </Box>

        {(isLoadingStaff || isLoadingShiftRequest) && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Stack spacing={1}>
                <Stack
                  direction={isMobile ? "column" : "row"}
                  alignItems={isMobile ? "flex-start" : "center"}
                  justifyContent="space-between"
                  rowGap={1}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isSelectionMode}
                        onChange={(_, checked) => setIsSelectionMode(checked)}
                        disabled={interactionDisabled}
                      />
                    }
                    label="選択モード"
                  />
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    justifyContent={isMobile ? "flex-start" : "flex-end"}
                  >
                    <Button
                      size="small"
                      disabled={interactionDisabled || !isSelectionMode}
                      onClick={toggleAllRowsSelection}
                    >
                      すべて選択
                    </Button>
                    <Button
                      size="small"
                      disabled={interactionDisabled || !isSelectionMode}
                      onClick={clearRowSelection}
                    >
                      選択解除
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  md: "minmax(0, 2fr) minmax(0, 1fr)",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  カレンダー
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gap: { xs: 0.25, sm: 0.5 },
                    textAlign: "center",
                  }}
                >
                  {weekdayLabels.map((label, idx) => (
                    <Typography
                      key={`weekday-${idx}`}
                      variant="caption"
                      role={canBulkSelectByWeekday ? "button" : undefined}
                      tabIndex={canBulkSelectByWeekday ? 0 : undefined}
                      onClick={
                        canBulkSelectByWeekday
                          ? () => handleWeekdayLabelClick(idx)
                          : undefined
                      }
                      onKeyDown={
                        canBulkSelectByWeekday
                          ? (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleWeekdayLabelClick(idx);
                              }
                            }
                          : undefined
                      }
                      sx={{
                        color: "text.secondary",
                        py: 0.5,
                        cursor: canBulkSelectByWeekday ? "pointer" : "default",
                        userSelect: "none",
                      }}
                    >
                      {label}
                    </Typography>
                  ))}
                  {calendarDays.map((dayValue) => {
                    const key = dayValue.format("YYYY-MM-DD");
                    const status = selectedDates[key]?.status;
                    const isCurrentMonthDay = dayValue.isSame(
                      monthStart,
                      "month"
                    );
                    const isFocused = focusedDateKey === key;
                    const isSelectedDate = selectedRowKeys.includes(key);
                    const statusBgColor =
                      getStatusBgColor(status) ||
                      theme.palette.background.paper;
                    const boxShadowValue = isFocused
                      ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.8)}`
                      : isSelectedDate
                      ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.5)}`
                      : undefined;
                    const borderColor = isFocused
                      ? theme.palette.primary.main
                      : isSelectedDate
                      ? alpha(theme.palette.primary.main, 0.5)
                      : "divider";
                    return (
                      <Box
                        key={`calendar-${key}`}
                        onClick={(event) =>
                          handleCalendarDayClick(dayValue, event)
                        }
                        sx={{
                          position: "relative",
                          minHeight: { xs: 42, sm: PANEL_HEIGHTS.FORM_ITEM_MIN },
                          px: { xs: 0.25, sm: 0.5 },
                          py: { xs: 0.25, sm: 0.5 },
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor,
                          bgcolor: statusBgColor,
                          boxShadow: boxShadowValue,
                          color: isCurrentMonthDay
                            ? "text.primary"
                            : "text.disabled",
                          cursor: isCurrentMonthDay ? "pointer" : "default",
                          opacity: isCurrentMonthDay ? 1 : 0.4,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.25,
                        }}
                      >
                        <Typography variant={isTablet ? "body2" : "subtitle2"}>
                          {dayValue.date()}
                        </Typography>
                        {status && (
                          <Typography variant="caption" sx={{ fontSize: 10 }}>
                            {isMobile
                              ? statusMobileLabelMap[status] ??
                                statusLabelMap[status]
                              : statusLabelMap[status]}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
                <Box sx={{ mt: 1 }}>{renderSummary()}</Box>
              </Box>
              <Box>{renderDayDetail({ isMobileView: isMobile })}</Box>
            </Box>
          </Stack>
        </Box>

        <Box
          component="form"
          sx={{ mt: 3 }}
          onSubmit={(e) => e.preventDefault()}
        >
          <Stack spacing={2} alignItems="stretch">
            <TextField
              label="備考"
              multiline
              rows={2}
              value={note}
              disabled={interactionDisabled}
              onChange={(e) => setNote(e.target.value)}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                onClick={() => saveShiftRequest(summary)}
                disabled={!hasSelection || interactionDisabled}
                fullWidth={isMobile}
              >
                保存
              </Button>
              {isSaving && <CircularProgress size={20} />}
            </Box>
          </Stack>
        </Box>
        {/* パターン管理ダイアログ */}
        <Dialog
          open={patternDialogOpen}
          onClose={() => setPatternDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>マイパターン一覧</DialogTitle>
          <DialogContent>
            {patternsLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} />
              </Box>
            ) : patterns.length === 0 ? (
              <Typography>登録されたパターンはありません。</Typography>
            ) : (
              <>
                {isMobile && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 1 }}
                  >
                    凡例: 出=出勤 / 固=固定休 / 希=希望休
                  </Typography>
                )}
                <List>
                  {patterns.map((p, index) => (
                    <React.Fragment key={p.id}>
                      <ListItem disableGutters sx={{ px: 0 }}>
                        <Paper
                          variant="outlined"
                          sx={{
                            width: "100%",
                            p: 2,
                            backgroundColor: "grey.50",
                          }}
                        >
                          <Typography variant="subtitle1" gutterBottom>
                            {p.name}
                          </Typography>
                          <Table size="small" sx={{ tableLayout: "fixed" }}>
                            <TableHead>
                              <TableRow>
                                {weekdayLabels.map((label, idx) => (
                                  <TableCell
                                    key={`${p.id}-weekday-${idx}`}
                                    align="center"
                                    sx={{ py: 0.5, whiteSpace: "nowrap" }}
                                  >
                                    {label}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                {weekdayLabels.map((_, idx) => {
                                  const normalized = normalizeStatus(
                                    p.mapping[idx] as string
                                  );
                                  return (
                                    <TableCell
                                      key={`${p.id}-status-${idx}`}
                                      align="center"
                                      sx={{ py: 0.5, whiteSpace: "nowrap" }}
                                    >
                                      {isMobile
                                        ? statusMobileLabelMap[normalized] ??
                                          statusLabelMap[normalized]
                                        : statusLabelMap[normalized]}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            </TableBody>
                          </Table>
                          <Stack
                            direction="row"
                            justifyContent="flex-end"
                            spacing={1}
                            sx={{ mt: 1 }}
                          >
                            <Button
                              size="small"
                              onClick={() => applyPattern(p)}
                              disabled={patternsLoading}
                            >
                              適用
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => deletePattern(p.id)}
                              disabled={patternsLoading}
                              startIcon={<DeleteIcon />}
                            >
                              削除
                            </Button>
                          </Stack>
                        </Paper>
                      </ListItem>
                      {index !== patterns.length - 1 && (
                        <Divider sx={{ my: 1 }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPatternDialogOpen(false)}>閉じる</Button>
            <Button
              onClick={() => {
                setPatternDialogOpen(false);
                setNewPatternDialogOpen(true);
              }}
              startIcon={<AddIcon />}
              disabled={patternsLoading}
            >
              新規作成
            </Button>
          </DialogActions>
        </Dialog>

        {/* 新規パターン作成ダイアログ */}
        <Dialog
          open={newPatternDialogOpen}
          onClose={() => setNewPatternDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>新しいパターンを作成</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="パターン名"
                value={newPatternName}
                onChange={(e) => setNewPatternName(e.target.value)}
              />
              <Typography variant="body2">
                曜日ごとのステータスを設定してください
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 1,
                }}
              >
                {Array.from({ length: 7 }).map((_, i) => (
                  <FormControl size="small" fullWidth key={i}>
                    <InputLabel>{weekdayLabels[i]}</InputLabel>
                    <Select
                      label={weekdayLabels[i]}
                      value={newPatternMapping[i]}
                      onChange={(e) =>
                        setNewPatternMapping((prev) => ({
                          ...prev,
                          [i]: e.target.value as Status,
                        }))
                      }
                    >
                      <MenuItem value="work">出勤</MenuItem>
                      <MenuItem value="fixedOff">固定休</MenuItem>
                      <MenuItem value="requestedOff">希望休</MenuItem>
                      <MenuItem value="auto">おまかせ</MenuItem>
                    </Select>
                  </FormControl>
                ))}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewPatternDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (!newPatternName) return;
                createPattern(newPatternName, newPatternMapping);
              }}
              disabled={patternsLoading}
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
