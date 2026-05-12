import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import {
  createAttendance,
  updateAttendance,
} from "@shared/api/graphql/documents/mutations";
import { attendancesByStaffId } from "@shared/api/graphql/documents/queries";
import { executePaginatedQuery } from "@shared/api/graphql/paginatedQuery";
import type {
  Attendance,
  AttendanceHistoryInput,
  AttendancesByStaffIdQuery,
  CreateAttendanceInput,
  HourlyPaidHolidayTimeInput,
  RestInput,
  UpdateAttendanceInput,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";

import { E02004 } from "@/errors";

import {
  ATTENDANCE_DUPLICATE_CONFLICT,
  ATTENDANCE_REVISION_CONFLICT,
  type AttendanceBaseQuery,
  type AttendanceQueryError,
  type AttendanceUpsertAction,
  type AttendanceWriteInputExtras,
} from "./attendanceApi.types";

const nonNullable = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const sanitizeRests = (
  rests?: Array<{
    startTime?: string | null;
    endTime?: string | null;
  } | null> | null,
): RestInput[] =>
  rests?.filter(nonNullable).map(({ startTime, endTime }) => ({
    startTime: startTime ?? undefined,
    endTime: endTime ?? undefined,
  })) ?? [];

export const sanitizeHourlyPaidHolidayTimes = (
  hourlyTimes?: Array<{
    startTime?: string | null;
    endTime?: string | null;
  } | null> | null,
): HourlyPaidHolidayTimeInput[] =>
  hourlyTimes
    ?.filter(nonNullable)
    .reduce<HourlyPaidHolidayTimeInput[]>((acc, { startTime, endTime }) => {
      if (startTime && endTime) {
        acc.push({ startTime, endTime });
      }

      return acc;
    }, []) ?? [];

export const buildAttendanceHistoryInput = (
  attendance: Attendance,
  createdAt: string,
): AttendanceHistoryInput => ({
  staffId: attendance.staffId,
  workDate: attendance.workDate,
  startTime: attendance.startTime,
  endTime: attendance.endTime,
  goDirectlyFlag: attendance.goDirectlyFlag,
  absentFlag: attendance.absentFlag,
  returnDirectlyFlag: attendance.returnDirectlyFlag,
  rests: sanitizeRests(attendance.rests ?? []),
  hourlyPaidHolidayTimes: sanitizeHourlyPaidHolidayTimes(
    attendance.hourlyPaidHolidayTimes ?? [],
  ),
  remarks: attendance.remarks,
  paidHolidayFlag: attendance.paidHolidayFlag,
  specialHolidayFlag: attendance.specialHolidayFlag,
  hourlyPaidHolidayHours: attendance.hourlyPaidHolidayHours,
  substituteHolidayDate: attendance.substituteHolidayDate,
  createdAt,
});

export const buildAttendanceForList = (
  targetDate: string,
  matchAttendance?: Attendance | null,
): Attendance => ({
  __typename: "Attendance",
  id: matchAttendance?.id ?? "",
  staffId: matchAttendance?.staffId ?? "",
  workDate: targetDate,
  startTime: matchAttendance?.startTime ?? "",
  endTime: matchAttendance?.endTime ?? "",
  absentFlag: matchAttendance?.absentFlag ?? false,
  goDirectlyFlag: matchAttendance?.goDirectlyFlag ?? false,
  returnDirectlyFlag: matchAttendance?.returnDirectlyFlag ?? false,
  rests: matchAttendance?.rests ?? [],
  remarks: matchAttendance?.remarks ?? "",
  paidHolidayFlag: matchAttendance?.paidHolidayFlag ?? false,
  specialHolidayFlag: matchAttendance?.specialHolidayFlag ?? false,
  isDeemedHoliday: matchAttendance?.isDeemedHoliday ?? false,
  substituteHolidayDate: matchAttendance?.substituteHolidayDate,
  changeRequests: matchAttendance?.changeRequests
    ? matchAttendance.changeRequests.filter(nonNullable)
    : [],
  createdAt: matchAttendance?.createdAt ?? "",
  updatedAt: matchAttendance?.updatedAt ?? "",
});

export const buildDateListForRange = (
  startDate: string,
  endDate: string,
): string[] => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid() || start.isAfter(end, "day")) {
    return [];
  }

  const dateList: string[] = [];
  let current = start.startOf("day");

  while (!current.isAfter(end, "day")) {
    dateList.push(current.format(AttendanceDate.DataFormat));
    current = current.add(1, "day");
  }

  return dateList;
};

export const buildAttendanceCacheId = (staffId: string, workDate: string) =>
  `${staffId}:${workDate}`;

export const buildAttendanceRecordId = (staffId: string, workDate: string) =>
  `attendance#${staffId}#${workDate}`;

export const buildStaffWorkDateKey = (staffId: string, workDate: string) =>
  `${staffId}#${workDate}`;

const collectErrorMessages = (value: unknown): string[] => {
  if (!value || typeof value !== "object") {
    return [];
  }

  const messages: string[] = [];
  const record = value as {
    message?: unknown;
    errors?: unknown;
    details?: unknown;
  };

  if (typeof record.message === "string" && record.message.length > 0) {
    messages.push(record.message);
  }

  if (Array.isArray(record.errors)) {
    record.errors.forEach((item) => {
      if (
        item &&
        typeof item === "object" &&
        "message" in item &&
        typeof (item as { message?: unknown }).message === "string"
      ) {
        messages.push((item as { message: string }).message);
      } else if (typeof item === "string") {
        messages.push(item);
      }
    });
  }

  if (record.details) {
    if (typeof record.details === "string") {
      messages.push(record.details);
    } else if (typeof record.details === "object") {
      messages.push(...collectErrorMessages(record.details));
    }
  }

  return messages;
};

