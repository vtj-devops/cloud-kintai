import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { Attendance } from "@shared/api/graphql/types";
import { act,renderHook } from "@testing-library/react";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";

import { useAttendanceEditFormSync } from "../useAttendanceEditFormSync";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("@entities/attendance/lib/resolveConfigTimeOnDate", () => ({
  resolveConfigTimeOnDate: jest.fn((_: unknown, current: unknown) => current ?? ""),
}));

jest.mock("../attendanceEditUtils", () => ({
  normalizeTimeRanges: jest.fn((v: unknown) => v ?? []),
  splitRemarks: jest.fn(() => ({ tags: [], remarks: "" })),
}));

// ---------------------------------------------------------------------------
// Stable mock references (module scope)
// ---------------------------------------------------------------------------

const mockSetValue = jest.fn();
const mockReset = jest.fn();
const mockGetValues = jest.fn();
const mockRestReplace = jest.fn();
const mockHourlyPaidHolidayTimeReplace = jest.fn();
const mockGetStartTime = jest.fn(() => dayjs("2024-01-01T09:00:00"));
const mockGetEndTime = jest.fn(() => dayjs("2024-01-01T18:00:00"));
const mockGetLunchRestStartTime = jest.fn(() => dayjs("2024-01-01T12:00:00"));
const mockGetLunchRestEndTime = jest.fn(() => dayjs("2024-01-01T13:00:00"));

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

const makeAttendance = (overrides: Partial<Attendance> = {}): Attendance => ({
  __typename: "Attendance",
  id: "att-1",
  staffId: "staff-1",
  workDate: "2024-06-01",
  startTime: "2024-06-01T09:00:00.000Z",
  endTime: "2024-06-01T18:00:00.000Z",
  goDirectlyFlag: false,
  returnDirectlyFlag: false,
  absentFlag: false,
  rests: [{ startTime: "2024-06-01T12:00:00.000Z", endTime: "2024-06-01T13:00:00.000Z" }],
  hourlyPaidHolidayTimes: [],
  remarks: null,
  paidHolidayFlag: false,
  specialHolidayFlag: false,
  substituteHolidayDate: null,
  createdAt: "2024-06-01T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
  ...overrides,
});

// ---------------------------------------------------------------------------
// Setup helper
// ---------------------------------------------------------------------------

type SetupProps = {
  attendance?: Attendance | null;
  targetWorkDate?: string;
  targetWorkDateISO?: string | null;
  staffId?: string | null;
};

