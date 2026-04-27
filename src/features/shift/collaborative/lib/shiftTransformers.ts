import type { ShiftRequestLite } from "@entities/shift/api/shiftApi";
import type {
  ModelShiftRequestConditionInput,
  ShiftRequest,
  ShiftRequestDayPreferenceInput,
  ShiftRequestHistoryInput,
  ShiftRequestStatus,
  UpdateShiftRequestInput,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";

import {
  CellChangeRecord,
  ShiftCellData,
  ShiftCellUpdate,
  ShiftDataMap,
  ShiftRequestData,
  ShiftRequestHistoryEntry,
  shiftRequestStatusToShiftState,
  ShiftState,
  shiftStateToShiftRequestStatus,
} from "../types/collaborative.types";

const buildDayKeys = (targetMonth: string) => {
  const start = dayjs(`${targetMonth}-01`);
  const daysInMonth = start.daysInMonth();
  return Array.from({ length: daysInMonth }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );
};

const buildDateString = (targetMonth: string, dayKey: string) =>
  dayjs(`${targetMonth}-${dayKey}`).format("YYYY-MM-DD");

const buildStaffShiftMap = (
  targetMonth: string,
  shiftRequest?: ShiftRequestData,
): Map<string, ShiftCellData> => {
  const dayKeys = buildDayKeys(targetMonth);
  const entryMap = new Map(
    (shiftRequest?.entries ?? []).map((entry) => [
      dayjs(entry.date).format("DD"),
      entry,
    ]),
  );

  const map = new Map<string, ShiftCellData>();
  dayKeys.forEach((dayKey) => {
    const entry = entryMap.get(dayKey);
    const state = entry
      ? shiftRequestStatusToShiftState(entry.status)
      : "empty";

    map.set(dayKey, {
      state,
      isLocked: entry?.isLocked ?? false,
      lastChangedBy: shiftRequest?.updatedBy ?? undefined,
      lastChangedAt: shiftRequest?.updatedAt ?? undefined,
      version: shiftRequest?.version ?? undefined,
    });
  });

  if (!map.size) {
    map.set("01", {
      state: "empty",
      isLocked: false,
      lastChangedBy: shiftRequest?.updatedBy ?? undefined,
      lastChangedAt: shiftRequest?.updatedAt ?? undefined,
      version: shiftRequest?.version ?? undefined,
    });
  }

  return map;
};

export const normalizeShiftRequest = (
  shiftRequest: ShiftRequestLite | ShiftRequest,
): ShiftRequestData => {
  const entries: ShiftRequestData["entries"] = [];

  (shiftRequest.entries ?? []).forEach((entry) => {
    if (!entry) {
      return;
    }

    entries.push({
      date: entry.date,
      status: entry.status,
      isLocked: entry.isLocked ?? false,
    });
  });

  const comments = (
    shiftRequest as {
      comments?: Array<{
        id: string;
        cellKey: string;
        staffId: string;
        authorName?: string | null;
        body: string;
        createdAt: string;
      } | null> | null;
    }
  ).comments;

  const rawHistories = (shiftRequest as ShiftRequestLite).histories;

  const histories: ShiftRequestHistoryEntry[] | undefined = rawHistories
    ?.filter((h): h is NonNullable<typeof h> => h !== null)
    .map((h) => ({
      version: h.version,
      recordedAt: h.recordedAt,
      recordedByStaffId: h.recordedByStaffId ?? undefined,
      entries: h.entries
        ?.filter((e): e is NonNullable<typeof e> => e !== null)
        .map((e) => ({
          date: e.date,
          status: e.status as ShiftRequestStatus,
          isLocked: e.isLocked ?? undefined,
        })),
    }));

  return {
    id: shiftRequest.id,
    staffId: shiftRequest.staffId,
    targetMonth: shiftRequest.targetMonth,
    entries,
    comments: comments
      ?.filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => ({
        id: c.id,
        cellKey: c.cellKey,
        staffId: c.staffId,
        authorName: c.authorName ?? undefined,
        body: c.body,
        createdAt: c.createdAt,
      })),
    histories,
    updatedAt: shiftRequest.updatedAt ?? undefined,
    updatedBy: shiftRequest.updatedBy ?? undefined,
    version: shiftRequest.version ?? undefined,
  };
};

export const transformShiftRequestToShiftDataMap = ({
  shiftRequests,
  staffIds,
  targetMonth,
}: {
  shiftRequests: ShiftRequestData[];
  staffIds: string[];
  targetMonth: string;
}): ShiftDataMap => {
  const shiftRequestMap = new Map(
    shiftRequests.map((shiftRequest) => [shiftRequest.staffId, shiftRequest]),
  );
  const map: ShiftDataMap = new Map();

  staffIds.forEach((staffId) => {
    const shiftRequest = shiftRequestMap.get(staffId);
    map.set(staffId, buildStaffShiftMap(targetMonth, shiftRequest));
  });

  return map;
};

export const applyShiftRequestToShiftDataMap = ({
  shiftDataMap,
  shiftRequest,
  targetMonth,
}: {
  shiftDataMap: ShiftDataMap;
  shiftRequest: ShiftRequestData;
  targetMonth: string;
}): ShiftDataMap => {
  const nextMap = new Map(shiftDataMap);
  nextMap.set(
    shiftRequest.staffId,
    buildStaffShiftMap(targetMonth, shiftRequest),
  );
  return nextMap;
};

