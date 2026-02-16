import type { ShiftRequestLite } from "@entities/shift/api/shiftApi";
import type {
  ModelShiftRequestConditionInput,
  ShiftRequest,
  ShiftRequestDayPreferenceInput,
  UpdateShiftRequestInput,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";

import {
  ShiftCellData,
  ShiftCellUpdate,
  ShiftDataMap,
  ShiftRequestData,
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

  return {
    id: shiftRequest.id,
    staffId: shiftRequest.staffId,
    targetMonth: shiftRequest.targetMonth,
    entries,
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

  const expectedVersion = shiftRequest.version ?? null;
  const nextVersion =
    expectedVersion !== null ? expectedVersion + 1 : undefined;

  return {
    input: {
      id: shiftRequest.id,
      staffId: shiftRequest.staffId,
      targetMonth,
      entries: sortedEntries,
      updatedBy,
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
