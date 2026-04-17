import { ShiftRequestStatus } from "@shared/api/graphql/types";

import type {
  ShiftDataMap,
  ShiftRequestData,
} from "../../types/collaborative.types";
import {
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