export const applyShiftCellUpdateToMap = ({
  shiftDataMap,
  update,
  currentUserId,
}: {
  shiftDataMap: ShiftDataMap;
  update: ShiftCellUpdate;
  currentUserId: string;
}): ShiftDataMap => {
  const nextMap = new Map(shiftDataMap);
  const staffData = new Map(nextMap.get(update.staffId) ?? []);
  const cell = staffData.get(update.date) ?? {
    state: "empty" as ShiftState,
    isLocked: false,
  };

  const nextState = update.newState ?? cell.state;
  const nextLocked =
    update.isLocked !== undefined ? update.isLocked : cell.isLocked;

  staffData.set(update.date, {
    ...cell,
    state: nextState,
    isLocked: nextLocked,
    lastChangedBy: currentUserId,
    lastChangedAt: new Date().toISOString(),
  });

  nextMap.set(update.staffId, staffData);
  return nextMap;
};

export const transformShiftCellUpdateToGraphQLInput = ({
  shiftRequest,
  shiftDataMap,
  targetMonth,
  updatedBy,
}: {
  shiftRequest: ShiftRequestData;
  shiftDataMap: ShiftDataMap;
  targetMonth: string;
  updatedBy: string;
}): {
  input: UpdateShiftRequestInput;
  condition?: ModelShiftRequestConditionInput;
} => {
  const staffData = shiftDataMap.get(shiftRequest.staffId) ?? new Map();
  const entries: ShiftRequestDayPreferenceInput[] = [];

  staffData.forEach((cell, dayKey) => {
    const status = shiftStateToShiftRequestStatus(cell.state);
    if (!status) {
      return;
    }

    entries.push({
      date: buildDateString(targetMonth, dayKey),
      status,
      isLocked: cell.isLocked,
    });
  });

  const sortedEntries = entries.toSorted((a, b) =>
    a.date.localeCompare(b.date),
  );

  const timestamp = new Date().toISOString();
  const baseHistories: ShiftRequestHistoryInput[] = (
    shiftRequest.histories ?? []
  ).map((history) => ({
    version: history.version,
    entries: (history.entries ?? []).map((entry) => ({
      date: entry.date,
      status: entry.status,
      isLocked: entry.isLocked,
    })),
    recordedAt: history.recordedAt,
    recordedByStaffId: history.recordedByStaffId,
  }));
  const maxHistoryVersion = baseHistories.reduce(
    (acc, history) => Math.max(acc, history.version ?? 0),
    0,
  );
  const historySnapshot: ShiftRequestHistoryInput = {
    version: maxHistoryVersion + 1,
    entries: sortedEntries,
    recordedAt: timestamp,
    recordedByStaffId: updatedBy,
  };
  const nextHistories = [...baseHistories, historySnapshot];

  const expectedVersion = shiftRequest.version ?? null;
  const nextVersion =
    expectedVersion !== null ? expectedVersion + 1 : undefined;

  return {
    input: {
      id: shiftRequest.id,
      staffId: shiftRequest.staffId,
      targetMonth,
      entries: sortedEntries,
      histories: nextHistories,
      updatedBy,
      updatedAt: timestamp,
      version: nextVersion,
    },
    condition:
      expectedVersion !== null
        ? {
            version: { eq: expectedVersion },
          }
        : undefined,
  };
};

const createRecordId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * ShiftRequestHistory スナップショット配列をセル単位の CellChangeRecord[] に変換する。
 *
 * histories は「新しい順（先頭が最新）」で格納されている前提。
 * 連続するスナップショットを差分比較し、変化があったセルのみレコードを生成する。
 */
export function deriveHistoryCellChanges(
  staffId: string,
  histories: ShiftRequestHistoryEntry[],
  getStaffName: (staffId: string) => string,
): CellChangeRecord[] {
  if (histories.length === 0) return [];

  // 古い順にソート（recordedAt の昇順）
  const sorted = histories.toSorted(
    (a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt),
  );

  const records: CellChangeRecord[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];

    const currentEntryMap = new Map(
      (current.entries ?? []).map((e) => [dayjs(e.date).format("DD"), e]),
    );
    const prevEntryMap = new Map(
      (prev?.entries ?? []).map((e) => [dayjs(e.date).format("DD"), e]),
    );

    const allDates = new Set([
      ...currentEntryMap.keys(),
      ...prevEntryMap.keys(),
    ]);

    const changedAt = Date.parse(current.recordedAt);
    const changedBy = current.recordedByStaffId ?? "unknown";
    const changedByName = current.recordedByStaffId
      ? getStaffName(current.recordedByStaffId)
      : "不明";

    for (const date of allDates) {
      const currentEntry = currentEntryMap.get(date);
      const prevEntry = prevEntryMap.get(date);

      const newState = currentEntry
        ? shiftRequestStatusToShiftState(currentEntry.status)
        : "empty";
      const previousState = prevEntry
        ? shiftRequestStatusToShiftState(prevEntry.status)
        : i === 0
          ? undefined // 最古スナップショットは「変更前不明」
          : "empty";
      const newLocked = currentEntry?.isLocked;
      const previousLocked = prevEntry?.isLocked;

      const stateChanged = newState !== previousState;
      const lockChanged =
        newLocked !== undefined &&
        previousLocked !== undefined &&
        newLocked !== previousLocked;

      if (!stateChanged && !lockChanged) continue;

      const cellKey = `${staffId}#${date}`;
      records.push({
        id: createRecordId(),
        cellKey,
        staffId,
        date,
        previousState,
        newState,
        previousLocked,
        newLocked,
        changedBy,
        changedByName,
        changedAt,
        source: "db-history",
      });
    }
  }

  return records;
}
