import { ShiftRequestStatus } from "@shared/api/graphql/types";

import {
  convertHistoryToInput,
  processShiftRequestItems,
  type ShiftRequestHistoryMeta,
  type ShiftRequestRecordSnapshot,
} from "../shiftRequests";

// ----------------------------------------------------------------
// Fixtures
// ----------------------------------------------------------------
type HistoryItem = Parameters<typeof convertHistoryToInput>[0];

const makeHistory = (overrides: Partial<HistoryItem> = {}): HistoryItem =>
  ({
    __typename: "ShiftRequestHistory",
    version: 1,
    note: null,
    entries: [],
    summary: null,
    submittedAt: null,
    updatedAt: "2024-12-20T00:00:00Z",
    recordedAt: "2024-12-20T00:00:00Z",
    recordedByStaffId: "staff001",
    changeReason: null,
    ...overrides,
  }) as HistoryItem;

type ShiftRequestItem = Parameters<typeof processShiftRequestItems>[0][number];

const makeShiftItem = (
  overrides: Partial<ShiftRequestItem> = {}
): ShiftRequestItem =>
  ({
    __typename: "ShiftRequest",
    id: "sr001",
    staffId: "staff001",
    targetMonth: "2024-12",
    version: 1,
    entries: [],
    histories: [],
    note: null,
    submittedAt: null,
    createdAt: "2024-12-01T00:00:00Z",
    updatedAt: "2024-12-01T00:00:00Z",
    ...overrides,
  }) as ShiftRequestItem;

// ----------------------------------------------------------------
// convertHistoryToInput
// ----------------------------------------------------------------
describe("convertHistoryToInput", () => {
  it("基本的なフィールドをマッピングする", () => {
    const history = makeHistory({
      version: 3,
      note: "note-text",
      submittedAt: "2024-12-18T00:00:00Z",
      updatedAt: "2024-12-19T00:00:00Z",
      recordedAt: "2024-12-20T00:00:00Z",
      recordedByStaffId: "staff123",
      changeReason: "manual edit",
    });
    const result = convertHistoryToInput(history);
    expect(result.version).toBe(3);
    expect(result.note).toBe("note-text");
    expect(result.submittedAt).toBe("2024-12-18T00:00:00Z");
    expect(result.updatedAt).toBe("2024-12-19T00:00:00Z");
    expect(result.recordedAt).toBe("2024-12-20T00:00:00Z");
    expect(result.recordedByStaffId).toBe("staff123");
    expect(result.changeReason).toBe("manual edit");
  });

  it("entries が null のフィルタリングされ ShiftRequestDayPreferenceInput に変換される", () => {
    const history = makeHistory({
      entries: [
        null,
        { __typename: "ShiftRequestDayPreference", date: "2024-12-25", status: ShiftRequestStatus.WORK },
        { __typename: "ShiftRequestDayPreference", date: "2024-12-26", status: ShiftRequestStatus.FIXED_OFF },
      ] as HistoryItem["entries"],
    });
    const result = convertHistoryToInput(history);
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0]).toEqual({ date: "2024-12-25", status: ShiftRequestStatus.WORK });
    expect(result.entries[1]).toEqual({ date: "2024-12-26", status: ShiftRequestStatus.FIXED_OFF });
  });

  it("entries が null の場合、空配列を返す", () => {
    const history = makeHistory({ entries: null });
    const result = convertHistoryToInput(history);
    expect(result.entries).toEqual([]);
  });

  it("summary がある場合、workDays/fixedOffDays/requestedOffDays をマッピングする", () => {
    const history = makeHistory({
      summary: {
        __typename: "ShiftRequestSummary",
        workDays: 20,
        fixedOffDays: 5,
        requestedOffDays: 3,
      } as HistoryItem["summary"],
    });
    const result = convertHistoryToInput(history);
    expect(result.summary).toEqual({
      workDays: 20,
      fixedOffDays: 5,
      requestedOffDays: 3,
    });
  });

  it("summary が null の場合、summary は undefined になる", () => {
    const history = makeHistory({ summary: null });
    const result = convertHistoryToInput(history);
    expect(result.summary).toBeUndefined();
  });

  it("recordedAt が null で updatedAt がある場合、updatedAt を recordedAt に使う", () => {
    const history = makeHistory({
      recordedAt: null,
      updatedAt: "2024-12-19T00:00:00Z",
      submittedAt: "2024-12-18T00:00:00Z",
    });
    const result = convertHistoryToInput(history);
    expect(result.recordedAt).toBe("2024-12-19T00:00:00Z");
  });

  it("recordedAt も updatedAt も null で submittedAt がある場合、submittedAt を recordedAt に使う", () => {
    const history = makeHistory({
      recordedAt: null,
      updatedAt: null,
      submittedAt: "2024-12-18T00:00:00Z",
    });
    const result = convertHistoryToInput(history);
    expect(result.recordedAt).toBe("2024-12-18T00:00:00Z");
  });

  it("recordedAt/updatedAt/submittedAt がすべて null の場合、現在時刻 (ISO 文字列) を recordedAt に使う", () => {
    const beforeTest = Date.now();
    const history = makeHistory({
      recordedAt: null,
      updatedAt: null,
      submittedAt: null,
    });
    const result = convertHistoryToInput(history);
    const afterTest = Date.now();
    const resultTime = new Date(result.recordedAt!).getTime();
    expect(resultTime).toBeGreaterThanOrEqual(beforeTest - 100);
    expect(resultTime).toBeLessThanOrEqual(afterTest + 100);
  });

  it("recordedByStaffId が null の場合、undefined になる", () => {
    const history = makeHistory({ recordedByStaffId: null });
    const result = convertHistoryToInput(history);
    expect(result.recordedByStaffId).toBeUndefined();
  });
});

