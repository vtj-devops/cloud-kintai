import "./styles.scss";

import {
  useDeleteAttendanceMutation,
  useLazyGetAttendanceByIdQuery,
  useLazyListRecentAttendancesQuery,
} from "@entities/attendance/api/attendanceApi";
import useAttendanceDaily, {
  AttendanceDaily,
  DuplicateAttendanceDaily,
} from "@entities/attendance/model/useAttendanceDaily";
import {
  useGetCompanyHolidayCalendarsQuery,
  useGetHolidayCalendarsQuery,
} from "@entities/calendar/api/calendarApi";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";
import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import * as MESSAGE_CODE from "@/errors";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";

import {
  calculateTotalOvertimeMinutes,
  formatMinutesToHHmm,
} from "../lib/overtimeUtils";
import { ActionsTableCell } from "./ActionsTableCell";
import { EndTimeTableCell } from "./EndTimeTableCell";
import MoveDateItem from "./MoveDateItem";
import { StartTimeTableCell } from "./StartTimeTableCell";

export default function AttendanceDailyList() {
  const { targetWorkDate } = useParams();
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs, loading: staffLoading, error: staffError } = useStaffs({
    isAuthenticated,
  });
  const {
    attendanceDailyList,
    error,
    loading,
    duplicateAttendances,
    loadAttendanceDataByMonth,
  } = useAttendanceDaily({
    staffs,
    staffLoading,
    staffError,
  });
  const { getEndTime } = useContext(AppConfigContext);
  const today = dayjs().format(AttendanceDate.QueryParamFormat);
  const displayDate = targetWorkDate || today;
  const displayDateFormatted = displayDate
    ? dayjs(displayDate, AttendanceDate.QueryParamFormat).format(
        AttendanceDate.DataFormat
      )
    : undefined;
  const dispatch = useDispatch();
  const [searchName, setSearchName] = useState("");
  const [triggerListAttendances] = useLazyListRecentAttendancesQuery();
  const {
    data: holidayCalendars = [],
    isLoading: isHolidayCalendarsLoading,
    isFetching: isHolidayCalendarsFetching,
    error: holidayCalendarsError,
  } = useGetHolidayCalendarsQuery();
  const {
    data: companyHolidayCalendars = [],
    isLoading: isCompanyHolidayCalendarsLoading,
    isFetching: isCompanyHolidayCalendarsFetching,
    error: companyHolidayCalendarsError,
  } = useGetCompanyHolidayCalendarsQuery();
  const calendarsLoading =
    isHolidayCalendarsLoading ||
    isHolidayCalendarsFetching ||
    isCompanyHolidayCalendarsLoading ||
    isCompanyHolidayCalendarsFetching;

  const scheduledEnd = useMemo(() => {
    const parsed = getEndTime();
    return { hour: parsed.hour(), minute: parsed.minute() };
  }, [getEndTime]);
  const scheduledHour = scheduledEnd.hour;
  const scheduledMinute = scheduledEnd.minute;

  // targetWorkDateが変わった時に、新しい月のデータをロード
  useEffect(() => {
    if (!targetWorkDate && !today) return;
    const dateToLoad = targetWorkDate || today;
    loadAttendanceDataByMonth(dateToLoad).catch((e) => {
      console.error("Failed to load attendance data for month:", e);
    });
  }, [targetWorkDate, today, loadAttendanceDataByMonth]);

  useEffect(() => {
    if (error) {
      dispatch(setSnackbarError(MESSAGE_CODE.E00001));
      console.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (holidayCalendarsError || companyHolidayCalendarsError) {
      dispatch(setSnackbarError(MESSAGE_CODE.E00001));
      console.error(holidayCalendarsError ?? companyHolidayCalendarsError);
    }
  }, [holidayCalendarsError, companyHolidayCalendarsError, dispatch]);

  const sortedAttendanceList = useMemo(() => {
    // create a copy before sort to avoid mutating the original attendanceDailyList
    return (attendanceDailyList || []).toSorted((a, b) => {
      const aSortKey = a.sortKey || "";
      const bSortKey = b.sortKey || "";
      return aSortKey.localeCompare(bSortKey);
    });
  }, [attendanceDailyList]);

  const renderSummaryMessage = useCallback((row: AttendanceDaily) => {
    if (!row.attendance) return "";
    const {
      substituteHolidayDate,
      remarks,
      specialHolidayFlag,
      paidHolidayFlag,
      absentFlag,
    } = row.attendance;

    const isSubstituteHoliday = substituteHolidayDate
      ? dayjs(substituteHolidayDate).isValid()
      : false;

    const full = (() => {
      const parts: string[] = [];
      if (isSubstituteHoliday) parts.push("振替休日");
      if (remarks) parts.push(remarks);
      return parts.join(" ");
    })();

    const MAX = 32;
    const needTruncate = full && full.length > MAX;
    const visible = needTruncate ? `${full.slice(0, MAX)}...` : full;

    return (
      <Box component="span">
        <Stack direction="row" spacing={0.5} alignItems="center">
          {specialHolidayFlag && (
            <Chip size="small" label="特別休暇" color="info" />
          )}
          {paidHolidayFlag && (
            <Chip size="small" label="有給休暇" color="success" />
          )}
          {absentFlag && <Chip size="small" label="欠勤" color="error" />}

          {needTruncate ? (
            <Tooltip title={full} arrow placement="top">
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  ml: 0.5,
                }}
              >
                {visible}
              </Box>
            </Tooltip>
          ) : (
            <Box component="span" sx={{ ml: 0.5 }}>
              {visible}
            </Box>
          )}
        </Stack>
      </Box>
    );
  }, []);

  const filteredAttendanceList = useMemo(() => {
    if (!searchName) return sortedAttendanceList;
    return sortedAttendanceList.filter((row) => {
      const fullName = `${row.familyName || ""}${row.givenName || ""}`;
      return fullName.includes(searchName);
    });
  }, [searchName, sortedAttendanceList]);

  const staffNameMap = useMemo(() => {
    return (attendanceDailyList || []).reduce<Record<string, string>>(
      (acc, row) => {
        acc[row.sub] = `${row.familyName} ${row.givenName}`.trim();
        return acc;
      },
      {}
    );
  }, [attendanceDailyList]);

  // map of staffId -> attendances
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, Attendance[]>
  >({});
  const [attendanceLoadingMap, setAttendanceLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [attendanceErrorMap, setAttendanceErrorMap] = useState<
    Record<string, Error | null>
  >({});

  const [duplicateSummaryMap, setDuplicateSummaryMap] = useState<
    Record<string, DuplicateAttendanceDaily[]>
  >({});
  const tableContainerSx = useMemo(
    () => ({
      width: "100%",
      overflowX: "auto",
    }),
    []
  );
  const summaryCellSx = useMemo(
    () => ({
      maxWidth: 360,
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
    }),
    []
  );
  const overtimeCellSx = useMemo(
    () => ({
      textAlign: "right" as const,
      whiteSpace: "nowrap",
    }),
    []
  );
  const recordIdsCellSx = useMemo(
    () => ({
      display: { xs: "none", md: "table-cell" },
      whiteSpace: "nowrap",
    }),
    []
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetStaffId, setConfirmTargetStaffId] = useState<
    string | null
  >(null);
  const [confirmTargetName, setConfirmTargetName] = useState<string>("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmRecords, setConfirmRecords] = useState<Attendance[]>([]);
  const [selectionMode, setSelectionMode] = useState<"record" | "field">(
    "record"
  );
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(
    null
  );
  const [fieldSelections, setFieldSelections] = useState<
    Record<string, number>
  >({});
  const [lastFieldRowIndex, setLastFieldRowIndex] = useState<number | null>(
    null
  );
  const [lastFieldRecordIndex, setLastFieldRecordIndex] = useState<
    number | null
  >(null);
  const [triggerGetAttendanceById] = useLazyGetAttendanceByIdQuery();
  const [deleteAttendance] = useDeleteAttendanceMutation();

  const overtimeMinutesMap = useMemo(() => {
    return Object.entries(attendanceMap).reduce(
      (acc, [staffId, attendances]) => {
        acc[staffId] = calculateTotalOvertimeMinutes(
          attendances,
          scheduledHour,
          scheduledMinute
        );
        return acc;
      },
      {} as Record<string, number>
    );
  }, [attendanceMap, scheduledHour, scheduledMinute]);

  const getOvertimeMinutes = useCallback(
    (row: AttendanceDaily) => {
      const mapped = overtimeMinutesMap[row.sub];
      if (typeof mapped === "number") {
        return mapped;
      }
      if (!row.attendance) return 0;
      return calculateTotalOvertimeMinutes(
        [row.attendance],
        scheduledHour,
        scheduledMinute
      );
    },
    [overtimeMinutesMap, scheduledHour, scheduledMinute]
  );

  const renderOvertimeValue = useCallback(
    (row: AttendanceDaily) => formatMinutesToHHmm(getOvertimeMinutes(row)),
    [getOvertimeMinutes]
  );

  useEffect(() => {
    const staffIds = Array.from(
      new Set((attendanceDailyList || []).map((r) => r.sub))
    );

    if (staffIds.length === 0) {
      return;
    }

    let isMounted = true;

    staffIds.forEach((staffId) => {
      setAttendanceLoadingMap((state) => ({ ...state, [staffId]: true }));
      setAttendanceErrorMap((state) => ({ ...state, [staffId]: null }));

      triggerListAttendances({ staffId })
        .unwrap()
        .then((res) => {
          if (!isMounted) return;
          const attendances = res.attendances ?? [];
          setAttendanceMap((map) => ({ ...map, [staffId]: attendances }));

          const duplicates = (res.duplicates ?? []).map((dup) => ({
            staffId: dup.staffId ?? staffId,
            staffName: staffNameMap[staffId] ?? staffId,
            workDate: dup.workDate,
            ids: dup.ids,
          }));

          setDuplicateSummaryMap((state) => ({
            ...state,
            [staffId]: duplicates,
          }));
        })
        .catch((err) => {
          if (!isMounted) return;
          const errorInstance =
            err instanceof Error
              ? err
              : new Error("Failed to fetch attendances");
          setAttendanceErrorMap((state) => ({
            ...state,
            [staffId]: errorInstance,
          }));
        })
        .finally(() => {
          if (!isMounted) return;
          setAttendanceLoadingMap((state) => ({
            ...state,
            [staffId]: false,
          }));
        });
    });

    return () => {
      isMounted = false;
    };
  }, [attendanceDailyList, triggerListAttendances, staffNameMap]);

  const isRequesting = useCallback((row: AttendanceDaily) => {
    if (!row.attendance?.changeRequests) return false;
    const changeRequests = row.attendance.changeRequests || [];
    return changeRequests.filter((item) => item && !item.completed).length > 0;
  }, []);

  const pendingList = useMemo(() => {
    if (loading) return [];
    return attendanceDailyList.filter((row) => {
      // prefer loaded attendance records from attendanceMap
      const attendances = attendanceMap[row.sub] ?? [];
      const hasPendingInAttendances = attendances.some((att) => {
        if (!att) return false;
        const changeRequests = (att as Attendance).changeRequests || [];
        return (
          changeRequests.filter((item) => item && !item.completed).length > 0
        );
      });
      if (hasPendingInAttendances) return true;
      // fallback to the row.attendance (existing behavior) when attendanceMap has no data
      return isRequesting(row);
    });
  }, [loading, attendanceDailyList, attendanceMap, isRequesting]);

  const summaryDuplicateList = useMemo(
    () => Object.values(duplicateSummaryMap).flat(),
    [duplicateSummaryMap]
  );

  const mergedDuplicateAttendances = useMemo(() => {
    const unique = new Map<string, DuplicateAttendanceDaily>();
    [...duplicateAttendances, ...summaryDuplicateList].forEach((dup) => {
      const key = `${dup.staffId}-${dup.workDate}-${dup.ids.join("-")}`;
      if (!unique.has(key)) {
        unique.set(key, dup);
      }
    });
    return Array.from(unique.values());
  }, [duplicateAttendances, summaryDuplicateList]);

  const duplicateInfoByStaff = useMemo(() => {
    return mergedDuplicateAttendances.reduce<
      Record<string, DuplicateAttendanceDaily[]>
    >((acc, dup) => {
      const list = acc[dup.staffId] ?? [];
      list.push(dup);
      acc[dup.staffId] = list;
      return acc;
    }, {});
  }, [mergedDuplicateAttendances]);

  const hasDuplicateAttendances = mergedDuplicateAttendances.length > 0;

  const handleOpenConfirm = useCallback(
    async (staffId: string) => {
      setSelectionMode("record");
      setSelectedRecordIndex(null);
      setFieldSelections({});
      setConfirmTargetStaffId(staffId);
      setConfirmTargetName(staffNameMap[staffId] ?? staffId);
      setConfirmOpen(true);
      setConfirmLoading(true);
      setLastFieldRowIndex(null);
      setLastFieldRecordIndex(null);

      const targetIds = mergedDuplicateAttendances
        .filter((dup) => dup.staffId === staffId)
        .flatMap((dup) => dup.ids);

      const uniqueIds = Array.from(new Set(targetIds)).filter(Boolean);

      try {
        const records = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await triggerGetAttendanceById({ id }).unwrap();
              return res ?? null;
            } catch (e) {
              console.error(e);
              return null;
            }
          })
        );

        const validRecords = records
          .filter((rec): rec is Attendance => Boolean(rec))
          .toSorted((a, b) => {
            const aTime = dayjs(
              `${a.workDate} ${a.startTime || "00:00"}`
            ).valueOf();
            const bTime = dayjs(
              `${b.workDate} ${b.startTime || "00:00"}`
            ).valueOf();
            return aTime - bTime;
          });

        setConfirmRecords(validRecords);
      } catch (e) {
        dispatch(setSnackbarError(MESSAGE_CODE.E00001));
        console.error(e);
      } finally {
        setConfirmLoading(false);
      }
    },
    [
      dispatch,
      mergedDuplicateAttendances,
      staffNameMap,
      triggerGetAttendanceById,
    ]
  );

  const handleCloseConfirm = useCallback(() => {
    setConfirmOpen(false);
    setConfirmRecords([]);
    setSelectedRecordIndex(null);
    setFieldSelections({});
    setLastFieldRowIndex(null);
    setLastFieldRecordIndex(null);
  }, []);

  const handleChangeSelectionMode = useCallback(
    (_: unknown, next: "record" | "field" | null) => {
      if (!next) return;
      setSelectionMode(next);
      setSelectedRecordIndex(null);
      setFieldSelections({});
      setLastFieldRowIndex(null);
      setLastFieldRecordIndex(null);
    },
    []
  );

  const handleSelectRecord = useCallback(
    (index: number) => {
      if (selectionMode !== "record") return;
      setSelectedRecordIndex((prev) => (prev === index ? null : index));
    },
    [selectionMode]
  );

  // handleSelectField は confirmFieldRows を参照するため、confirmFieldRows 定義後に配置します

  const renderInlineDiff = useCallback((base: string, target: string) => {
    if (base === target) return target || "-";

    const a = base ?? "";
    const b = target ?? "";

    let prefix = 0;
    while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
      prefix += 1;
    }

    let suffix = 0;
    while (
      suffix < a.length - prefix &&
      suffix < b.length - prefix &&
      a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
    ) {
      suffix += 1;
    }

    const sameStart = b.slice(0, prefix);
    const diffMid = b.slice(prefix, b.length - suffix);
    const sameEnd = b.slice(b.length - suffix);

    return (
      <Box component="span" sx={{ whiteSpace: "pre-wrap" }}>
        {sameStart}
        {diffMid ? (
          <Box
            component="span"
            sx={{
              backgroundColor: "rgba(255, 87, 34, 0.22)",
              borderRadius: 0.5,
              px: 0.5,
            }}
          >
            {diffMid || " "}
          </Box>
        ) : null}
        {sameEnd}
      </Box>
    );
  }, []);

  const renderDuplicateBadge = useCallback(
    (row: AttendanceDaily) => {
      const duplicates = duplicateInfoByStaff[row.sub];
      if (!duplicates || duplicates.length === 0) return null;

      const detail = duplicates
        .map(
          (d) =>
            `${dayjs(d.workDate).format("YYYY/MM/DD")}: ${d.ids.join(", ")}`
        )
        .join("\n");

      return (
        <Tooltip title={detail || "重複データがあります"} arrow placement="top">
          <Chip
            size="small"
            color="warning"
            label="重複"
            sx={{ fontWeight: 600 }}
          />
        </Tooltip>
      );
    },
    [duplicateInfoByStaff]
  );

  const confirmFieldRows = useMemo(() => {
    const formatTime = (value?: string | null) =>
      value ? dayjs(value).format("HH:mm") : "-";
    const formatDate = (value?: string | null) =>
      value ? dayjs(value).format("YYYY/MM/DD") : "-";
    const formatBool = (value?: boolean | null) => (value ? "○" : "-");
    const formatRests = (rests?: Attendance["rests"]) => {
      const items = (rests ?? []).filter(Boolean).map((r) => {
        const start = r?.startTime ? dayjs(r.startTime).format("HH:mm") : "-";
        const end = r?.endTime ? dayjs(r.endTime).format("HH:mm") : "-";
        return `${start}-${end}`;
      });
      return items.length ? items.join(" / ") : "-";
    };
    const formatHourlyTimes = (
      hourlyTimes?: Attendance["hourlyPaidHolidayTimes"]
    ) => {
      const items = (hourlyTimes ?? []).filter(Boolean).map((t) => {
        const start = t?.startTime ? dayjs(t.startTime).format("HH:mm") : "-";
        const end = t?.endTime ? dayjs(t.endTime).format("HH:mm") : "-";
        return `${start}-${end}`;
      });
      return items.length ? items.join(" / ") : "-";
    };
    const formatChangeRequests = (
      changeRequests?: Attendance["changeRequests"]
    ) => {
      const items = (changeRequests ?? []).filter(Boolean).map((c, idx) => {
        const start = c?.startTime ? dayjs(c.startTime).format("HH:mm") : "-";
        const end = c?.endTime ? dayjs(c.endTime).format("HH:mm") : "-";
        const completed = c?.completed ? "済" : "未";
        return `#${idx + 1}: ${start}-${end} / ${completed}`;
      });
      return items.length ? items.join(" | ") : "-";
    };
    const formatSystemComments = (
      systemComments?: Attendance["systemComments"]
    ) => {
      const items = (systemComments ?? [])
        .filter(Boolean)
        .map((c) => c?.comment);
      return items.length ? items.join(" | ") : "-";
    };

    const row = (label: string, value: (rec: Attendance) => string) => ({
      label,
      value,
      render: value,
    });

    return [
      row("対象日", (rec) => (rec.workDate ? formatDate(rec.workDate) : "-")),
      row("スタッフID", (rec) => rec.staffId || "-"),
      row("出勤", (rec) => formatTime(rec.startTime)),
      row("退勤", (rec) => formatTime(rec.endTime)),
      row("直行", (rec) => formatBool(rec.goDirectlyFlag)),
      row("直帰", (rec) => formatBool(rec.returnDirectlyFlag)),
      row("欠勤", (rec) => formatBool(rec.absentFlag)),
      row("休憩", (rec) => formatRests(rec.rests)),
      row("時間有休", (rec) => formatHourlyTimes(rec.hourlyPaidHolidayTimes)),
      row("備考", (rec) => rec.remarks || "-"),
      row("有給", (rec) => formatBool(rec.paidHolidayFlag)),
      row("特別休暇", (rec) => formatBool(rec.specialHolidayFlag)),
      row("指定休日", (rec) => formatBool(rec.isDeemedHoliday)),
      row("時間有休(時間)", (rec) =>
        typeof rec.hourlyPaidHolidayHours === "number"
          ? `${rec.hourlyPaidHolidayHours}h`
          : "-"
      ),
      row("振替日", (rec) => formatDate(rec.substituteHolidayDate)),
      row("変更申請", (rec) => formatChangeRequests(rec.changeRequests)),
      row("システムコメント", (rec) =>
        formatSystemComments(rec.systemComments)
      ),
      row("改訂番号", (rec) =>
        typeof rec.revision === "number" ? `${rec.revision}` : "-"
      ),
      row("作成日時", (rec) =>
        rec.createdAt ? dayjs(rec.createdAt).format("YYYY/MM/DD HH:mm") : "-"
      ),
      row("更新日時", (rec) =>
        rec.updatedAt ? dayjs(rec.updatedAt).format("YYYY/MM/DD HH:mm") : "-"
      ),
      row("ID", (rec) => rec.id || "-"),
    ];
  }, []);

  const handleSelectField = useCallback(
    (label: string, index: number, rowIndex: number, isShift: boolean) => {
      if (selectionMode !== "field") return;

      setFieldSelections((prev) => {
        // Shift+Click: select range for the same record index
        if (
          isShift &&
          lastFieldRowIndex !== null &&
          lastFieldRecordIndex === index
        ) {
          const next = { ...prev };
          const start = Math.min(lastFieldRowIndex, rowIndex);
          const end = Math.max(lastFieldRowIndex, rowIndex);
          confirmFieldRows.slice(start, end + 1).forEach((r) => {
            next[r.label] = index;
          });
          return next;
        }

        const current = prev[label];
        if (current === index) {
          const { [label]: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [label]: index };
      });

      setLastFieldRowIndex(rowIndex);
      setLastFieldRecordIndex(index);
    },
    [selectionMode, lastFieldRowIndex, lastFieldRecordIndex, confirmFieldRows]
  );

  return (
    <Stack direction="column" spacing={1}>
      {hasDuplicateAttendances && (
        <Box
          sx={{
            pb: 2,
            border: "1px solid",
            borderColor: "error.main",
            borderRadius: 2,
            p: 2,
            backgroundColor: "rgba(255, 205, 210, 0.16)",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            重複データが検出されたスタッフ ({mergedDuplicateAttendances.length})
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            同一日付に重複した勤怠データがあります。早急にデータ統合を実施してください。
          </Alert>
          <TableContainer sx={tableContainerSx}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "30%" }}>スタッフ</TableCell>
                  <TableCell sx={{ width: "25%" }}>対象日</TableCell>
                  <TableCell sx={{ width: "15%" }}>重複件数</TableCell>
                  <TableCell sx={recordIdsCellSx}>レコードID一覧</TableCell>
                  <TableCell sx={{ width: "12%" }} align="right">
                    確認
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mergedDuplicateAttendances.map(
                  (dup: DuplicateAttendanceDaily, index) => (
                    <TableRow key={`${dup.staffId}-${dup.workDate}-${index}`}>
                      <TableCell>{dup.staffName || dup.staffId}</TableCell>
                      <TableCell>
                        {dup.workDate
                          ? dayjs(dup.workDate).format("YYYY/MM/DD")
                          : "-"}
                      </TableCell>
                      <TableCell>{dup.ids.length}</TableCell>
                      <TableCell sx={recordIdsCellSx}>
                        {dup.ids.join(", ") || "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleOpenConfirm(dup.staffId)}
                        >
                          確認
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Dialog
        open={confirmOpen}
        onClose={handleCloseConfirm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          重複データ確認 - {confirmTargetName || confirmTargetStaffId}
        </DialogTitle>
        <DialogContent dividers>
          {confirmLoading ? (
            <Typography>読み込み中...</Typography>
          ) : confirmRecords.length === 0 ? (
            <Typography color="text.secondary">
              該当の重複データを取得できませんでした。
            </Typography>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  選択モードを切り替えて、レコード単位または項目単位で採用候補をマークできます。
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={selectionMode}
                  onChange={handleChangeSelectionMode}
                >
                  <ToggleButton value="record">レコード単位</ToggleButton>
                  <ToggleButton value="field">項目単位</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <TableContainer sx={tableContainerSx}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: "16%" }}>項目</TableCell>
                      {confirmRecords.map((rec, idx) => {
                        const isSelected =
                          selectionMode === "record" &&
                          selectedRecordIndex === idx;
                        const selectable = selectionMode === "record";

                        return (
                          <TableCell
                            key={rec.id}
                            sx={{
                              minWidth: 140,
                              cursor: selectable ? "pointer" : "default",
                              fontWeight: isSelected ? 700 : 400,
                              border: isSelected
                                ? "2px solid rgba(25,118,210,0.6)"
                                : undefined,
                              backgroundColor: isSelected
                                ? "rgba(25,118,210,0.08)"
                                : undefined,
                            }}
                            onClick={() =>
                              selectable && handleSelectRecord(idx)
                            }
                          >
                            #{idx + 1} ({rec.id})
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {confirmFieldRows.map((row, rowIndex) => {
                      const values = confirmRecords.map((rec) =>
                        row.value(rec)
                      );
                      const unique = new Set(values);
                      const hasDiff = unique.size > 1;
                      const diffSx = hasDiff
                        ? {
                            backgroundColor: "rgba(255,205,210,0.35)",
                            fontWeight: 700,
                          }
                        : undefined;

                      const base = values[0] ?? "";

                      return (
                        <TableRow key={row.label}>
                          <TableCell
                            sx={{ fontWeight: hasDiff ? 700 : 600, ...diffSx }}
                          >
                            {row.label}
                          </TableCell>
                          {confirmRecords.map((rec, idx) => {
                            const current = values[idx] ?? "";
                            const content = hasDiff
                              ? renderInlineDiff(base, current)
                              : row.render(rec);

                            const recordSelected =
                              selectionMode === "record" &&
                              selectedRecordIndex === idx;
                            const isFieldSelected =
                              selectionMode === "field" &&
                              fieldSelections[row.label] === idx;
                            const isFieldMode = selectionMode === "field";
                            const isRecordMode = selectionMode === "record";
                            const selectable = isFieldMode || isRecordMode;

                            return (
                              <TableCell
                                key={`${row.label}-${rec.id}`}
                                sx={{
                                  ...diffSx,
                                  cursor: selectable ? "pointer" : "default",
                                  border:
                                    isFieldSelected || recordSelected
                                      ? "2px solid rgba(25,118,210,0.6)"
                                      : undefined,
                                  backgroundColor:
                                    isFieldSelected || recordSelected
                                      ? "rgba(25,118,210,0.08)"
                                      : undefined,
                                }}
                                onClick={(event) => {
                                  if (!selectable) return;
                                  if (isRecordMode) {
                                    handleSelectRecord(idx);
                                    return;
                                  }
                                  handleSelectField(
                                    row.label,
                                    idx,
                                    rowIndex,
                                    event.shiftKey
                                  );
                                }}
                              >
                                {content}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {selectionMode === "record" && selectedRecordIndex !== null && (
            <Button
              color="error"
              variant="outlined"
              onClick={async () => {
                const selected = confirmRecords[selectedRecordIndex!];
                const toDelete = confirmRecords
                  .filter((_, idx) => idx !== selectedRecordIndex)
                  .map((r) => r.id)
                  .filter(Boolean) as string[];
                if (toDelete.length === 0) return;
                const ok = window.confirm(
                  `選択したデータのみを残し、他の重複レコードを削除します。対象件数: ${
                    toDelete.length
                  }\n削除対象ID: ${toDelete.join(
                    ", "
                  )}\nこの操作は取り消せません。実行しますか？`
                );
                if (!ok) return;
                setConfirmLoading(true);
                try {
                  for (const id of toDelete) {
                    try {
                      await deleteAttendance({ id }).unwrap();
                    } catch (e) {
                      console.error("Failed to delete attendance:", id, e);
                      dispatch(setSnackbarError(MESSAGE_CODE.E00001));
                    }
                  }
                  // ダイアログ内の表示を選択済みの1件に更新
                  setConfirmRecords(selected ? [selected] : []);
                  dispatch(
                    setSnackbarSuccess(
                      `選択したデータのみ残しました（残件数: ${
                        selected ? 1 : 0
                      }）`
                    )
                  );
                } finally {
                  setConfirmLoading(false);
                }
              }}
            >
              選択したデータを残す
            </Button>
          )}
          <Button onClick={handleCloseConfirm} color="inherit">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      <MoveDateItem workDate={dayjs(targetWorkDate || today)} />
      <TextField
        label="スタッフ名で検索"
        variant="outlined"
        size="small"
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
        sx={{ mb: 1 }}
      />
      {pendingList.length > 0 && (
        <Box sx={{ pb: 2, pt: 2 }}>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "warning.main",
              borderRadius: 2,
              p: 2,
              backgroundColor: "rgba(255,243,205,0.12)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              申請中のスタッフ ({pendingList.length})
            </Typography>
            <Alert severity="warning">
              <AlertTitle sx={{ fontWeight: "bold" }}>
                確認してください
              </AlertTitle>
              申請中のスタッフがあります。承認されるまで反映されません
            </Alert>
            <TableContainer sx={tableContainerSx}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={{ width: 90 }}>重複</TableCell>
                    <TableCell className="table-cell-header--staff-name">
                      氏名
                    </TableCell>
                    <TableCell className="table-cell-header--start-time">
                      出勤時刻
                    </TableCell>
                    <TableCell className="table-cell-header--end-time">
                      退勤時刻
                    </TableCell>
                    <TableCell
                      className="table-cell-header--overtime"
                      sx={overtimeCellSx}
                    >
                      残業時間
                    </TableCell>
                    <TableCell sx={summaryCellSx}>摘要</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingList.map((row, index) => (
                    <TableRow
                      key={`pending-${index}`}
                      className="attendance-row"
                    >
                      <ActionsTableCell
                        row={row}
                        attendances={attendanceMap[row.sub] ?? []}
                        attendanceLoading={!!attendanceLoadingMap[row.sub]}
                        attendanceError={attendanceErrorMap[row.sub] ?? null}
                        holidayCalendars={holidayCalendars}
                        companyHolidayCalendars={companyHolidayCalendars}
                        calendarLoading={calendarsLoading}
                      />
                      <TableCell sx={{ width: 90 }}>
                        {renderDuplicateBadge(row)}
                      </TableCell>
                      <TableCell>{`${row.familyName} ${row.givenName}`}</TableCell>
                      <StartTimeTableCell
                        row={row}
                        attendances={attendanceMap[row.sub]}
                        targetWorkDate={displayDateFormatted}
                      />
                      <EndTimeTableCell
                        targetWorkDate={displayDateFormatted}
                        row={row}
                        attendances={attendanceMap[row.sub]}
                      />
                      <TableCell sx={overtimeCellSx}>
                        {renderOvertimeValue(row)}
                      </TableCell>
                      <TableCell sx={summaryCellSx}>
                        {renderSummaryMessage(row)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }} />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}

      <TableContainer sx={tableContainerSx}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell sx={{ width: 90 }}>重複</TableCell>
              <TableCell className="table-cell-header--staff-name">
                氏名
              </TableCell>
              <TableCell className="table-cell-header--start-time">
                出勤時刻
              </TableCell>
              <TableCell className="table-cell-header--end-time">
                退勤時刻
              </TableCell>
              <TableCell
                className="table-cell-header--overtime"
                sx={overtimeCellSx}
              >
                残業時間
              </TableCell>
              <TableCell sx={summaryCellSx}>摘要</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAttendanceList.map((row, index) => (
              <TableRow key={index} className="attendance-row">
                <ActionsTableCell
                  row={row}
                  attendances={attendanceMap[row.sub] ?? []}
                  attendanceLoading={!!attendanceLoadingMap[row.sub]}
                  attendanceError={attendanceErrorMap[row.sub] ?? null}
                  holidayCalendars={holidayCalendars}
                  companyHolidayCalendars={companyHolidayCalendars}
                  calendarLoading={calendarsLoading}
                />
                <TableCell sx={{ width: 90 }}>
                  {renderDuplicateBadge(row)}
                </TableCell>
                <TableCell>{`${row.familyName} ${row.givenName}`}</TableCell>
                <StartTimeTableCell
                  row={row}
                  attendances={attendanceMap[row.sub]}
                  targetWorkDate={displayDateFormatted}
                />
                <EndTimeTableCell
                  row={row}
                  attendances={attendanceMap[row.sub]}
                  targetWorkDate={displayDateFormatted}
                />
                <TableCell sx={overtimeCellSx}>
                  {renderOvertimeValue(row)}
                </TableCell>
                <TableCell sx={summaryCellSx}>
                  {renderSummaryMessage(row)}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