function setup(initialProps: SetupProps = {}) {
  return renderHook(
    (props: SetupProps) => {
      const form = useForm<AttendanceEditInputs>();
      const hookResult = useAttendanceEditFormSync({
        control: form.control,
        setValue: mockSetValue,
        getValues: mockGetValues,
        reset: mockReset,
        restReplace: mockRestReplace,
        hourlyPaidHolidayTimeReplace: mockHourlyPaidHolidayTimeReplace,
        attendance: props.attendance ?? null,
        targetWorkDate: props.targetWorkDate,
        targetWorkDateISO: props.targetWorkDateISO ?? null,
        staffId: props.staffId ?? null,
        getStartTime: mockGetStartTime,
        getEndTime: mockGetEndTime,
        getLunchRestStartTime: mockGetLunchRestStartTime,
        getLunchRestEndTime: mockGetLunchRestEndTime,
      });
      return { form, ...hookResult };
    },
    { initialProps },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAttendanceEditFormSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValues.mockReturnValue([]);
  });

  // -------------------------------------------------------------------------
  // 1. reset() effect
  // -------------------------------------------------------------------------

  describe("reset() effect", () => {
    it("calls mockReset on initial render when both staffId and targetWorkDateISO are non-null", () => {
      setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });
      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("does NOT call mockReset when staffId is null (even if targetWorkDateISO is set)", () => {
      setup({ staffId: null, targetWorkDateISO: "2024-06-01" });
      expect(mockReset).not.toHaveBeenCalled();
    });

    it("does NOT call mockReset when targetWorkDateISO is null (even if staffId is set)", () => {
      setup({ staffId: "staff-1", targetWorkDateISO: null });
      expect(mockReset).not.toHaveBeenCalled();
    });

    it("calls mockReset after rerender when both become non-null", () => {
      const { rerender } = setup({ staffId: null, targetWorkDateISO: null });
      expect(mockReset).not.toHaveBeenCalled();

      rerender({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });
      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("calls mockReset again when staffId changes", () => {
      const { rerender } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });
      expect(mockReset).toHaveBeenCalledTimes(1);

      rerender({ staffId: "staff-2", targetWorkDateISO: "2024-06-01" });
      expect(mockReset).toHaveBeenCalledTimes(2);
    });

    it("calls mockReset again when targetWorkDateISO changes", () => {
      const { rerender } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });
      expect(mockReset).toHaveBeenCalledTimes(1);

      rerender({ staffId: "staff-1", targetWorkDateISO: "2024-06-02" });
      expect(mockReset).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // 2. attendance sync effect
  // -------------------------------------------------------------------------

  describe("attendance sync effect", () => {
    it("calls mockSetValue for all 10 fields when attendance.workDate === targetWorkDateISO", () => {
      const attendance = makeAttendance({ workDate: "2024-06-01" });
      setup({ attendance, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });

      expect(mockSetValue).toHaveBeenCalledWith("startTime", attendance.startTime);
      expect(mockSetValue).toHaveBeenCalledWith("endTime", attendance.endTime);
      expect(mockSetValue).toHaveBeenCalledWith("paidHolidayFlag", false);
      expect(mockSetValue).toHaveBeenCalledWith("specialHolidayFlag", false);
      expect(mockSetValue).toHaveBeenCalledWith("goDirectlyFlag", false);
      expect(mockSetValue).toHaveBeenCalledWith("substituteHolidayDate", null);
      expect(mockSetValue).toHaveBeenCalledWith("returnDirectlyFlag", false);
      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", []);
      expect(mockSetValue).toHaveBeenCalledWith("remarks", "");
      expect(mockSetValue).toHaveBeenCalledWith("rests", attendance.rests);
      expect(mockSetValue).toHaveBeenCalledWith("hourlyPaidHolidayTimes", attendance.hourlyPaidHolidayTimes);
    });

    it("does NOT call mockSetValue when attendance is null", () => {
      setup({ attendance: null, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("does NOT call mockSetValue when attendance.workDate !== targetWorkDateISO", () => {
      const attendance = makeAttendance({ workDate: "2024-06-02" });
      setup({ attendance, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("does NOT call mockSetValue when targetWorkDateISO is null", () => {
      const attendance = makeAttendance({ workDate: "2024-06-01" });
      setup({ attendance, targetWorkDateISO: null, staffId: "staff-1" });
      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("sets paidHolidayFlag to true when attendance has paidHolidayFlag true", () => {
      const attendance = makeAttendance({ workDate: "2024-06-01", paidHolidayFlag: true });
      setup({ attendance, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      expect(mockSetValue).toHaveBeenCalledWith("paidHolidayFlag", true);
    });

    it("calls mockSetValue again on attendance change when workDate matches", () => {
      const { rerender } = setup({ attendance: null, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      expect(mockSetValue).not.toHaveBeenCalled();

      const attendance = makeAttendance({ workDate: "2024-06-01" });
      rerender({ attendance, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      expect(mockSetValue).toHaveBeenCalledWith("startTime", attendance.startTime);
    });
  });

  // -------------------------------------------------------------------------
  // 3. absentFlag effect
  // -------------------------------------------------------------------------

  describe("absentFlag effect", () => {
    it("adds '欠勤' tag when absentFlag becomes true and remarkTags does NOT contain '欠勤'", async () => {
      mockGetValues.mockReturnValue([]);
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      await act(async () => {
        result.current.form.setValue("absentFlag", true);
      });

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", ["欠勤"]);
    });

    it("does NOT call mockSetValue for remarkTags again when absentFlag is true and '欠勤' is already present", async () => {
      mockGetValues.mockReturnValue(["欠勤"]);
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      jest.clearAllMocks();
      mockGetValues.mockReturnValue(["欠勤"]);

      await act(async () => {
        result.current.form.setValue("absentFlag", true);
      });

      const remarkTagsCalls = mockSetValue.mock.calls.filter(
        (call) => call[0] === "remarkTags",
      );
      expect(remarkTagsCalls).toHaveLength(0);
    });

    it("removes '欠勤' tag when absentFlag becomes false and remarkTags CONTAINS '欠勤'", async () => {
      mockGetValues.mockReturnValue(["欠勤"]);
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      jest.clearAllMocks();
      mockGetValues.mockReturnValue(["欠勤"]);

      await act(async () => {
        result.current.form.setValue("absentFlag", false);
      });

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", []);
    });

    it("does NOT call mockSetValue for remarkTags when absentFlag is false and '欠勤' is NOT present", async () => {
      mockGetValues.mockReturnValue([]);
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      jest.clearAllMocks();
      mockGetValues.mockReturnValue([]);

      await act(async () => {
        result.current.form.setValue("absentFlag", false);
      });

      const remarkTagsCalls = mockSetValue.mock.calls.filter(
        (call) => call[0] === "remarkTags",
      );
      expect(remarkTagsCalls).toHaveLength(0);
    });

    it("removes only '欠勤' from tags when absentFlag becomes false with mixed tags", async () => {
      mockGetValues.mockReturnValue(["有給休暇", "欠勤"]);
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      jest.clearAllMocks();
      mockGetValues.mockReturnValue(["有給休暇", "欠勤"]);

      await act(async () => {
        result.current.form.setValue("absentFlag", false);
      });

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", ["有給休暇"]);
    });
  });

  // -------------------------------------------------------------------------
  // 4. isOnBreak
  // -------------------------------------------------------------------------

  describe("isOnBreak", () => {
    it("returns false initially (no startTime, no rests)", () => {
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });
      expect(result.current.isOnBreak).toBe(false);
    });

    it("returns true when startTime is set AND rests[0].startTime is set AND rests[0].endTime is null", async () => {
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      await act(async () => {
        result.current.form.setValue("startTime", "2024-06-01T09:00:00.000Z");
        result.current.form.setValue("rests", [
          { startTime: "2024-06-01T12:00:00.000Z", endTime: null },
        ]);
      });

      expect(result.current.isOnBreak).toBe(true);
    });

    it("returns false when rests is empty even if startTime is set", async () => {
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      await act(async () => {
        result.current.form.setValue("startTime", "2024-06-01T09:00:00.000Z");
        result.current.form.setValue("rests", []);
      });

      expect(result.current.isOnBreak).toBe(false);
    });

    it("returns false when rests[0].endTime is set (not on break anymore)", async () => {
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      await act(async () => {
        result.current.form.setValue("startTime", "2024-06-01T09:00:00.000Z");
        result.current.form.setValue("rests", [
          {
            startTime: "2024-06-01T12:00:00.000Z",
            endTime: "2024-06-01T13:00:00.000Z",
          },
        ]);
      });

      expect(result.current.isOnBreak).toBe(false);
    });

    it("returns false when startTime is null/undefined even if rests exist", async () => {
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      await act(async () => {
        result.current.form.setValue("startTime", null);
        result.current.form.setValue("rests", [
          { startTime: "2024-06-01T12:00:00.000Z", endTime: null },
        ]);
      });

      expect(result.current.isOnBreak).toBe(false);
    });

    it("returns false when rests[0].startTime is null/undefined", async () => {
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      await act(async () => {
        result.current.form.setValue("startTime", "2024-06-01T09:00:00.000Z");
        result.current.form.setValue("rests", [{ startTime: null, endTime: null }]);
      });

      expect(result.current.isOnBreak).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 5. specialHolidayFlag effect (bonus)
  // -------------------------------------------------------------------------

  describe("specialHolidayFlag effect", () => {
    // Helper that returns sane defaults for all fields touched by applyConfiguredWorkAndLunchRest
    const makeGetValuesImpl =
      (overrides: Record<string, unknown> = {}) =>
      (field: string) => {
        const defaults: Record<string, unknown> = {
          workDate: null,
          startTime: null,
          endTime: null,
          remarkTags: [],
          rests: [],
          hourlyPaidHolidayTimes: [],
        };
        return field in overrides ? overrides[field] : (defaults[field] ?? null);
      };

    it("calls mockSetValue with '特別休暇' tag when specialHolidayFlag becomes true", async () => {
      mockGetValues.mockImplementation(makeGetValuesImpl());
      const { result } = setup({
        staffId: "staff-1",
        targetWorkDateISO: "2024-06-01",
        targetWorkDate: "2024-06-01",
      });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(makeGetValuesImpl());

      await act(async () => {
        result.current.form.setValue("specialHolidayFlag", true);
      });

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", ["特別休暇"]);
    });

    it("calls mockSetValue('paidHolidayFlag', false) when paidHolidayFlag is true at the time specialHolidayFlag becomes true", async () => {
      mockGetValues.mockImplementation(makeGetValuesImpl({ paidHolidayFlag: true }));
      const { result } = setup({
        staffId: "staff-1",
        targetWorkDateISO: "2024-06-01",
        targetWorkDate: "2024-06-01",
      });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(makeGetValuesImpl({ paidHolidayFlag: true }));

      await act(async () => {
        result.current.form.setValue("specialHolidayFlag", true);
      });

      expect(mockSetValue).toHaveBeenCalledWith("paidHolidayFlag", false);
    });

    it("removes '特別休暇' tag when specialHolidayFlag becomes false", async () => {
      mockGetValues.mockImplementation(makeGetValuesImpl({ remarkTags: ["特別休暇"] }));
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(makeGetValuesImpl({ remarkTags: ["特別休暇"] }));

      await act(async () => {
        result.current.form.setValue("specialHolidayFlag", false);
      });

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", []);
    });

    it("does NOT call applyConfiguredWorkAndLunchRest when specialHolidayFlag becomes false", async () => {
      mockGetValues.mockImplementation(makeGetValuesImpl());
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(makeGetValuesImpl());

      await act(async () => {
        result.current.form.setValue("specialHolidayFlag", false);
      });

      // restReplace should NOT be called (restReplace is only called from applyConfiguredWorkAndLunchRest)
      expect(mockRestReplace).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 6. paidHolidayFlag effect (bonus)
  // -------------------------------------------------------------------------

  describe("paidHolidayFlag effect", () => {
    // Helper that returns sane defaults for all fields touched by applyConfiguredWorkAndLunchRest
    const makeGetValuesImpl =
      (overrides: Record<string, unknown> = {}) =>
      (field: string) => {
        const defaults: Record<string, unknown> = {
          workDate: null,
          startTime: null,
          endTime: null,
          remarkTags: [],
          rests: [],
          hourlyPaidHolidayTimes: [],
        };
        return field in overrides ? overrides[field] : (defaults[field] ?? null);
      };

    it("calls mockSetValue with '有給休暇' tag when paidHolidayFlag becomes true", async () => {
      mockGetValues.mockImplementation(makeGetValuesImpl());
      const { result } = setup({
        staffId: "staff-1",
        targetWorkDateISO: "2024-06-01",
        targetWorkDate: "2024-06-01",
      });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(makeGetValuesImpl());

      await act(async () => {
        result.current.form.setValue("paidHolidayFlag", true);
      });

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", ["有給休暇"]);
    });

    it("calls mockSetValue('specialHolidayFlag', false) when specialHolidayFlag is true at the time paidHolidayFlag becomes true", async () => {
      mockGetValues.mockImplementation(makeGetValuesImpl({ specialHolidayFlag: true }));
      const { result } = setup({
        staffId: "staff-1",
        targetWorkDateISO: "2024-06-01",
        targetWorkDate: "2024-06-01",
      });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(makeGetValuesImpl({ specialHolidayFlag: true }));

      await act(async () => {
        result.current.form.setValue("paidHolidayFlag", true);
      });

      expect(mockSetValue).toHaveBeenCalledWith("specialHolidayFlag", false);
    });

    it("removes '有給休暇' tag when paidHolidayFlag becomes false", async () => {
      mockGetValues.mockImplementation(makeGetValuesImpl({ remarkTags: ["有給休暇"] }));
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(makeGetValuesImpl({ remarkTags: ["有給休暇"] }));

      await act(async () => {
        result.current.form.setValue("paidHolidayFlag", false);
      });

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", []);
    });

    it("calls applyConfiguredWorkAndLunchRest (via restReplace) when paidHolidayFlag becomes true", async () => {
      mockGetValues.mockImplementation(makeGetValuesImpl());
      const { result } = setup({
        staffId: "staff-1",
        targetWorkDateISO: "2024-06-01",
        targetWorkDate: "2024-06-01",
      });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(makeGetValuesImpl());

      await act(async () => {
        result.current.form.setValue("paidHolidayFlag", true);
      });

      expect(mockRestReplace).toHaveBeenCalled();
    });

    it("clears hourlyPaidHolidayTimes when paidHolidayFlag becomes true and there are existing times", async () => {
      const existingTimes = [
        { startTime: "2024-06-01T10:00:00.000Z", endTime: "2024-06-01T11:00:00.000Z" },
      ];
      mockGetValues.mockImplementation(
        makeGetValuesImpl({ hourlyPaidHolidayTimes: existingTimes }),
      );

      const { result } = setup({
        staffId: "staff-1",
        targetWorkDateISO: "2024-06-01",
        targetWorkDate: "2024-06-01",
      });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(
        makeGetValuesImpl({ hourlyPaidHolidayTimes: existingTimes }),
      );

      await act(async () => {
        result.current.form.setValue("paidHolidayFlag", true);
      });

      expect(mockHourlyPaidHolidayTimeReplace).toHaveBeenCalledWith([]);
    });
  });
});