// ----------------------------------------------------------------
// processShiftRequestItems
// ----------------------------------------------------------------
describe("processShiftRequestItems", () => {
  it("空の items を渡すと空の Map を返す", () => {
    const { nextAssignments, nextHistoryMeta, nextRecords } =
      processShiftRequestItems([], new Set(["staff001"]), "2024-12");
    expect(nextAssignments.size).toBe(0);
    expect(nextHistoryMeta.size).toBe(0);
    expect(nextRecords.size).toBe(0);
  });

  it("staffIdSet にないスタッフはスキップされる", () => {
    const items = [makeShiftItem({ staffId: "other-staff" })];
    const { nextAssignments } = processShiftRequestItems(
      items,
      new Set(["staff001"]),
      "2024-12"
    );
    expect(nextAssignments.size).toBe(0);
  });

  it("entries のシフト状態が assignments にマッピングされる", () => {
    const item = makeShiftItem({
      entries: [
        {
          __typename: "ShiftRequestDayPreference",
          date: "2024-12-25",
          status: ShiftRequestStatus.WORK,
        },
        {
          __typename: "ShiftRequestDayPreference",
          date: "2024-12-26",
          status: ShiftRequestStatus.FIXED_OFF,
        },
        null,
      ] as ShiftRequestItem["entries"],
    });
    const { nextAssignments } = processShiftRequestItems(
      [item],
      new Set(["staff001"]),
      "2024-12"
    );
    const assignments = nextAssignments.get("staff001")!;
    expect(assignments["2024-12-25"]).toBe("work");
    expect(assignments["2024-12-26"]).toBe("fixedOff");
  });

  it("histories が historyMeta に集計される", () => {
    const item = makeShiftItem({
      histories: [
        makeHistory({ recordedAt: "2024-12-20T00:00:00Z" }),
        makeHistory({ recordedAt: "2024-12-22T00:00:00Z" }),
        makeHistory({ recordedAt: "2024-12-19T00:00:00Z" }),
      ],
    });
    const { nextHistoryMeta } = processShiftRequestItems(
      [item],
      new Set(["staff001"]),
      "2024-12"
    );
    const meta = nextHistoryMeta.get("staff001") as ShiftRequestHistoryMeta;
    expect(meta.changeCount).toBe(3);
    expect(meta.latestChangeAt).toBe("2024-12-22T00:00:00Z");
  });

  it("histories がすべて recordedAt null の場合、latestChangeAt は null になる", () => {
    const item = makeShiftItem({
      histories: [
        makeHistory({ recordedAt: null }),
        makeHistory({ recordedAt: null }),
      ],
    });
    const { nextHistoryMeta } = processShiftRequestItems(
      [item],
      new Set(["staff001"]),
      "2024-12"
    );
    const meta = nextHistoryMeta.get("staff001") as ShiftRequestHistoryMeta;
    expect(meta.latestChangeAt).toBeNull();
  });

  it("records に ShiftRequestRecordSnapshot が記録される", () => {
    const item = makeShiftItem({
      id: "sr-123",
      version: 5,
      note: "some note",
      submittedAt: "2024-12-15T00:00:00Z",
      targetMonth: "2024-12",
    });
    const { nextRecords } = processShiftRequestItems(
      [item],
      new Set(["staff001"]),
      "2024-12"
    );
    const record = nextRecords.get("staff001") as ShiftRequestRecordSnapshot;
    expect(record.id).toBe("sr-123");
    expect(record.version).toBe(5);
    expect(record.note).toBe("some note");
    expect(record.submittedAt).toBe("2024-12-15T00:00:00Z");
    expect(record.targetMonth).toBe("2024-12");
  });

  it("targetMonth が null の場合、targetMonthKey が使われる", () => {
    const item = makeShiftItem({ targetMonth: null });
    const { nextRecords } = processShiftRequestItems(
      [item],
      new Set(["staff001"]),
      "2024-11"
    );
    const record = nextRecords.get("staff001") as ShiftRequestRecordSnapshot;
    expect(record.targetMonth).toBe("2024-11");
  });

  it("histories が null の場合、空の historyInputs になる", () => {
    const item = makeShiftItem({ histories: null });
    const { nextHistoryMeta, nextRecords } = processShiftRequestItems(
      [item],
      new Set(["staff001"]),
      "2024-12"
    );
    expect(nextHistoryMeta.get("staff001")?.changeCount).toBe(0);
    expect(nextRecords.get("staff001")?.histories).toEqual([]);
  });
});
