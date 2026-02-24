import {
  ListShiftRequestsQuery,
  ShiftRequestDayPreferenceInput,
  ShiftRequestHistoryInput,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";

export type ShiftRequestRecordSnapshot = {
  id: string | null;
  version?: number;
  histories: ShiftRequestHistoryInput[];
  note?: string | null;
  submittedAt?: string | null;
  targetMonth: string;
};

export type ShiftRequestHistoryMeta = {
  changeCount: number;
  latestChangeAt: string | null;
};

type ListShiftRequestItem = NonNullable<
  NonNullable<
    NonNullable<ListShiftRequestsQuery["listShiftRequests"]>["items"]
  >[number]
>;

type ListShiftRequestHistoryItem = NonNullable<
  NonNullable<ListShiftRequestItem["histories"]>[number]
>;

export const convertHistoryToInput = (
  history: ListShiftRequestHistoryItem,
): ShiftRequestHistoryInput => ({
  version: history.version,
  note: history.note ?? undefined,
  entries:
    history.entries
      ?.filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .map<ShiftRequestDayPreferenceInput>((entry) => ({
        date: entry.date,
        status: entry.status,
      })) ?? [],
  summary: history.summary
    ? {
        workDays: history.summary.workDays ?? undefined,
        fixedOffDays: history.summary.fixedOffDays ?? undefined,
        requestedOffDays: history.summary.requestedOffDays ?? undefined,
      }
    : undefined,
  submittedAt: history.submittedAt ?? undefined,
  updatedAt: history.updatedAt ?? undefined,
  recordedAt:
    history.recordedAt ??
    history.updatedAt ??
    history.submittedAt ??
    dayjs().toISOString(),
  recordedByStaffId: history.recordedByStaffId ?? undefined,
  changeReason: history.changeReason ?? undefined,
});
