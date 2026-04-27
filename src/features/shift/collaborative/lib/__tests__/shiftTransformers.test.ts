import { ShiftRequestStatus } from "@shared/api/graphql/types";

import type {
  ShiftDataMap,
  ShiftRequestData,
} from "../../types/collaborative.types";
import {
  applyShiftCellUpdateToMap,
  applyShiftRequestToShiftDataMap,
  deriveHistoryCellChanges,
  normalizeShiftRequest,
  transformShiftCellUpdateToGraphQLInput,
  transformShiftRequestToShiftDataMap,
} from "../shiftTransformers";

describe("shiftTransformers", () => {
  const targetMonth = "2026-02";

  it("transformShiftRequestToShiftDataMapは入力を日別マップに変換する", () => {
    const shiftRequests: ShiftRequestData[] = [
      {
        id: "req-1",
        staffId: "staff-1",
        targetMonth,
        entries: [{ date: "2026-02-01", status: ShiftRequestStatus.WORK }],
        updatedAt: "2026-02-01T10:00:00Z",
        updatedBy: "admin",
        version: 2,
      },
    ];

    const map = transformShiftRequestToShiftDataMap({
      shiftRequests,
      staffIds: ["staff-1"],
      targetMonth,
    });

    const staffMap = map.get("staff-1");
    expect(staffMap?.get("01")?.state).toBe("work");
    expect(staffMap?.get("02")?.state).toBe("empty");
    expect(staffMap?.get("01")?.lastChangedBy).toBe("admin");
  });

  it("transformShiftCellUpdateToGraphQLInputは更新入力を組み立てる", () => {
    const shiftRequest: ShiftRequestData = {
      id: "req-1",
      staffId: "staff-1",
      targetMonth,
      entries: [{ date: "2026-02-01", status: ShiftRequestStatus.WORK }],
      updatedAt: "2026-02-01T10:00:00Z",
      updatedBy: "admin",
      version: 2,
      histories: [
        {
          version: 1,
          recordedAt: "2026-02-01T09:00:00Z",
          recordedByStaffId: "admin",
          entries: [
            {
              date: "2026-02-01",
              status: ShiftRequestStatus.WORK,
              isLocked: false,
            },
          ],
        },
      ],
    };

    const shiftDataMap: ShiftDataMap = new Map([
      [
        "staff-1",
        new Map([
          ["01", { state: "work", isLocked: false }],
          ["02", { state: "empty", isLocked: false }],
        ]),
      ],
    ]);

    const payload = transformShiftCellUpdateToGraphQLInput({
      shiftRequest,
      shiftDataMap,
      targetMonth,
      updatedBy: "admin",
    });

    expect(payload.input.entries).toEqual([
      { date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: false },
    ]);
    expect(payload.input.histories).toHaveLength(2);
    expect(payload.input.histories?.[1]).toMatchObject({
      version: 2,
      recordedByStaffId: "admin",
      entries: [
        {
          date: "2026-02-01",
          status: ShiftRequestStatus.WORK,
          isLocked: false,
        },
      ],
    });
    expect(payload.input.histories?.[1]?.recordedAt).toEqual(
      expect.any(String),
    );
    expect(payload.input.version).toBe(3);
    expect(payload.condition).toEqual({ version: { eq: 2 } });
  });
});