export const extractErrorText = (error: unknown) => {
  const messages = new Set<string>();
  if (error instanceof Error && error.message) {
    messages.add(error.message);
  }

  collectErrorMessages(error).forEach((message) => {
    if (message) {
      messages.add(message);
    }
  });

  return Array.from(messages).join(" ");
};

const UPSERT_SCHEMA_UNSUPPORTED_PATTERNS = [
  "Cannot query field",
  "FieldUndefined",
  "Unknown type",
  "UnknownType",
  "Validation error",
  "upsertAttendanceByStaffAndDate",
  "UpsertAttendanceByStaffAndDateInput",
  "No resolver",
  "Resolver not found",
  "Cannot return null for non-nullable type",
];

export const canFallbackToClientUpsert = (error: unknown) => {
  const serverErrorText = extractErrorText(error);
  return UPSERT_SCHEMA_UNSUPPORTED_PATTERNS.some((pattern) =>
    serverErrorText.includes(pattern),
  );
};

const ATTENDANCE_WRITE_INPUT_UNKNOWN_FIELD_PATTERNS = [
  "contains a field not in 'CreateAttendanceInput'",
  "contains field not in CreateAttendanceInput",
  "not defined for input object type 'CreateAttendanceInput'",
  "contains a field not in 'UpdateAttendanceInput'",
  "contains field not in UpdateAttendanceInput",
  "not defined for input object type 'UpdateAttendanceInput'",
  "contains a field that is not defined for input object type",
  "staffWorkDateKey",
  "Unknown field",
  "FieldUndefined",
  "Validation error of type UndefinedField",
];

const isUnknownAttendanceWriteFieldError = (error: unknown) => {
  const message = extractErrorText(error).toLowerCase();
  return ATTENDANCE_WRITE_INPUT_UNKNOWN_FIELD_PATTERNS.some((pattern) =>
    message.includes(pattern.toLowerCase()),
  );
};

const stripStaffWorkDateKey = <T extends Record<string, unknown>>(
  input: T,
): T => {
  if (!Object.prototype.hasOwnProperty.call(input, "staffWorkDateKey")) {
    return input;
  }

  const { staffWorkDateKey: _ignored, ...rest } = input as T & {
    staffWorkDateKey?: unknown;
  };
  return rest as T;
};

export const runCreateAttendanceMutation = async (
  baseQuery: AttendanceBaseQuery,
  input: CreateAttendanceInput & AttendanceWriteInputExtras,
) => {
  const result = await baseQuery({
    document: createAttendance,
    variables: { input },
  });

  if (!result.error || !isUnknownAttendanceWriteFieldError(result.error)) {
    return result;
  }

  return baseQuery({
    document: createAttendance,
    variables: { input: stripStaffWorkDateKey(input) },
  });
};

export const runUpdateAttendanceMutation = async (
  baseQuery: AttendanceBaseQuery,
  input: UpdateAttendanceInput & AttendanceWriteInputExtras,
  condition?: Record<string, unknown>,
) => {
  const result = await baseQuery({
    document: updateAttendance,
    variables: {
      input,
      condition,
    },
  });

  if (!result.error || !isUnknownAttendanceWriteFieldError(result.error)) {
    return result;
  }

  return baseQuery({
    document: updateAttendance,
    variables: {
      input: stripStaffWorkDateKey(input),
      condition,
    },
  });
};

export const buildDuplicateConflictError = (
  staffId: string,
  workDate: string,
  ids: string[],
) => ({
  message: E02004,
  details: {
    code: ATTENDANCE_DUPLICATE_CONFLICT,
    staffId,
    workDate,
    ids,
  },
});

export const buildRevisionConflictError = (
  attendanceId: string,
  revision: number,
) => ({
  message: "Attendance revision conflict",
  details: {
    code: ATTENDANCE_REVISION_CONFLICT,
    attendanceId,
    revision,
  },
});

export const fetchAttendancesByStaffDate = async (
  baseQuery: AttendanceBaseQuery,
  staffId: string,
  workDate: string,
) => {
  const result = await executePaginatedQuery<Attendance>({
    baseQuery,
    document: attendancesByStaffId,
    variables: { staffId, workDate: { eq: workDate } },
    connectionExtractor: (data) =>
      (data as AttendancesByStaffIdQuery | null)?.attendancesByStaffId,
    errorMessage: "Failed to fetch attendance",
  });

  if (result.error) {
    return {
      error: result.error as AttendanceQueryError,
      attendances: [] as Attendance[],
    };
  }

  return { attendances: result.data };
};

export const resolveAttendanceLogAction = (
  defaultAction: string,
  override?: string,
) => override ?? defaultAction;

export const mapUpsertActionToLogAction = (action: AttendanceUpsertAction) => {
  switch (action) {
    case "clock_in":
      return "attendance.clock_in";
    case "clock_out":
      return "attendance.clock_out";
    case "go_directly":
      return "attendance.go_directly";
    case "return_directly":
      return "attendance.return_directly";
    case "rest_start":
      return "attendance.rest_start";
    case "rest_end":
      return "attendance.rest_end";
    case "manual":
    default:
      return "attendance.update";
  }
};
