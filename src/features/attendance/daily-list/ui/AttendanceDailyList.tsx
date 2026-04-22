import "./styles.scss";

import { useDeleteAttendanceMutation, useLazyGetAttendanceByIdQuery, } from "@entities/attendance/api/attendanceApi";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import useAttendanceDaily, { AttendanceDaily, DuplicateAttendanceDaily, } from "@entities/attendance/model/useAttendanceDaily";
import { useCalendars } from "@entities/calendar/model/useCalendars";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import SearchIcon from "@mui/icons-material/Search";
import { Alert, AlertTitle, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, } from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";
import * as MESSAGE_CODE from "@/errors";

import { formatMinutesToHHmm, } from "../lib/overtimeUtils";
import { useAttendanceDailyFetch } from "../model/useAttendanceDailyFetch";
import { ActionsTableCell } from "./ActionsTableCell";
import { EndTimeTableCell } from "./EndTimeTableCell";
import MoveDateItem from "./MoveDateItem";
import { StartTimeTableCell } from "./StartTimeTableCell";

// Summary message cell styles
const remarksTruncatedBoxSx = {
    display: "inline-block",
    verticalAlign: "middle",
    ml: 0.5,
} as const;
const remarksBoxSx = { ml: 0.5 } as const;

// Inline diff highlight styles
const diffWrapperSx = { whiteSpace: "pre-wrap" } as const;
const diffHighlightSx = {
    backgroundColor: "rgba(255, 87, 34, 0.22)",
    borderRadius: 0.5,
    px: 0.5,
} as const;

// Duplicate badge chip
const duplicateBadgeChipSx = { fontWeight: 600 } as const;

// Table layout styles
const tableContainerSx = { width: "100%", overflowX: "auto" } as const;
const summaryCellSx = {
    maxWidth: 360,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
} as const;
const overtimeCellSx = { textAlign: "right" as const, whiteSpace: "nowrap" } as const;
const recordIdsCellSx = {
    display: { xs: "none", md: "table-cell" },
    whiteSpace: "nowrap",
} as const;
const col90Sx = { width: 90 } as const;
const noWrapCellSx = { whiteSpace: "nowrap" } as const;

// Duplicate error section
const duplicateErrorBoxSx = {
    pb: 2,
    border: "1px solid",
    borderColor: "error.main",
    borderRadius: 2,
    p: 2,
    backgroundColor: "rgba(255, 205, 210, 0.16)",
} as const;
const sectionTitleSx = { mb: 1 } as const;
const alertMb2Sx = { mb: 2 } as const;
const colStaffSx = { width: "30%" } as const;
const colDateSx = { width: "25%" } as const;
const colCountSx = { width: "15%" } as const;
const colActionSx = { width: "12%" } as const;

// Duplicate resolution dialog
const dialogHeaderSx = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mb: 1.5,
    gap: 1,
} as const;
const colItemLabelSx = { width: "16%" } as const;

// List header and search bar
const listHeaderBoxSx = {
    mb: 1,
    display: "flex",
    alignItems: { xs: "flex-start", sm: "center" },
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 1,
} as const;
const searchBoxSx = { display: "flex", alignItems: "center", gap: 1 } as const;
const searchTextFieldSx = {
    maxWidth: 360,
    "& .MuiOutlinedInput-root": {
        borderRadius: "18px",
        backgroundColor: "#ffffff",
        "& fieldset": {
            borderColor: "rgba(148,163,184,0.35)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(100,116,139,0.45)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#19b985",
            borderWidth: "1px",
        },
    },
} as const;

// Pending requests section
const pendingOuterBoxSx = { pb: 2, pt: 2 } as const;
const pendingWarningBoxSx = {
    border: "1px solid",
    borderColor: "warning.main",
    borderRadius: 2,
    p: 2,
    backgroundColor: "rgba(255,243,205,0.12)",
} as const;
const alertTitleBoldSx = { fontWeight: "bold" } as const;

