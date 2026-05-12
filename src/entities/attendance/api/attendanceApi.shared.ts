import { logOperationEvent } from "@entities/operation-log/model/canonicalOperationLog";
import type { Attendance } from "@shared/api/graphql/types";

import { E02004 } from "@/errors";

import { resolveAttendanceLogAction } from "./attendanceApi.helpers";
import {
  ATTENDANCE_DUPLICATE_CONFLICT,
  type AttendanceOperationLogContext,
  type DuplicateAttendanceInfo,
} from "./attendanceApi.types";

export const nonNullable = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

// 重複データ警告を通知するカスタムイベント
export const dispatchDuplicateWarning = (message: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("attendance-duplicate-warning", {
        detail: { message },
      }),
    );
  }
};

export const collectAttendancesByWorkDate = (
  staffId: string,
  attendances: Attendance[],
) => {
  const attendanceMap = new Map<string, Attendance[]>();
  const duplicateDetails: DuplicateAttendanceInfo[] = [];

  attendances.forEach((attendance) => {
    const existing = attendanceMap.get(attendance.workDate) ?? [];
    existing.push(attendance);
    attendanceMap.set(attendance.workDate, existing);
  });

  for (const attendancesForDate of attendanceMap.values()) {
    if (attendancesForDate.length > 1) {
      duplicateDetails.push({
        workDate: attendancesForDate[0]?.workDate ?? "",
        ids: attendancesForDate.map((attendance) => attendance.id).filter(Boolean),
        staffId,
      });
      dispatchDuplicateWarning(E02004);
    }
  }

  return { attendanceMap, duplicateDetails };
};

export const buildDuplicateDetailsError = (
  staffId: string,
  duplicates: DuplicateAttendanceInfo[],
) => ({
  message: E02004,
  details: {
    code: ATTENDANCE_DUPLICATE_CONFLICT,
    staffId,
    duplicates,
  },
});

export const writeAttendanceOperationLog = async ({
  action,
  attendance,
  before,
  logContext,
  metadata,
}: {
  action: string;
  attendance: Attendance;
  before?: Attendance | null;
  logContext?: AttendanceOperationLogContext;
  metadata?: Record<string, unknown>;
}) => {
  await logOperationEvent({
    action: resolveAttendanceLogAction(action, logContext?.action),
    resource: "attendance",
    resourceId: attendance.id,
    actorStaffId: logContext?.actorStaffId ?? undefined,
    targetStaffId: logContext?.targetStaffId ?? attendance.staffId ?? undefined,
    summary: logContext?.summary,
    before: before ?? null,
    after: attendance,
    details: {
      workDate: attendance.workDate,
      staffId: attendance.staffId,
      ...logContext?.details,
    },
    metadata: {
      workDate: attendance.workDate,
      staffId: attendance.staffId,
      ...metadata,
      ...logContext?.metadata,
    },
    resolvedWorkDate: attendance.workDate,
  });
};