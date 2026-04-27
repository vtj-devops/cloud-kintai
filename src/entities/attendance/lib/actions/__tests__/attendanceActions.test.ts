import {
  clockInAction,
  clockOutAction,
  GoDirectlyFlag,
  restEndAction,
  restStartAction,
  ReturnDirectlyFlag,
  updateRemarksAction,
} from "@entities/attendance/lib/actions/attendanceActions";
import type { Attendance } from "@shared/api/graphql/types";

const makeAttendance = (overrides: Partial<Attendance> = {}): Attendance => ({
  __typename: "Attendance",
  id: "existing",
  staffId: "staff-1",
  workDate: "2026-03-22",
  startTime: null,
  endTime: null,
  rests: null,
  createdAt: "",
  updatedAt: "",
  revision: 1,
  ...overrides,
});

const makeMocks = () => ({
  createAttendance: jest.fn().mockResolvedValue({ id: "created" }),
  updateAttendance: jest.fn().mockResolvedValue({ id: "updated" }),
});

describe("clockInAction", () => {
  it("creates a new record when cached attendance is for another workDate", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await clockInAction({
      attendance: makeAttendance({ workDate: "2026-03-21" }),
      staffId: "staff-1",
      workDate: "2026-03-22",
      startTime: "2026-03-22T00:00:00.000Z",
      createAttendance,
      updateAttendance,
    });
    expect(createAttendance).toHaveBeenCalledTimes(1);
    expect(updateAttendance).not.toHaveBeenCalled();
  });

  it("updates existing record when workDate matches", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await clockInAction({
      attendance: makeAttendance(),
      staffId: "staff-1",
      workDate: "2026-03-22",
      startTime: "2026-03-22T00:00:00.000Z",
      createAttendance,
      updateAttendance,
    });
    expect(updateAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ id: "existing", goDirectlyFlag: false })
    );
    expect(createAttendance).not.toHaveBeenCalled();
  });

  it("passes goDirectlyFlag=true when specified", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await clockInAction({
      attendance: makeAttendance(),
      staffId: "staff-1",
      workDate: "2026-03-22",
      startTime: "2026-03-22T00:00:00.000Z",
      goDirectlyFlag: GoDirectlyFlag.YES,
      createAttendance,
      updateAttendance,
    });
    expect(updateAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ goDirectlyFlag: true })
    );
  });

  it("creates new record when attendance is null", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await clockInAction({
      attendance: null,
      staffId: "staff-1",
      workDate: "2026-03-22",
      startTime: "2026-03-22T00:00:00.000Z",
      createAttendance,
      updateAttendance,
    });
    expect(createAttendance).toHaveBeenCalledTimes(1);
  });
});

describe("clockOutAction", () => {
  it("creates a new record when attendance is null", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await clockOutAction({
      attendance: null,
      staffId: "staff-1",
      workDate: "2026-03-22",
      endTime: "2026-03-22T09:00:00.000Z",
      createAttendance,
      updateAttendance,
    });
    expect(createAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ returnDirectlyFlag: false })
    );
  });

  it("passes returnDirectlyFlag=true when specified", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await clockOutAction({
      attendance: null,
      staffId: "staff-1",
      workDate: "2026-03-22",
      endTime: "2026-03-22T09:00:00.000Z",
      returnDirectlyFlag: ReturnDirectlyFlag.YES,
      createAttendance,
      updateAttendance,
    });
    expect(createAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ returnDirectlyFlag: true })
    );
  });

  it("updates existing attendance when workDate matches", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    const endTime = "2026-03-22T10:00:00.000Z";
    await clockOutAction({
      attendance: makeAttendance({ startTime: "2026-03-22T02:00:00.000Z" }),
      staffId: "staff-1",
      workDate: "2026-03-22",
      endTime,
      createAttendance,
      updateAttendance,
    });
    expect(updateAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ id: "existing", endTime })
    );
    expect(createAttendance).not.toHaveBeenCalled();
  });
});

