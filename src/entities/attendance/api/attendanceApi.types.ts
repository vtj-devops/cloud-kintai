import type {
  Attendance,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "@shared/api/graphql/types";

export type DuplicateAttendanceInfo = {
  workDate: string;
  ids: string[];
  staffId?: string;
};

export type AttendanceListResponse = {
  attendances: Attendance[];
  warnings?: string[];
  duplicates?: DuplicateAttendanceInfo[];
};

export const ATTENDANCE_DUPLICATE_CONFLICT = "ATTENDANCE_DUPLICATE_CONFLICT";
export const ATTENDANCE_REVISION_CONFLICT = "ATTENDANCE_REVISION_CONFLICT";

export type AttendanceUpsertAction =
  | "clock_in"
  | "clock_out"
  | "go_directly"
  | "return_directly"
  | "rest_start"
  | "rest_end"
  | "manual";

export type AttendanceOperationLogContext = {
  action?: string;
  summary?: string;
  actorStaffId?: string | null;
  targetStaffId?: string | null;
  metadata?: Record<string, unknown>;
  details?: Record<string, unknown>;
};

export type UpsertAttendanceByStaffAndDateInput = {
  input: CreateAttendanceInput;
  action: AttendanceUpsertAction;
  occurredAt: string;
  idempotencyKey: string;
  logContext?: AttendanceOperationLogContext;
};

export type UpsertAttendanceByStaffAndDateMutation = {
  upsertAttendanceByStaffAndDate?: Attendance | null;
};

export type CreateAttendanceMutationArg = CreateAttendanceInput & {
  logContext?: AttendanceOperationLogContext;
};

export type UpdateAttendanceMutationArg = UpdateAttendanceInput & {
  logContext?: AttendanceOperationLogContext;
};

export type DeleteAttendanceMutationArg = {
  id: string;
  logContext?: AttendanceOperationLogContext;
};

export type AttendanceQueryError = {
  message: string;
  details?: unknown;
};

export type AttendanceWriteInputExtras = {
  staffWorkDateKey?: string;
};

export type AttendanceBaseQuery = (arg: {
  document: string;
  variables?: Record<string, unknown>;
  authMode?: string;
}) =>
  | {
      data?: unknown;
      error?: unknown;
    }
  | PromiseLike<{
      data?: unknown;
      error?: unknown;
    }>;
