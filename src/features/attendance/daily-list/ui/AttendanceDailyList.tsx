import "./styles.scss";

import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { AttendanceDaily } from "@entities/attendance/model/useAttendanceDaily";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import { AppIconButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useCallback, useContext } from "react";

import { formatMinutesToHHmm } from "../lib/overtimeUtils";
import { useAttendanceDailyListData } from "../model/useAttendanceDailyListData";
import { useAttendanceNameSearch } from "../model/useAttendanceNameSearch";
import { ActionsTableCell } from "./ActionsTableCell";
import {
  DuplicateAttendanceBadge,
  DuplicateAttendanceManager,
} from "./DuplicateAttendanceManager";
import { EndTimeTableCell } from "./EndTimeTableCell";
import MoveDateItem from "./MoveDateItem";
import { StartTimeTableCell } from "./StartTimeTableCell";

const remarksTruncatedBoxSx = {
  display: "inline-block",
  verticalAlign: "middle",
  ml: 0.5,
} as const;
const remarksBoxSx = { ml: 0.5 } as const;

const tableContainerSx = { width: "100%", overflowX: "auto" } as const;
const summaryCellSx = {
  maxWidth: 360,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
} as const;
const overtimeCellSx = { textAlign: "right" as const, whiteSpace: "nowrap" } as const;
const col90Sx = { width: 90 } as const;
const noWrapCellSx = { whiteSpace: "nowrap" } as const;

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

const pendingOuterBoxSx = { pb: 2, pt: 2 } as const;
const pendingWarningBoxSx = {
  border: "1px solid",
  borderColor: "warning.main",
  borderRadius: 2,
  p: 2,
  backgroundColor: "rgba(255,243,205,0.12)",
} as const;
const sectionTitleSx = { mb: 1 } as const;
const alertTitleBoldSx = { fontWeight: "bold" } as const;