describe("normalizeShiftRequest", () => {
  it("normalizes entries, filtering null entries", () => {
    const raw = {
      id: "req-1",
      staffId: "staff-1",
      targetMonth: "2026-02",
      entries: [
        null,
        { date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: true },
        { date: "2026-02-02", status: ShiftRequestStatus.FIXED_OFF, isLocked: null },
      ],
      comments: null,
      histories: null,
      updatedAt: "2026-02-01T00:00:00Z",
      updatedBy: "admin",
      version: 1,
    };

    const result = normalizeShiftRequest(raw as Parameters<typeof normalizeShiftRequest>[0]);

    expect(result.entries).toHaveLength(2);
    expect(result.entries![0]).toEqual({ date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: true });
    expect(result.entries![1].isLocked).toBe(false);
    expect(result.comments).toBeUndefined();
    expect(result.histories).toBeUndefined();
  });

  it("normalizes comments and filters nulls", () => {
    const raw = {
      id: "req-1",
      staffId: "staff-1",
      targetMonth: "2026-02",
      entries: [],
      comments: [
        null,
        { id: "c1", cellKey: "staff-1#01", staffId: "staff-1", authorName: "田中", body: "コメント", createdAt: "2026-02-01T00:00:00Z" },
        { id: "c2", cellKey: "staff-1#02", staffId: "staff-1", authorName: null, body: "別コメント", createdAt: "2026-02-02T00:00:00Z" },
      ],
      updatedAt: null,
      updatedBy: null,
      version: null,
    };

    const result = normalizeShiftRequest(raw as Parameters<typeof normalizeShiftRequest>[0]);

    expect(result.comments).toHaveLength(2);
    expect(result.comments?.[0].authorName).toBe("田中");
    expect(result.comments?.[1].authorName).toBeUndefined();
  });

  it("normalizes histories with entries", () => {
    const raw = {
      id: "req-2",
      staffId: "staff-2",
      targetMonth: "2026-02",
      entries: [],
      histories: [
        null,
        {
          version: 1,
          recordedAt: "2026-02-01T00:00:00Z",
          recordedByStaffId: "admin",
          entries: [
            null,
            { date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: true },
          ],
        },
      ],
      updatedAt: null,
      updatedBy: null,
      version: null,
    };

    const result = normalizeShiftRequest(raw as Parameters<typeof normalizeShiftRequest>[0]);

    expect(result.histories).toHaveLength(1);
    expect(result.histories?.[0].version).toBe(1);
    expect(result.histories?.[0].entries).toHaveLength(1);
    expect(result.histories?.[0].entries?.[0].isLocked).toBe(true);
  });
});

describe("applyShiftRequestToShiftDataMap", () => {
  it("applies updated shiftRequest to existing map", () => {
    const targetMonth = "2026-02";
    const shiftRequest: ShiftRequestData = {
      id: "req-1",
      staffId: "staff-1",
      targetMonth,
      entries: [{ date: "2026-02-05", status: ShiftRequestStatus.FIXED_OFF }],
    };

    const initialMap: ShiftDataMap = new Map([
      ["staff-1", new Map([["05", { state: "work", isLocked: false }]])],
    ]);

    const result = applyShiftRequestToShiftDataMap({
      shiftDataMap: initialMap,
      shiftRequest,
      targetMonth,
    });

    expect(result.get("staff-1")?.get("05")?.state).toBe("fixedOff");
  });
});

describe("applyShiftCellUpdateToMap", () => {
  it("updates a single cell in the map", () => {
    const shiftDataMap: ShiftDataMap = new Map([
      ["staff-1", new Map([["05", { state: "work", isLocked: false }]])],
    ]);

    const result = applyShiftCellUpdateToMap({
      shiftDataMap,
      update: {
        staffId: "staff-1",
        date: "05",
        newState: "fixedOff",
        isLocked: false,
      },
      currentUserId: "user-1",
    });

    expect(result.get("staff-1")?.get("05")?.state).toBe("fixedOff");
    expect(result.get("staff-1")?.get("05")?.lastChangedBy).toBe("user-1");
  });

  it("creates new cell when not previously present", () => {
    const shiftDataMap: ShiftDataMap = new Map([
      ["staff-1", new Map()],
    ]);

    const result = applyShiftCellUpdateToMap({
      shiftDataMap,
      update: {
        staffId: "staff-1",
        date: "10",
        newState: "work",
      },
      currentUserId: "user-2",
    });

    expect(result.get("staff-1")?.get("10")?.state).toBe("work");
    expect(result.get("staff-1")?.get("10")?.lastChangedBy).toBe("user-2");
  });

  it("preserves existing state when newState is undefined", () => {
    const shiftDataMap: ShiftDataMap = new Map([
      ["staff-1", new Map([["03", { state: "work", isLocked: false }]])],
    ]);

    const result = applyShiftCellUpdateToMap({
      shiftDataMap,
      update: {
        staffId: "staff-1",
        date: "03",
        isLocked: true,
      },
      currentUserId: "user-1",
    });

    expect(result.get("staff-1")?.get("03")?.state).toBe("work");
    expect(result.get("staff-1")?.get("03")?.isLocked).toBe(true);
  });
});