describe("restStartAction", () => {
  it("updates only when attendance workDate matches", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await restStartAction({
      attendance: makeAttendance({
        workDate: "2026-03-21",
        startTime: "2026-03-21T00:00:00.000Z",
        rests: [],
      }),
      staffId: "staff-1",
      workDate: "2026-03-22",
      time: "2026-03-22T01:00:00.000Z",
      createAttendance,
      updateAttendance,
    });
    expect(createAttendance).toHaveBeenCalledTimes(1);
    expect(updateAttendance).not.toHaveBeenCalled();
  });

  it("throws when not clocked in (no startTime)", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await expect(
      restStartAction({
        attendance: makeAttendance({ startTime: null }),
        staffId: "staff-1",
        workDate: "2026-03-22",
        time: "2026-03-22T12:00:00.000Z",
        createAttendance,
        updateAttendance,
      })
    ).rejects.toThrow("Not clocked in");
  });

  it("throws when there is a rest mismatch", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await expect(
      restStartAction({
        attendance: makeAttendance({
          startTime: "2026-03-22T00:00:00.000Z",
          rests: [
            { __typename: "Rest", startTime: "2026-03-22T12:00:00.000Z", endTime: null },
          ],
        }),
        staffId: "staff-1",
        workDate: "2026-03-22",
        time: "2026-03-22T14:00:00.000Z",
        createAttendance,
        updateAttendance,
      })
    ).rejects.toThrow("There is a problem with the rest time");
  });

  it("adds rest start to existing rests when valid", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await restStartAction({
      attendance: makeAttendance({
        startTime: "2026-03-22T00:00:00.000Z",
        rests: [
          { __typename: "Rest", startTime: "2026-03-22T10:00:00.000Z", endTime: "2026-03-22T10:30:00.000Z" },
        ],
      }),
      staffId: "staff-1",
      workDate: "2026-03-22",
      time: "2026-03-22T12:00:00.000Z",
      createAttendance,
      updateAttendance,
    });
    const call = updateAttendance.mock.calls[0][0];
    expect(call.rests).toHaveLength(2);
    expect(call.rests[1].startTime).toBe("2026-03-22T12:00:00.000Z");
  });
});

describe("restEndAction", () => {
  it("creates new attendance when workDate doesn't match", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await restEndAction({
      attendance: makeAttendance({ workDate: "2026-03-21", startTime: "2026-03-21T00:00:00.000Z" }),
      staffId: "staff-1",
      workDate: "2026-03-22",
      time: "2026-03-22T12:30:00.000Z",
      createAttendance,
      updateAttendance,
    });
    expect(createAttendance).toHaveBeenCalledTimes(1);
  });

  it("throws when not clocked in", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await expect(
      restEndAction({
        attendance: makeAttendance({ startTime: null }),
        staffId: "staff-1",
        workDate: "2026-03-22",
        time: "2026-03-22T12:30:00.000Z",
        createAttendance,
        updateAttendance,
      })
    ).rejects.toThrow("Not clocked in");
  });

  it("throws when there are no rests", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await expect(
      restEndAction({
        attendance: makeAttendance({
          startTime: "2026-03-22T00:00:00.000Z",
          rests: [],
        }),
        staffId: "staff-1",
        workDate: "2026-03-22",
        time: "2026-03-22T12:30:00.000Z",
        createAttendance,
        updateAttendance,
      })
    ).rejects.toThrow("There is no rest start");
  });

  it("sets endTime on the last rest entry", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await restEndAction({
      attendance: makeAttendance({
        startTime: "2026-03-22T00:00:00.000Z",
        rests: [
          { __typename: "Rest", startTime: "2026-03-22T12:00:00.000Z", endTime: null },
        ],
      }),
      staffId: "staff-1",
      workDate: "2026-03-22",
      time: "2026-03-22T12:30:00.000Z",
      createAttendance,
      updateAttendance,
    });
    const call = updateAttendance.mock.calls[0][0];
    expect(call.rests[0].endTime).toBe("2026-03-22T12:30:00.000Z");
  });
});

describe("updateRemarksAction", () => {
  it("creates new attendance when attendance is null", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await updateRemarksAction({
      attendance: null,
      staffId: "staff-1",
      workDate: "2026-03-22",
      remarks: "備考テスト",
      createAttendance,
      updateAttendance,
    });
    expect(createAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ remarks: "備考テスト" })
    );
  });

  it("updates existing attendance remarks when workDate matches", async () => {
    const { createAttendance, updateAttendance } = makeMocks();
    await updateRemarksAction({
      attendance: makeAttendance(),
      staffId: "staff-1",
      workDate: "2026-03-22",
      remarks: "更新備考",
      createAttendance,
      updateAttendance,
    });
    expect(updateAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ id: "existing", remarks: "更新備考" })
    );
  });
});

