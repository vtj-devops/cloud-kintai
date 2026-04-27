import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Attendance, AttendanceChangeRequest } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useMemo } from "react";

import ComparisonTableRow from "../shared/ComparisonTableRow";

export type ChangeRequestDiffTableProps = {
  attendance: Attendance;
  changeRequest: AttendanceChangeRequest;
  size?: "small" | "medium";
};

export function ChangeRequestDiffTable({
  attendance,
  changeRequest,
  size = "small",
}: ChangeRequestDiffTableProps) {
  const rows = useMemo(
    () => buildChangeRequestDiffRows(attendance, changeRequest),
    [attendance, changeRequest]
  );

  return (
    <TableContainer>
      <Table size={size} stickyHeader={false}>
        <TableHead>
          <TableRow>
            <TableCell>項目</TableCell>
            <TableCell>現在の値</TableCell>
            <TableCell>申請内容</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <ComparisonTableRow
              key={row.label}
              label={row.label}
              beforeValue={row.current}
              afterValue={row.requested}
              highlightDifference={row.changed}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export type ChangeRequestDiffRow = {
  label: string;
  current: string;
  requested: string;
  changed: boolean;
};

export function buildChangeRequestDiffRows(
  attendance: Attendance,
  changeRequest: AttendanceChangeRequest
): ChangeRequestDiffRow[] {
  const rows: ChangeRequestDiffRow[] = [];

  const workTime = resolveTimeRange(
    attendance.startTime,
    attendance.endTime,
    changeRequest.startTime,
    changeRequest.endTime
  );
  rows.push({
    label: "勤務時間",
    current: workTime.current,
    requested: workTime.requested,
    changed: workTime.changed,
  });

  const restTimes = resolveRestTimes(attendance.rests, changeRequest.rests);
  rows.push({
    label: "休憩時間",
    current: restTimes.current,
    requested: restTimes.requested,
    changed: restTimes.changed,
  });

  rows.push(
    createBooleanRow(
      "直行",
      attendance.goDirectlyFlag,
      changeRequest.goDirectlyFlag
    )
  );
  rows.push(
    createBooleanRow(
      "直帰",
      attendance.returnDirectlyFlag,
      changeRequest.returnDirectlyFlag
    )
  );
  rows.push(
    createBooleanRow(
      "有給",
      attendance.paidHolidayFlag,
      changeRequest.paidHolidayFlag
    )
  );
  rows.push(
    createBooleanRow(
      "特別休暇",
      attendance.specialHolidayFlag,
      changeRequest.specialHolidayFlag
    )
  );
  rows.push(
    createBooleanRow("欠勤", attendance.absentFlag, changeRequest.absentFlag)
  );

  const substituteHoliday = resolveValue(
    formatDate(attendance.substituteHolidayDate),
    changeRequest.substituteHolidayDate
      ? formatDate(changeRequest.substituteHolidayDate)
      : changeRequest.substituteHolidayDate === null
      ? "-"
      : undefined
  );
  rows.push({
    label: "代休取得日",
    current: substituteHoliday.current,
    requested: substituteHoliday.requested,
    changed: substituteHoliday.changed,
  });

  const hourlyPaidHoliday = resolveHourlyPaidHoliday(
    attendance.hourlyPaidHolidayHours,
    attendance.hourlyPaidHolidayTimes,
    changeRequest.hourlyPaidHolidayHours,
    changeRequest.hourlyPaidHolidayTimes
  );
  rows.push({
    label: "時間単位有給",
    current: hourlyPaidHoliday.current,
    requested: hourlyPaidHoliday.requested,
    changed: hourlyPaidHoliday.changed,
  });

  const remarks = resolveValue(
    formatText(attendance.remarks),
    typeof changeRequest.remarks === "undefined"
      ? undefined
      : formatText(changeRequest.remarks)
  );
  rows.push({
    label: "摘要",
    current: remarks.current,
    requested: remarks.requested,
    changed: remarks.changed,
  });

  return rows;
}

function resolveValue(current: string, requested?: string | null) {
  if (typeof requested === "undefined") {
    return { current, requested: current, changed: false };
  }
  const normalizedRequested = requested ?? "-";
  return {
    current,
    requested: normalizedRequested,
    changed: normalizedRequested !== current,
  };
}

function resolveTimeRange(
  currentStart?: string | null,
  currentEnd?: string | null,
  requestedStart?: string | null,
  requestedEnd?: string | null
) {
  const current = formatTimeRange(currentStart, currentEnd);

  const startResolved =
    typeof requestedStart === "undefined"
      ? currentStart
      : cleanupTime(requestedStart);
  const endResolved =
    typeof requestedEnd === "undefined"
      ? currentEnd
      : cleanupTime(requestedEnd);

  const requested = formatTimeRange(startResolved, endResolved);
  return {
    current,
    requested,
    changed:
      requestedStart !== undefined || requestedEnd !== undefined
        ? requested !== current
        : false,
  };
}

function cleanupTime(value?: string | null) {
  if (!value) return null;
  return value;
}

function formatTimeRange(start?: string | null, end?: string | null) {
  const startLabel = formatTime(start);
  const endLabel = formatTime(end);
  if (startLabel === "-" && endLabel === "-") {
    return "-";
  }
  return `${startLabel} ~ ${endLabel}`;
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  const date = dayjs(value);
  if (!date.isValid()) return "-";
  return date.format("HH:mm");
}

function resolveRestTimes(
  currentRests: Attendance["rests"],
  requestedRests?: AttendanceChangeRequest["rests"] | null
) {
  const current = formatRestList(currentRests);
  if (typeof requestedRests === "undefined") {
    return { current, requested: current, changed: false };
  }
  const requested = formatRestList(requestedRests);
  return { current, requested, changed: requested !== current };
}

function formatRestList(rests?: Attendance["rests"] | null) {
  if (!rests || rests.length === 0) return "-";
  const items = rests
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map(
      (rest) => `${formatTime(rest.startTime)} ~ ${formatTime(rest.endTime)}`
    )
    .filter((value) => value.trim() !== "- ~ -");
  if (items.length === 0) return "-";
  return items.join("\n");
}

function createBooleanRow(
  label: string,
  currentValue?: boolean | null,
  requestedValue?: boolean | null
): ChangeRequestDiffRow {
  const current = formatBoolean(currentValue);
  if (typeof requestedValue === "undefined") {
    return { label, current, requested: current, changed: false };
  }
  const requested = formatBoolean(requestedValue);
  return {
    label,
    current,
    requested,
    changed: requested !== current,
  };
}

function formatBoolean(value?: boolean | null) {
  return value ? "あり" : "なし";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format(AttendanceDate.DisplayFormat) : "-";
}

function resolveHourlyPaidHoliday(
  currentHours?: number | null,
  currentTimes?: Attendance["hourlyPaidHolidayTimes"],
  requestedHours?: number | null,
  requestedTimes?: AttendanceChangeRequest["hourlyPaidHolidayTimes"]
) {
  const current = formatHourlyPaidHoliday(currentHours, currentTimes);
  if (
    typeof requestedHours === "undefined" &&
    typeof requestedTimes === "undefined"
  ) {
    return { current, requested: current, changed: false };
  }
  const requested = formatHourlyPaidHoliday(
    typeof requestedHours === "undefined" ? currentHours : requestedHours,
    typeof requestedTimes === "undefined" ? currentTimes : requestedTimes
  );
  return { current, requested, changed: requested !== current };
}

function formatHourlyPaidHoliday(
  hours?: number | null,
  times?: Attendance["hourlyPaidHolidayTimes"] | null
) {
  if (hours && hours > 0) {
    return `${hours}h`;
  }
  if (!times || times.length === 0) return "-";
  const items = times
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map(
      (time) => `${formatTime(time.startTime)} ~ ${formatTime(time.endTime)}`
    );
  return items.length > 0 ? items.join("\n") : "-";
}

function formatText(value?: string | null) {
  if (!value) return "-";
  return value.trim() || "-";
}