export default function AttendanceDailyList() {
    const { targetWorkDate } = useParams();
    const { authStatus } = useContext(AuthContext);
    const isAuthenticated = authStatus === "authenticated";
    const { staffs, loading: staffLoading, error: staffError } = useStaffs({
        isAuthenticated,
    });
    const { attendanceDailyList, error, loading, duplicateAttendances, loadAttendanceDataByMonth, } = useAttendanceDaily({
        staffs,
        staffLoading,
        staffError,
    });
    const { getEndTime } = useContext(AppConfigContext);
    const today = dayjs().format(AttendanceDate.QueryParamFormat);
    const displayDate = targetWorkDate || today;
    const displayDateFormatted = displayDate
        ? dayjs(displayDate, AttendanceDate.QueryParamFormat).format(AttendanceDate.DataFormat)
        : undefined;
    const dispatch = useDispatch();
    const [searchName, setSearchName] = useState("");
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const { holidayCalendars, companyHolidayCalendars, isLoading: calendarsLoading, error: calendarsError, } = useCalendars();
    const scheduledEnd = useMemo(() => {
        const parsed = getEndTime();
        return { hour: parsed.hour(), minute: parsed.minute() };
    }, [getEndTime]);
    const scheduledHour = scheduledEnd.hour;
    const scheduledMinute = scheduledEnd.minute;
    // targetWorkDateが変わった時に、新しい月のデータをロード
    useEffect(() => {
        if (!targetWorkDate && !today)
            return;
        const dateToLoad = targetWorkDate || today;
        loadAttendanceDataByMonth(dateToLoad).catch((e) => {
            console.error("Failed to load attendance data for month:", e);
        });
    }, [targetWorkDate, today, loadAttendanceDataByMonth]);
    useEffect(() => {
        if (error) {
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E00001
            }));
            console.error(error);
        }
    }, [error]);
    useEffect(() => {
        if (calendarsError) {
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E00001
            }));
            console.error(calendarsError);
        }
    }, [calendarsError, dispatch]);
    const sortedAttendanceList = useMemo(() => {
        // create a copy before sort to avoid mutating the original attendanceDailyList
        return (attendanceDailyList || []).toSorted((a, b) => {
            const aSortKey = a.sortKey || "";
            const bSortKey = b.sortKey || "";
            return aSortKey.localeCompare(bSortKey);
        });
    }, [attendanceDailyList]);
    const renderSummaryMessage = useCallback((attendance: Attendance | null | undefined) => {
        if (!attendance)
            return "";
        const { substituteHolidayDate, remarks, specialHolidayFlag, paidHolidayFlag, absentFlag, } = attendance;
        const isSubstituteHoliday = substituteHolidayDate
            ? dayjs(substituteHolidayDate).isValid()
            : false;
        const full = (() => {
            const parts: string[] = [];
            if (isSubstituteHoliday)
                parts.push("振替休日");
            if (remarks)
                parts.push(remarks);
            return parts.join(" ");
        })();
        const MAX = 32;
        const needTruncate = full && full.length > MAX;
        const visible = needTruncate ? `${full.slice(0, MAX)}...` : full;
        return (<Box component="span">
          <Stack direction="row" spacing={0.5} alignItems="center">
            {specialHolidayFlag && (<Chip size="small" label="特別休暇" color="info"/>)}
            {paidHolidayFlag && (<Chip size="small" label="有給休暇" color="success"/>)}
            {absentFlag && <Chip size="small" label="欠勤" color="error"/>}

            {needTruncate ? (<Tooltip title={full} arrow placement="top">
                <Box component="span" sx={remarksTruncatedBoxSx}>
                  {visible}
                </Box>
              </Tooltip>) : (<Box component="span" sx={remarksBoxSx}>
                {visible}
              </Box>)}
          </Stack>
        </Box>);
    }, []);
    const filteredAttendanceList = useMemo(() => {
        if (!searchName)
            return sortedAttendanceList;
        return sortedAttendanceList.filter((row) => {
            const fullName = `${row.familyName || ""}${row.givenName || ""}`;
            return fullName.includes(searchName);
        });
    }, [searchName, sortedAttendanceList]);
    const staffNameMap = useMemo(() => {
        return (attendanceDailyList || []).reduce<Record<string, string>>((acc, row) => {
            acc[row.sub] = `${row.familyName} ${row.givenName}`.trim();
            return acc;
        }, {});
    }, [attendanceDailyList]);
    const {
        attendanceMap,
        attendanceLoadingMap,
        attendanceErrorMap,
        getAttendanceForDisplayDate,
        getOvertimeMinutes,
        mergedDuplicateAttendances,
        duplicateInfoByStaff,
    } = useAttendanceDailyFetch({
        attendanceDailyList,
        displayDateFormatted,
        staffNameMap,
        scheduledHour,
        scheduledMinute,
        duplicateAttendances,
        loading,
    });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTargetStaffId, setConfirmTargetStaffId] = useState<string | null>(null);
    const [confirmTargetName, setConfirmTargetName] = useState<string>("");
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmRecords, setConfirmRecords] = useState<Attendance[]>([]);
    const [selectionMode, setSelectionMode] = useState<"record" | "field">("record");
    const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null);
    const [fieldSelections, setFieldSelections] = useState<Record<string, number>>({});
    const [lastFieldRowIndex, setLastFieldRowIndex] = useState<number | null>(null);
    const [lastFieldRecordIndex, setLastFieldRecordIndex] = useState<number | null>(null);
    const [triggerGetAttendanceById] = useLazyGetAttendanceByIdQuery();
    const [deleteAttendance] = useDeleteAttendanceMutation();
    const renderOvertimeValue = useCallback((row: AttendanceDaily) => formatMinutesToHHmm(getOvertimeMinutes(row)), [getOvertimeMinutes]);
    const isRequesting = useCallback((row: AttendanceDaily) => {
        const targetAttendance = getAttendanceForDisplayDate(row);
        if (!targetAttendance?.changeRequests)
            return false;
        const changeRequests = targetAttendance.changeRequests || [];
        return changeRequests.filter((item) => item && !item.completed).length > 0;
    }, [getAttendanceForDisplayDate]);
    const pendingList = useMemo(() => {
        if (loading)
            return [];
        return attendanceDailyList.filter((row) => isRequesting(row));
    }, [loading, attendanceDailyList, isRequesting]);
    const hasDuplicateAttendances = mergedDuplicateAttendances.length > 0;
    const handleOpenConfirm = useCallback(async (staffId: string) => {
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
            const records = await Promise.all(uniqueIds.map(async (id) => {
                try {
                    const res = await triggerGetAttendanceById({ id }).unwrap();
                    return res ?? null;
                }
                catch (e) {
                    console.error(e);
                    return null;
                }
            }));
            const validRecords = records
                .filter((rec): rec is Attendance => Boolean(rec))
                .toSorted((a, b) => {
                const aTime = dayjs(`${a.workDate} ${a.startTime || "00:00"}`).valueOf();
                const bTime = dayjs(`${b.workDate} ${b.startTime || "00:00"}`).valueOf();
                return aTime - bTime;
            });
            setConfirmRecords(validRecords);
        }
        catch (e) {
            dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E00001
            }));
            console.error(e);
        }
        finally {
            setConfirmLoading(false);
        }
    }, [
        dispatch,
        mergedDuplicateAttendances,
        staffNameMap,
        triggerGetAttendanceById,
    ]);
    const handleOpenConfirmClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const staffId = e.currentTarget.dataset.staffId;
        if (staffId) handleOpenConfirm(staffId);
    }, [handleOpenConfirm]);
    const handleCloseConfirm = useCallback(() => {
        setConfirmOpen(false);
        setConfirmRecords([]);
        setSelectedRecordIndex(null);
        setFieldSelections({});
        setLastFieldRowIndex(null);
        setLastFieldRecordIndex(null);
    }, []);
    const handleChangeSelectionMode = useCallback((_: unknown, next: "record" | "field" | null) => {
        if (!next)
            return;
        setSelectionMode(next);
        setSelectedRecordIndex(null);
        setFieldSelections({});
        setLastFieldRowIndex(null);
        setLastFieldRecordIndex(null);
    }, []);
    const handleSelectRecord = useCallback((index: number) => {
        if (selectionMode !== "record")
            return;
        setSelectedRecordIndex((prev) => (prev === index ? null : index));
    }, [selectionMode]);
    const handleRecordHeaderClick = useCallback((e: React.MouseEvent<HTMLTableCellElement>) => {
        if (selectionMode !== "record") return;
        const idx = Number(e.currentTarget.dataset.recordIndex);
        handleSelectRecord(idx);
    }, [selectionMode, handleSelectRecord]);
    // handleSelectField は confirmFieldRows を参照するため、confirmFieldRows 定義後に配置します
    const renderInlineDiff = useCallback((base: string, target: string) => {
        if (base === target)
            return target || "-";
        const a = base ?? "";
        const b = target ?? "";
        let prefix = 0;
        while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
            prefix += 1;
        }
        let suffix = 0;
        while (suffix < a.length - prefix &&
            suffix < b.length - prefix &&
            a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) {
            suffix += 1;
        }
        const sameStart = b.slice(0, prefix);
        const diffMid = b.slice(prefix, b.length - suffix);
        const sameEnd = b.slice(b.length - suffix);
        return (<Box component="span" sx={diffWrapperSx}>
        {sameStart}
        {diffMid ? (<Box component="span" sx={diffHighlightSx}>
            {diffMid || " "}
          </Box>) : null}
        {sameEnd}
      </Box>);
    }, []);
    const renderDuplicateBadge = useCallback((row: AttendanceDaily) => {
        const duplicates = duplicateInfoByStaff[row.sub];
        if (!duplicates || duplicates.length === 0)
            return null;
        const detail = duplicates
            .map((d) => `${dayjs(d.workDate).format("YYYY/MM/DD")}: ${d.ids.join(", ")}`)
            .join("\n");
        return (<Tooltip title={detail || "重複データがあります"} arrow placement="top">
          <Chip size="small" color="warning" label="重複" sx={duplicateBadgeChipSx}/>
        </Tooltip>);
    }, [duplicateInfoByStaff]);
    const confirmFieldRows = useMemo(() => {
        const formatTime = (value?: string | null) => value ? dayjs(value).format("HH:mm") : "-";
        const formatDate = (value?: string | null) => value ? dayjs(value).format("YYYY/MM/DD") : "-";
        const formatBool = (value?: boolean | null) => (value ? "○" : "-");
        const formatRests = (rests?: Attendance["rests"]) => {
            const items = (rests ?? []).filter(Boolean).map((r) => {
                const start = r?.startTime ? dayjs(r.startTime).format("HH:mm") : "-";
                const end = r?.endTime ? dayjs(r.endTime).format("HH:mm") : "-";
                return `${start}-${end}`;
            });
            return items.length ? items.join(" / ") : "-";
        };
        const formatHourlyTimes = (hourlyTimes?: Attendance["hourlyPaidHolidayTimes"]) => {
            const items = (hourlyTimes ?? []).filter(Boolean).map((t) => {
                const start = t?.startTime ? dayjs(t.startTime).format("HH:mm") : "-";
                const end = t?.endTime ? dayjs(t.endTime).format("HH:mm") : "-";
                return `${start}-${end}`;
            });
            return items.length ? items.join(" / ") : "-";
        };
        const formatChangeRequests = (changeRequests?: Attendance["changeRequests"]) => {
            const items = (changeRequests ?? []).filter(Boolean).map((c, idx) => {
                const start = c?.startTime ? dayjs(c.startTime).format("HH:mm") : "-";
                const end = c?.endTime ? dayjs(c.endTime).format("HH:mm") : "-";
                const completed = c?.completed ? "済" : "未";
                return `#${idx + 1}: ${start}-${end} / ${completed}`;
            });
            return items.length ? items.join(" | ") : "-";
        };
        const formatSystemComments = (systemComments?: Attendance["systemComments"]) => {
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
            row("時間有休(時間)", (rec) => typeof rec.hourlyPaidHolidayHours === "number"
                ? `${rec.hourlyPaidHolidayHours}h`
                : "-"),
            row("振替日", (rec) => formatDate(rec.substituteHolidayDate)),
            row("変更申請", (rec) => formatChangeRequests(rec.changeRequests)),
            row("システムコメント", (rec) => formatSystemComments(rec.systemComments)),
            row("改訂番号", (rec) => typeof rec.revision === "number" ? `${rec.revision}` : "-"),
            row("作成日時", (rec) => rec.createdAt ? dayjs(rec.createdAt).format("YYYY/MM/DD HH:mm") : "-"),
            row("更新日時", (rec) => rec.updatedAt ? dayjs(rec.updatedAt).format("YYYY/MM/DD HH:mm") : "-"),
            row("ID", (rec) => rec.id || "-"),
        ];
    }, []);
    const handleSelectField = useCallback((label: string, index: number, rowIndex: number, isShift: boolean) => {
        if (selectionMode !== "field")
            return;
        setFieldSelections((prev) => {
            // Shift+Click: select range for the same record index
            if (isShift &&
                lastFieldRowIndex !== null &&
                lastFieldRecordIndex === index) {
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
    }, [selectionMode, lastFieldRowIndex, lastFieldRecordIndex, confirmFieldRows]);
    const handleBodyCellClick = useCallback((e: React.MouseEvent<HTMLTableCellElement>) => {
        const idx = Number(e.currentTarget.dataset.recordIndex);
        const rowIndex = Number(e.currentTarget.dataset.rowIndex);
        const fieldLabel = e.currentTarget.dataset.fieldLabel ?? "";
        if (selectionMode === "record") {
            handleSelectRecord(idx);
        } else if (selectionMode === "field") {
            handleSelectField(fieldLabel, idx, rowIndex, e.shiftKey);
        }
    }, [selectionMode, handleSelectRecord, handleSelectField]);
    const handleDeleteDuplicates = useCallback(async () => {
        if (selectedRecordIndex === null) return;
        const selected = confirmRecords[selectedRecordIndex];
        const toDelete = confirmRecords
            .filter((_, idx) => idx !== selectedRecordIndex)
            .map((r) => r.id)
            .filter(Boolean) as string[];
        if (toDelete.length === 0) return;
        const ok = window.confirm(`選択したデータのみを残し、他の重複レコードを削除します。対象件数: ${toDelete.length}\n削除対象ID: ${toDelete.join(", ")}\nこの操作は取り消せません。実行しますか？`);
        if (!ok) return;
        setConfirmLoading(true);
        try {
            for (const id of toDelete) {
                try {
                    await deleteAttendance({ id }).unwrap();
                }
                catch (e) {
                    console.error("Failed to delete attendance:", id, e);
                    dispatch(pushNotification({
                        tone: "error",
                        message: MESSAGE_CODE.E00001
                    }));
                }
            }
            setConfirmRecords(selected ? [selected] : []);
            dispatch(pushNotification({
                tone: "success",
                message: `選択したデータのみ残しました（残件数: ${selected ? 1 : 0}）`
            }));
        }
        finally {
            setConfirmLoading(false);
        }
    }, [selectedRecordIndex, confirmRecords, deleteAttendance, dispatch]);
    const handleSearchToggle = useCallback(() => {
        setIsSearchVisible((prev) => {
            const next = !prev;
            if (!next) setSearchName("");
            return next;
        });
    }, []);
    const handleSearchNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchName(e.target.value);
    }, []);
    return (<Stack direction="column" spacing={1}>
      {hasDuplicateAttendances && (<Box sx={duplicateErrorBoxSx}>
          <Typography variant="h6" sx={sectionTitleSx}>
            重複データが検出されたスタッフ ({mergedDuplicateAttendances.length})
          </Typography>
          <Alert severity="error" sx={alertMb2Sx}>
            同一日付に重複した勤怠データがあります。早急にデータ統合を実施してください。
          </Alert>
          <TableContainer sx={tableContainerSx}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={colStaffSx}>スタッフ</TableCell>
                  <TableCell sx={colDateSx}>対象日</TableCell>
                  <TableCell sx={colCountSx}>重複件数</TableCell>
                  <TableCell sx={recordIdsCellSx}>レコードID一覧</TableCell>
                  <TableCell sx={colActionSx} align="right">
                    確認
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mergedDuplicateAttendances.map((dup: DuplicateAttendanceDaily, index) => (<TableRow key={`${dup.staffId}-${dup.workDate}-${index}`}>
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
                        <Button variant="contained" color="error" size="small" data-staff-id={dup.staffId} onClick={handleOpenConfirmClick}>
                          確認
                        </Button>
                      </TableCell>
                    </TableRow>))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>)}

      <Dialog open={confirmOpen} onClose={handleCloseConfirm} maxWidth="md" fullWidth>
        <DialogTitle>
          重複データ確認 - {confirmTargetName || confirmTargetStaffId}
        </DialogTitle>
        <DialogContent dividers>
          {confirmLoading ? (<Typography>読み込み中...</Typography>) : confirmRecords.length === 0 ? (<Typography color="text.secondary">
              該当の重複データを取得できませんでした。
            </Typography>) : (<>
              <Box sx={dialogHeaderSx}>
                <Typography variant="body2" color="text.secondary">
                  選択モードを切り替えて、レコード単位または項目単位で採用候補をマークできます。
                </Typography>
                <ToggleButtonGroup size="small" exclusive value={selectionMode} onChange={handleChangeSelectionMode}>
                  <ToggleButton value="record">レコード単位</ToggleButton>
                  <ToggleButton value="field">項目単位</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <TableContainer sx={tableContainerSx}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={colItemLabelSx}>項目</TableCell>
                      {confirmRecords.map((rec, idx) => {
                const isSelected = selectionMode === "record" &&
                    selectedRecordIndex === idx;
                const selectable = selectionMode === "record";
                return (<TableCell key={rec.id} sx={{
                        minWidth: 140,
                        cursor: selectable ? "pointer" : "default",
                        fontWeight: isSelected ? 700 : 400,
                        border: isSelected
                            ? "2px solid rgba(25,118,210,0.6)"
                            : undefined,
                        backgroundColor: isSelected
                            ? "rgba(25,118,210,0.08)"
                            : undefined,
                    }} data-record-index={idx} onClick={handleRecordHeaderClick}>
                            #{idx + 1} ({rec.id})
                          </TableCell>);
            })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {confirmFieldRows.map((row, rowIndex) => {
                const values = confirmRecords.map((rec) => row.value(rec));
                const unique = new Set(values);
                const hasDiff = unique.size > 1;
                const diffSx = hasDiff
                    ? {
                        backgroundColor: "rgba(255,205,210,0.35)",
                        fontWeight: 700,
                    }
                    : undefined;
                const base = values[0] ?? "";
                return (<TableRow key={row.label}>
                          <TableCell sx={{ fontWeight: hasDiff ? 700 : 600, ...diffSx }}>
                            {row.label}
                          </TableCell>
                          {confirmRecords.map((rec, idx) => {
                        const current = values[idx] ?? "";
                        const content = hasDiff
                            ? renderInlineDiff(base, current)
                            : row.render(rec);
                        const recordSelected = selectionMode === "record" &&
                            selectedRecordIndex === idx;
                        const isFieldSelected = selectionMode === "field" &&
                            fieldSelections[row.label] === idx;
                        const isFieldMode = selectionMode === "field";
                        const isRecordMode = selectionMode === "record";
                        const selectable = isFieldMode || isRecordMode;
                        return (<TableCell key={`${row.label}-${rec.id}`} sx={{
                                ...diffSx,
                                cursor: selectable ? "pointer" : "default",
                                border: isFieldSelected || recordSelected
                                    ? "2px solid rgba(25,118,210,0.6)"
                                    : undefined,
                                backgroundColor: isFieldSelected || recordSelected
                                    ? "rgba(25,118,210,0.08)"
                                    : undefined,
                            }} data-record-index={idx} data-row-index={rowIndex} data-field-label={row.label} onClick={handleBodyCellClick}>
                                {content}
                              </TableCell>);
                    })}
                        </TableRow>);
            })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>)}
        </DialogContent>
        <DialogActions>
          {selectionMode === "record" && selectedRecordIndex !== null && (<Button color="error" variant="outlined" onClick={handleDeleteDuplicates}>
              選択したデータを残す
            </Button>)}
          <Button onClick={handleCloseConfirm} color="inherit">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={listHeaderBoxSx}>
        <MoveDateItem workDate={dayjs(targetWorkDate || today)}/>
        <Box sx={searchBoxSx}>
          <AppIconButton aria-label="スタッフ名検索を表示" onClick={handleSearchToggle} size="sm">
            <SearchIcon fontSize="small"/>
          </AppIconButton>
          {isSearchVisible && (<TextField label="スタッフ名で検索" variant="outlined" size="small" value={searchName} onChange={handleSearchNameChange} sx={searchTextFieldSx}/>)}
        </Box>
      </Box>
      {pendingList.length > 0 && (<Box sx={pendingOuterBoxSx}>
          <Box sx={pendingWarningBoxSx}>
            <Typography variant="h6" sx={sectionTitleSx}>
              申請中のスタッフ ({pendingList.length})
            </Typography>
            <Alert severity="warning">
              <AlertTitle sx={alertTitleBoldSx}>
                確認してください
              </AlertTitle>
              申請中のスタッフがあります。承認されるまで反映されません
            </Alert>
            <TableContainer sx={tableContainerSx}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={col90Sx}>重複</TableCell>
                    <TableCell className="table-cell-header--staff-name">
                      氏名
                    </TableCell>
                    <TableCell className="table-cell-header--start-time">
                      出勤時刻
                    </TableCell>
                    <TableCell className="table-cell-header--end-time">
                      退勤時刻
                    </TableCell>
                    <TableCell className="table-cell-header--overtime" sx={overtimeCellSx}>
                      残業時間
                    </TableCell>
                    <TableCell sx={summaryCellSx}>摘要</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingList.map((row, index) => (<TableRow key={`pending-${index}`} className="attendance-row">
                      <ActionsTableCell row={row} attendances={attendanceMap[row.sub] ?? []} attendanceLoading={!!attendanceLoadingMap[row.sub]} attendanceError={attendanceErrorMap[row.sub] ?? null} holidayCalendars={holidayCalendars} companyHolidayCalendars={companyHolidayCalendars} calendarLoading={calendarsLoading} targetWorkDate={displayDateFormatted}/>
                      <TableCell sx={col90Sx}>
                        {renderDuplicateBadge(row)}
                      </TableCell>
                      <TableCell>{`${row.familyName} ${row.givenName}`}</TableCell>
                      <StartTimeTableCell row={row} attendances={attendanceMap[row.sub]} targetWorkDate={displayDateFormatted}/>
                      <EndTimeTableCell targetWorkDate={displayDateFormatted} row={row} attendances={attendanceMap[row.sub]}/>
                      <TableCell sx={overtimeCellSx}>
                        {renderOvertimeValue(row)}
                      </TableCell>
                      <TableCell sx={summaryCellSx}>
                        {renderSummaryMessage(getAttendanceForDisplayDate(row))}
                      </TableCell>
                      <TableCell sx={noWrapCellSx}/>
                    </TableRow>))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>)}

      <TableContainer sx={tableContainerSx}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell sx={col90Sx}>重複</TableCell>
              <TableCell className="table-cell-header--staff-name">
                氏名
              </TableCell>
              <TableCell className="table-cell-header--start-time">
                出勤時刻
              </TableCell>
              <TableCell className="table-cell-header--end-time">
                退勤時刻
              </TableCell>
              <TableCell className="table-cell-header--overtime" sx={overtimeCellSx}>
                残業時間
              </TableCell>
              <TableCell sx={summaryCellSx}>摘要</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAttendanceList.map((row, index) => (<TableRow key={index} className="attendance-row">
                <ActionsTableCell row={row} attendances={attendanceMap[row.sub] ?? []} attendanceLoading={!!attendanceLoadingMap[row.sub]} attendanceError={attendanceErrorMap[row.sub] ?? null} holidayCalendars={holidayCalendars} companyHolidayCalendars={companyHolidayCalendars} calendarLoading={calendarsLoading} targetWorkDate={displayDateFormatted}/>
                <TableCell sx={col90Sx}>
                  {renderDuplicateBadge(row)}
                </TableCell>
                <TableCell>{`${row.familyName} ${row.givenName}`}</TableCell>
                <StartTimeTableCell row={row} attendances={attendanceMap[row.sub]} targetWorkDate={displayDateFormatted}/>
                <EndTimeTableCell row={row} attendances={attendanceMap[row.sub]} targetWorkDate={displayDateFormatted}/>
                <TableCell sx={overtimeCellSx}>
                  {renderOvertimeValue(row)}
                </TableCell>
                <TableCell sx={summaryCellSx}>
                  {renderSummaryMessage(getAttendanceForDisplayDate(row))}
                </TableCell>
                <TableCell sx={noWrapCellSx}/>
              </TableRow>))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>);
}
