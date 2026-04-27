import { getOperationLogDisplaySummary } from "@entities/operation-log/lib/operationLogDisplay";
import { getOperationLogLabel } from "@entities/operation-log/lib/operationLogLabels";
import fetchOperationLogs from "@entities/operation-log/model/fetchOperationLogs";
import { OperationLogJsonDetails } from "@entities/operation-log/ui/OperationLogJsonDetails";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import { Attendance, OperationLog, Staff } from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import { AttendanceHistoryRow } from "./EditAttendanceHistoryList/AttendanceHistoryRow";

const EMPTY_LOGS: OperationLog[] = [];

type CanonicalLogsState = {
  attendanceId?: string;
  logs: OperationLog[];
  error: string | null;
};

async function loadAttendanceOperationLogs(attendanceId: string) {
  const items: OperationLog[] = [];
  let nextToken: string | null = null;

  do {
    const response = await fetchOperationLogs({
      filter: {
        resourceKey: {
          eq: `attendance#${attendanceId}`,
        },
      },
      limit: 100,
      nextToken,
    });
    items.push(...response.items);
    nextToken = response.nextToken ?? null;
  } while (nextToken);

  return items.toSorted((left, right) => {
    const leftValue = dayjs(left.timestamp ?? left.createdAt).valueOf();
    const rightValue = dayjs(right.timestamp ?? right.createdAt).valueOf();
    return rightValue - leftValue;
  });
}

const resolveStaffLabel = (
  staffMap: Record<string, Staff | null>,
  staffId?: string | null,
) => {
  if (!staffId) {
    return "-";
  }

  if (!(staffId in staffMap)) {
    return "読み込み中...";
  }

  const staff = staffMap[staffId];
  if (!staff) {
    return staffId;
  }

  return `${staff.familyName ?? ""} ${staff.givenName ?? ""}`.trim();
};

export default function AttendanceOperationLogHistory({
  attendance,
}: {
  attendance: Attendance | null | undefined;
}) {
  const [canonicalLogsState, setCanonicalLogsState] = useState<CanonicalLogsState>({
    logs: EMPTY_LOGS,
    error: null,
  });
  const [staffMap, setStaffMap] = useState<Record<string, Staff | null>>({});
  const activeAttendanceId = attendance?.id;
  const isCanonicalLogsCurrent =
    Boolean(activeAttendanceId) && canonicalLogsState.attendanceId === activeAttendanceId;
  const canonicalLogs = useMemo(
    () => (isCanonicalLogsCurrent ? canonicalLogsState.logs : EMPTY_LOGS),
    [canonicalLogsState.logs, isCanonicalLogsCurrent],
  );
  const canonicalLogsLoading = Boolean(activeAttendanceId) && !isCanonicalLogsCurrent;
  const canonicalLogsError = isCanonicalLogsCurrent ? canonicalLogsState.error : null;

  useEffect(() => {
    if (!activeAttendanceId) {
      return;
    }

    let active = true;

    loadAttendanceOperationLogs(activeAttendanceId)
      .then((items) => {
        if (active) {
          setCanonicalLogsState({
            attendanceId: activeAttendanceId,
            logs: items,
            error: null,
          });
        }
      })
      .catch((cause) => {
        if (active) {
          setCanonicalLogsState({
            attendanceId: activeAttendanceId,
            logs: EMPTY_LOGS,
            error: cause instanceof Error ? cause.message : String(cause),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [activeAttendanceId]);

  useEffect(() => {
    const ids = Array.from(
      new Set(
        canonicalLogs
          .flatMap((log) => [log.staffId, log.targetStaffId])
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const missing = ids.filter((id) => !(id in staffMap));
    if (missing.length === 0) {
      return;
    }

    let active = true;

    Promise.allSettled(missing.map((id) => fetchStaff(id))).then((results) => {
      if (!active) {
        return;
      }

      const next: Record<string, Staff | null> = {};
      results.forEach((result, index) => {
        next[missing[index]] =
          result.status === "fulfilled" ? result.value ?? null : null;
      });
      setStaffMap((current) => ({ ...current, ...next }));
    });

    return () => {
      active = false;
    };
  }, [canonicalLogs, staffMap]);

  const legacyHistories = useMemo(
    () =>
      attendance?.histories
        ?.filter((item): item is NonNullable<typeof item> => item !== null)
        .toSorted((left, right) => {
          const leftValue = dayjs(left.createdAt).valueOf();
          const rightValue = dayjs(right.createdAt).valueOf();
          return rightValue - leftValue;
        }) ?? [],
    [attendance?.histories],
  );

  if (canonicalLogsLoading) {
    return <div className="text-sm text-slate-500">履歴を読み込み中です...</div>;
  }

  if (canonicalLogsError) {
    return <div className="text-sm text-rose-600">{canonicalLogsError}</div>;
  }

  if (canonicalLogs.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        {canonicalLogs.map((log) => (
          <article
            key={log.id}
            data-testid="attendance-operation-log-item"
            className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {getOperationLogLabel(log.action)}
              </span>
              <span className="text-sm text-slate-500">
                {dayjs(log.timestamp ?? log.createdAt).format("YYYY/MM/DD HH:mm:ss")}
              </span>
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-900">
              {getOperationLogDisplaySummary(log)}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Actor: {resolveStaffLabel(staffMap, log.staffId)}
            </div>
            <div className="text-sm text-slate-600">
              Target: {resolveStaffLabel(staffMap, log.targetStaffId)}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <OperationLogJsonDetails log={log} />
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (legacyHistories.length > 0) {
    return (
      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[1280px] w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-14 border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500" />
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">勤務日</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">勤務時間</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">直行</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">直帰</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">有給休暇</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">特別休暇</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">振替休日</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">備考</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">作成日時</th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold text-slate-500">スタッフID</th>
            </tr>
          </thead>
          <tbody>
            {legacyHistories.map((history, index) => (
              <AttendanceHistoryRow key={index} history={history} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
      履歴がありません。
    </div>
  );
}