describe("deriveHistoryCellChanges", () => {
  const staffId = "staff-1";
  const getStaffName = (id: string) => `Name(${id})`;

  it("returns empty array when histories is empty", () => {
    const result = deriveHistoryCellChanges(staffId, [], getStaffName);
    expect(result).toEqual([]);
  });

  it("records changes between consecutive snapshots", () => {
    const histories = [
      {
        version: 1,
        recordedAt: "2026-02-01T10:00:00Z",
        recordedByStaffId: "admin",
        entries: [
          { date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: false },
        ],
      },
      {
        version: 2,
        recordedAt: "2026-02-02T10:00:00Z",
        recordedByStaffId: "admin",
        entries: [
          { date: "2026-02-01", status: ShiftRequestStatus.FIXED_OFF, isLocked: false },
        ],
      },
    ];

    const result = deriveHistoryCellChanges(staffId, histories, getStaffName);

    expect(result.length).toBeGreaterThan(0);
    const changed = result.find(r => r.date === "01" && r.newState === "fixedOff");
    expect(changed).toBeDefined();
    expect(changed?.previousState).toBe("work");
    expect(changed?.source).toBe("db-history");
  });

  it("treats oldest snapshot entries as having unknown previous state", () => {
    const histories = [
      {
        version: 1,
        recordedAt: "2026-02-01T10:00:00Z",
        recordedByStaffId: "admin",
        entries: [
          { date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: false },
        ],
      },
    ];

    const result = deriveHistoryCellChanges(staffId, histories, getStaffName);

    // Oldest snapshot: previousState is undefined
    expect(result[0].previousState).toBeUndefined();
    expect(result[0].newState).toBe("work");
  });

  it("records lock changes even when state is unchanged", () => {
    const histories = [
      {
        version: 1,
        recordedAt: "2026-02-01T10:00:00Z",
        recordedByStaffId: "admin",
        entries: [
          { date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: false },
        ],
      },
      {
        version: 2,
        recordedAt: "2026-02-02T10:00:00Z",
        recordedByStaffId: "admin",
        entries: [
          { date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: true },
        ],
      },
    ];

    const result = deriveHistoryCellChanges(staffId, histories, getStaffName);

    const locked = result.find(r => r.date === "01" && r.newLocked === true);
    expect(locked).toBeDefined();
  });

  it("resolves changedByName using getStaffName", () => {
    const histories = [
      {
        version: 1,
        recordedAt: "2026-02-01T10:00:00Z",
        recordedByStaffId: "admin-user",
        entries: [
          { date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: false },
        ],
      },
    ];

    const result = deriveHistoryCellChanges(staffId, histories, getStaffName);

    expect(result[0].changedByName).toBe("Name(admin-user)");
  });

  it("uses 不明 for changedByName when recordedByStaffId is missing", () => {
    const histories = [
      {
        version: 1,
        recordedAt: "2026-02-01T10:00:00Z",
        recordedByStaffId: undefined,
        entries: [
          { date: "2026-02-01", status: ShiftRequestStatus.WORK, isLocked: false },
        ],
      },
    ];

    const result = deriveHistoryCellChanges(staffId, histories, getStaffName);

    expect(result[0].changedByName).toBe("不明");
    expect(result[0].changedBy).toBe("unknown");
  });
});
