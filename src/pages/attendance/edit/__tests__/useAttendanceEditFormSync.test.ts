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
  rests: [{ __typename: "Rest" as const, startTime: "2024-06-01T12:00:00.000Z", endTime: "2024-06-01T13:00:00.000Z" }],
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
    it("calls mockReset with all fields when attendance.workDate === targetWorkDateISO", () => {
      const attendance = makeAttendance({ workDate: "2024-06-01" });
      setup({ attendance, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });

      expect(mockReset).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: attendance.startTime,
          endTime: attendance.endTime,
          paidHolidayFlag: false,
          specialHolidayFlag: false,
          goDirectlyFlag: false,
          substituteHolidayDate: null,
          returnDirectlyFlag: false,
          remarkTags: [],
          remarks: "",
        }),
      );
    });

    it("does NOT call mockReset (for attendance sync) when attendance is null", () => {
      setup({ attendance: null, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      // reset() is called from staffId+targetWorkDateISO effect, but NOT from attendance sync
      const resetCallsWithObjectArg = mockReset.mock.calls.filter(
        (call) => call.length > 0 && call[0] !== undefined,
      );
      expect(resetCallsWithObjectArg).toHaveLength(0);
    });

    it("does NOT call mockReset (for attendance sync) when attendance.workDate !== targetWorkDateISO", () => {
      const attendance = makeAttendance({ workDate: "2024-06-02" });
      setup({ attendance, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      const resetCallsWithObjectArg = mockReset.mock.calls.filter(
        (call) => call.length > 0 && call[0] !== undefined,
      );
      expect(resetCallsWithObjectArg).toHaveLength(0);
    });

    it("does NOT call mockReset (for attendance sync) when targetWorkDateISO is null", () => {
      const attendance = makeAttendance({ workDate: "2024-06-01" });
      setup({ attendance, targetWorkDateISO: null, staffId: "staff-1" });
      expect(mockReset).not.toHaveBeenCalled();
    });

    it("sets paidHolidayFlag to true in reset call when attendance has paidHolidayFlag true", () => {
      const attendance = makeAttendance({ workDate: "2024-06-01", paidHolidayFlag: true });
      setup({ attendance, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      expect(mockReset).toHaveBeenCalledWith(
        expect.objectContaining({ paidHolidayFlag: true }),
      );
    });

    it("calls mockReset again on attendance change when workDate matches", () => {
      const { rerender } = setup({ attendance: null, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      mockReset.mockClear();

      const attendance = makeAttendance({ workDate: "2024-06-01" });
      rerender({ attendance, targetWorkDateISO: "2024-06-01", staffId: "staff-1" });
      expect(mockReset).toHaveBeenCalledWith(
        expect.objectContaining({ startTime: attendance.startTime }),
      );
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

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", ["欠勤"], { shouldDirty: false });
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

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", [], { shouldDirty: false });
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

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", ["有給休暇"], { shouldDirty: false });
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

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", ["特別休暇"], { shouldDirty: false });
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

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", [], { shouldDirty: false });
    });

    it("does NOT call applyConfiguredWorkAndLunchRest when specialHolidayFlag becomes false", async () => {
      mockGetValues.mockImplementation(makeGetValuesImpl());
      const { result } = setup({ staffId: "staff-1", targetWorkDateISO: "2024-06-01" });

      jest.clearAllMocks();
      mockGetValues.mockImplementation(makeGetValuesImpl());

      await act(async () => {
        result.current.form.setValue("specialHolidayFlag", false);
      });

      // setValue("rests", ...) should NOT be called (only called from applyConfiguredWorkAndLunchRest)
      const restsSetCalls = mockSetValue.mock.calls.filter((call) => call[0] === "rests");
      expect(restsSetCalls).toHaveLength(0);
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

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", ["有給休暇"], { shouldDirty: false });
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

      expect(mockSetValue).toHaveBeenCalledWith("remarkTags", [], { shouldDirty: false });
    });

    it("calls applyConfiguredWorkAndLunchRest (via setValue('rests', ...)) when paidHolidayFlag becomes true", async () => {
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

      const restsSetCalls = mockSetValue.mock.calls.filter((call) => call[0] === "rests");
      expect(restsSetCalls.length).toBeGreaterThan(0);
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

      expect(mockSetValue).toHaveBeenCalledWith("hourlyPaidHolidayTimes", [], { shouldDirty: false });
    });
  });
});