export default function AttendanceDailyList() {
  const { authStatus } = useContext(AuthContext);
  const { getEndTime } = useContext(AppConfigContext);

  const {
    targetWorkDate,
    today,
    displayDateFormatted,
    sortedAttendanceList,
    pendingList,
    staffNameMap,
    attendanceMap,
    attendanceLoadingMap,
    attendanceErrorMap,
    getAttendanceForDisplayDate,
    getOvertimeMinutes,
    mergedDuplicateAttendances,
    duplicateInfoByStaff,
    holidayCalendars,
    companyHolidayCalendars,
    calendarsLoading,
  } = useAttendanceDailyListData({
    isAuthenticated: authStatus === "authenticated",
    getEndTime,
  });

  const {
    searchName,
    isSearchVisible,
    filteredAttendanceList,
    handleSearchToggle,
    handleSearchNameChange,
  } = useAttendanceNameSearch(sortedAttendanceList);

  const renderOvertimeValue = useCallback(
    (row: AttendanceDaily) => formatMinutesToHHmm(getOvertimeMinutes(row)),
    [getOvertimeMinutes],
  );

  const renderSummaryMessage = useCallback((attendance: Attendance | null | undefined) => {
    if (!attendance) {
      return "";
    }

    const {
      substituteHolidayDate,
      remarks,
      specialHolidayFlag,
      paidHolidayFlag,
      absentFlag,
    } = attendance;
    const isSubstituteHoliday = substituteHolidayDate
      ? dayjs(substituteHolidayDate).isValid()
      : false;
    const full = (() => {
      const parts: string[] = [];
      if (isSubstituteHoliday) {
        parts.push("振替休日");
      }
      if (remarks) {
        parts.push(remarks);
      }
      return parts.join(" ");
    })();

    const maxLength = 32;
    const needTruncate = full && full.length > maxLength;
    const visible = needTruncate ? `${full.slice(0, maxLength)}...` : full;

    return (
      <Box component="span">
        <Stack direction="row" spacing={0.5} alignItems="center">
          {specialHolidayFlag && <Chip size="small" label="特別休暇" color="info" />}
          {paidHolidayFlag && <Chip size="small" label="有給休暇" color="success" />}
          {absentFlag && <Chip size="small" label="欠勤" color="error" />}
          {needTruncate ? (
            <Tooltip title={full} arrow placement="top">
              <Box component="span" sx={remarksTruncatedBoxSx}>
                {visible}
              </Box>
            </Tooltip>
          ) : (
            <Box component="span" sx={remarksBoxSx}>
              {visible}
            </Box>
          )}
        </Stack>
      </Box>
    );
  }, []);

  const renderAttendanceRow = useCallback(
    (row: AttendanceDaily, key: string) => (
      <TableRow key={key} className="attendance-row">
        <ActionsTableCell
          row={row}
          attendances={attendanceMap[row.sub] ?? []}
          attendanceLoading={!!attendanceLoadingMap[row.sub]}
          attendanceError={attendanceErrorMap[row.sub] ?? null}
          holidayCalendars={holidayCalendars}
          companyHolidayCalendars={companyHolidayCalendars}
          calendarLoading={calendarsLoading}
          targetWorkDate={displayDateFormatted}
        />
        <TableCell sx={col90Sx}>
          <DuplicateAttendanceBadge row={row} duplicateInfoByStaff={duplicateInfoByStaff} />
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
        <TableCell sx={overtimeCellSx}>{renderOvertimeValue(row)}</TableCell>
        <TableCell sx={summaryCellSx}>
          {renderSummaryMessage(getAttendanceForDisplayDate(row))}
        </TableCell>
        <TableCell sx={noWrapCellSx} />
      </TableRow>
    ),
    [
      attendanceErrorMap,
      attendanceLoadingMap,
      attendanceMap,
      calendarsLoading,
      companyHolidayCalendars,
      displayDateFormatted,
      duplicateInfoByStaff,
      getAttendanceForDisplayDate,
      holidayCalendars,
      renderOvertimeValue,
      renderSummaryMessage,
    ],
  );

  return (
    <Stack direction="column" spacing={1}>
      <DuplicateAttendanceManager
        duplicates={mergedDuplicateAttendances}
        staffNameMap={staffNameMap}
      />

      <Box sx={listHeaderBoxSx}>
        <MoveDateItem workDate={dayjs(targetWorkDate || today, AttendanceDate.QueryParamFormat)} />
        <Box sx={searchBoxSx}>
          <AppIconButton
            aria-label="スタッフ名検索を表示"
            onClick={handleSearchToggle}
            size="sm"
          >
            <SearchIcon fontSize="small" />
          </AppIconButton>
          {isSearchVisible && (
            <TextField
              label="スタッフ名で検索"
              variant="outlined"
              size="small"
              value={searchName}
              onChange={handleSearchNameChange}
              sx={searchTextFieldSx}
            />
          )}
        </Box>
      </Box>

      {pendingList.length > 0 && (
        <Box sx={pendingOuterBoxSx}>
          <Box sx={pendingWarningBoxSx}>
            <Typography variant="h6" sx={sectionTitleSx}>
              申請中のスタッフ ({pendingList.length})
            </Typography>
            <Alert severity="warning">
              <AlertTitle sx={alertTitleBoldSx}>確認してください</AlertTitle>
              申請中のスタッフがあります。承認されるまで反映されません
            </Alert>
            <TableContainer sx={tableContainerSx}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={col90Sx}>重複</TableCell>
                    <TableCell className="table-cell-header--staff-name">氏名</TableCell>
                    <TableCell className="table-cell-header--start-time">出勤時刻</TableCell>
                    <TableCell className="table-cell-header--end-time">退勤時刻</TableCell>
                    <TableCell className="table-cell-header--overtime" sx={overtimeCellSx}>
                      残業時間
                    </TableCell>
                    <TableCell sx={summaryCellSx}>摘要</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingList.map((row, index) =>
                    renderAttendanceRow(row, `pending-${row.sub}-${index}`),
                  )}
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
              <TableCell sx={col90Sx}>重複</TableCell>
              <TableCell className="table-cell-header--staff-name">氏名</TableCell>
              <TableCell className="table-cell-header--start-time">出勤時刻</TableCell>
              <TableCell className="table-cell-header--end-time">退勤時刻</TableCell>
              <TableCell className="table-cell-header--overtime" sx={overtimeCellSx}>
                残業時間
              </TableCell>
              <TableCell sx={summaryCellSx}>摘要</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAttendanceList.map((row, index) =>
              renderAttendanceRow(row, `list-${row.sub}-${index}`),
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
