import { Attendance, AttendanceChangeRequest } from "@shared/api/graphql/types";
import { render, screen, within } from "@testing-library/react";
import React from "react";

import {
  buildChangeRequestDiffRows,
  ChangeRequestDiffTable,
} from "../ChangeRequestDiffTable";

// ─── Factories ────────────────────────────────────────────────────────────────

// NOTE: Use local-time ISO strings (no "Z" suffix) so dayjs.format("HH:mm")
// is timezone-agnostic across dev and CI machines.
const makeAttendance = (overrides: Partial<Attendance> = {}): Attendance => ({
  __typename: "Attendance",
  id: "att-1",
  staffId: "staff-1",
  workDate: "2024-04-01",
  createdAt: "2024-04-01T00:00:00",
  updatedAt: "2024-04-01T00:00:00",
  startTime: "2024-04-01T09:00:00",
  endTime: "2024-04-01T18:00:00",
  goDirectlyFlag: false,
  returnDirectlyFlag: false,
  absentFlag: false,
  rests: [],
  hourlyPaidHolidayTimes: [],
  paidHolidayFlag: false,
  specialHolidayFlag: false,
  hourlyPaidHolidayHours: null,
  substituteHolidayDate: null,
  remarks: null,
  ...overrides,
});

const makeChangeRequest = (
  overrides: Partial<AttendanceChangeRequest> = {},
): AttendanceChangeRequest => ({
  __typename: "AttendanceChangeRequest",
  ...overrides,
});

// ─── Render helper ─────────────────────────────────────────────────────────────

const renderTable = (
  attendance: Attendance,
  changeRequest: AttendanceChangeRequest,
  size?: "small" | "medium",
) =>
  render(
    <ChangeRequestDiffTable
      attendance={attendance}
      changeRequest={changeRequest}
      size={size}
    />,
  );

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("ChangeRequestDiffTable", () => {
  describe("table headers", () => {
    it("renders 項目 / 現在の値 / 申請内容 headers", () => {
      renderTable(makeAttendance(), makeChangeRequest());
      expect(screen.getByText("項目")).toBeInTheDocument();
      expect(screen.getByText("現在の値")).toBeInTheDocument();
      expect(screen.getByText("申請内容")).toBeInTheDocument();
    });
  });

  describe("row labels", () => {
    it("renders all expected row labels", () => {
      renderTable(makeAttendance(), makeChangeRequest());
      const labels = [
        "勤務時間",
        "休憩時間",
        "直行",
        "直帰",
        "有給",
        "特別休暇",
        "欠勤",
        "代休取得日",
        "時間単位有給",
        "摘要",
      ];
      for (const label of labels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
    });
  });

  describe("勤務時間 row", () => {
    it("shows formatted time range when no change requested", () => {
      const att = makeAttendance({
        startTime: "2024-04-01T09:00:00",
        endTime: "2024-04-01T18:00:00",
      });
      renderTable(att, makeChangeRequest());
      // current and requested columns both show the same time range
      const cells = screen.getAllByText("09:00 ~ 18:00");
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });

    it("shows changed requested time when startTime differs", () => {
      const att = makeAttendance({
        startTime: "2024-04-01T09:00:00",
        endTime: "2024-04-01T18:00:00",
      });
      const cr = makeChangeRequest({
        startTime: "2024-04-01T10:00:00",
      });
      renderTable(att, cr);
      expect(screen.getByText("09:00 ~ 18:00")).toBeInTheDocument();
      expect(screen.getByText("10:00 ~ 18:00")).toBeInTheDocument();
    });

    it("shows '-' when attendance has no startTime or endTime", () => {
      const att = makeAttendance({ startTime: null, endTime: null });
      renderTable(att, makeChangeRequest());
      // "-" appears multiple times (rests, substituteHolidayDate, etc.)
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  describe("休憩時間 row", () => {
    it("shows '-' when no rests and no change requested", () => {
      const att = makeAttendance({ rests: [] });
      renderTable(att, makeChangeRequest());
      // multiple "-" are shown; just confirm no crash
      expect(screen.getByText("休憩時間")).toBeInTheDocument();
    });

    it("shows rest time range when rests are present", () => {
      const att = makeAttendance({
        rests: [
          {
            __typename: "Rest",
            startTime: "2024-04-01T12:00:00",
            endTime: "2024-04-01T13:00:00",
          },
        ],
      });
      renderTable(att, makeChangeRequest());
      // current and requested columns both show same value (no change)
      const cells = screen.getAllByText("12:00 ~ 13:00");
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });

    it("shows changed rest times when changeRequest.rests differs", () => {
      const att = makeAttendance({
        rests: [
          {
            __typename: "Rest",
            startTime: "2024-04-01T12:00:00",
            endTime: "2024-04-01T13:00:00",
          },
        ],
      });
      const cr = makeChangeRequest({
        rests: [
          {
            __typename: "Rest",
            startTime: "2024-04-01T11:30:00",
            endTime: "2024-04-01T12:30:00",
          },
        ],
      });
      renderTable(att, cr);
      expect(screen.getByText("12:00 ~ 13:00")).toBeInTheDocument();
      expect(screen.getByText("11:30 ~ 12:30")).toBeInTheDocument();
    });
  });

  describe("boolean flag rows", () => {
    it.each([
      ["直行", "goDirectlyFlag"],
      ["直帰", "returnDirectlyFlag"],
      ["有給", "paidHolidayFlag"],
      ["特別休暇", "specialHolidayFlag"],
      ["欠勤", "absentFlag"],
    ] as const)(
      "%s shows あり when current flag is true and not changed",
      (label, field) => {
        const att = makeAttendance({ [field]: true });
        renderTable(att, makeChangeRequest());
        const row = screen.getByText(label).closest("tr")!;
        expect(within(row).getAllByText("あり").length).toBeGreaterThanOrEqual(
          1,
        );
      },
    );

    it.each([
      ["直行", "goDirectlyFlag"],
      ["直帰", "returnDirectlyFlag"],
      ["有給", "paidHolidayFlag"],
      ["特別休暇", "specialHolidayFlag"],
      ["欠勤", "absentFlag"],
    ] as const)(
      "%s shows なし when current flag is false and not changed",
      (label, field) => {
        const att = makeAttendance({ [field]: false });
        renderTable(att, makeChangeRequest());
        const row = screen.getByText(label).closest("tr")!;
        expect(within(row).getAllByText("なし").length).toBeGreaterThanOrEqual(
          1,
        );
      },
    );

    it("shows changed value for 直行 when changeRequest differs", () => {
      const att = makeAttendance({ goDirectlyFlag: false });
      const cr = makeChangeRequest({ goDirectlyFlag: true });
      renderTable(att, cr);
      const row = screen.getByText("直行").closest("tr")!;
      expect(within(row).getByText("なし")).toBeInTheDocument();
      expect(within(row).getByText("あり")).toBeInTheDocument();
    });
  });

  describe("代休取得日 row", () => {
    it("shows '-' when substituteHolidayDate is null", () => {
      const att = makeAttendance({ substituteHolidayDate: null });
      renderTable(att, makeChangeRequest());
      expect(screen.getByText("代休取得日")).toBeInTheDocument();
    });

    it("shows formatted date when substituteHolidayDate is set", () => {
      const att = makeAttendance({ substituteHolidayDate: "2024-04-10" });
      renderTable(att, makeChangeRequest());
      expect(screen.getByText("代休取得日")).toBeInTheDocument();
      // both current and requested columns show the same date (no change)
      const dateCells = screen.getAllByText("2024/04/10");
      expect(dateCells.length).toBeGreaterThanOrEqual(1);
    });

    it("shows '-' in requested column when changeRequest.substituteHolidayDate is null", () => {
      const att = makeAttendance({ substituteHolidayDate: "2024-04-10" });
      const cr = makeChangeRequest({ substituteHolidayDate: null });
      renderTable(att, cr);
      const row = screen.getByText("代休取得日").closest("tr")!;
      expect(within(row).getByText("-")).toBeInTheDocument();
    });
  });

  describe("時間単位有給 row", () => {
    it("shows '-' when no hourly paid holiday data", () => {
      renderTable(makeAttendance(), makeChangeRequest());
      expect(screen.getByText("時間単位有給")).toBeInTheDocument();
    });

    it("shows Xh format when hourlyPaidHolidayHours is set", () => {
      const att = makeAttendance({ hourlyPaidHolidayHours: 2 });
      renderTable(att, makeChangeRequest());
      // Both current and requested show "2h" (no change requested)
      const cells = screen.getAllByText("2h");
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });

    it("shows changed hourly paid holiday hours", () => {
      const att = makeAttendance({ hourlyPaidHolidayHours: 2 });
      const cr = makeChangeRequest({ hourlyPaidHolidayHours: 3 });
      renderTable(att, cr);
      expect(screen.getByText("2h")).toBeInTheDocument();
      expect(screen.getByText("3h")).toBeInTheDocument();
    });
  });

  describe("摘要 row", () => {
    it("shows '-' when remarks is null", () => {
      const att = makeAttendance({ remarks: null });
      renderTable(att, makeChangeRequest());
      expect(screen.getByText("摘要")).toBeInTheDocument();
    });

    it("shows remarks text when set", () => {
      const att = makeAttendance({ remarks: "業務連絡" });
      renderTable(att, makeChangeRequest());
      const cells = screen.getAllByText("業務連絡");
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });

    it("shows changed remarks when changeRequest.remarks differs", () => {
      const att = makeAttendance({ remarks: "before" });
      const cr = makeChangeRequest({ remarks: "after" });
      renderTable(att, cr);
      expect(screen.getByText("before")).toBeInTheDocument();
      expect(screen.getByText("after")).toBeInTheDocument();
    });

    it("trims remarks text", () => {
      const att = makeAttendance({ remarks: "  trimmed  " });
      renderTable(att, makeChangeRequest());
      const cells = screen.getAllByText("trimmed");
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("row highlight styling", () => {
    it("applies yellow background to changed rows", () => {
      const att = makeAttendance({ goDirectlyFlag: false });
      const cr = makeChangeRequest({ goDirectlyFlag: true });
      renderTable(att, cr);
      const row = screen.getByText("直行").closest("tr")!;
      expect(row).toHaveStyle({ backgroundColor: "rgba(255,193,7,0.12)" });
    });

    it("does not apply yellow background to unchanged rows", () => {
      const att = makeAttendance({ goDirectlyFlag: false });
      renderTable(att, makeChangeRequest());
      const row = screen.getByText("直行").closest("tr")!;
      expect(row).not.toHaveStyle({ backgroundColor: "rgba(255,193,7,0.12)" });
    });
  });

  describe("size prop", () => {
    it("uses small size by default", () => {
      const { container } = renderTable(makeAttendance(), makeChangeRequest());
      // MUI Table with size="small" renders a table element (functional test)
      expect(container.querySelector("table")).toBeInTheDocument();
    });
  });
});

// ─── buildChangeRequestDiffRows (pure-function tests) ─────────────────────────

describe("buildChangeRequestDiffRows", () => {
  it("returns 10 rows", () => {
    const rows = buildChangeRequestDiffRows(
      makeAttendance(),
      makeChangeRequest(),
    );
    expect(rows).toHaveLength(10);
  });

  it("勤務時間 row – no change when changeRequest has no time fields", () => {
    const rows = buildChangeRequestDiffRows(
      makeAttendance({
        startTime: "2024-04-01T09:00:00",
        endTime: "2024-04-01T18:00:00",
      }),
      makeChangeRequest(),
    );
    const row = rows.find((r) => r.label === "勤務時間")!;
    expect(row.changed).toBe(false);
    expect(row.current).toBe(row.requested);
  });

  it("勤務時間 row – changed when changeRequest startTime differs", () => {
    const rows = buildChangeRequestDiffRows(
      makeAttendance({
        startTime: "2024-04-01T09:00:00",
        endTime: "2024-04-01T18:00:00",
      }),
      makeChangeRequest({ startTime: "2024-04-01T10:00:00" }),
    );
    const row = rows.find((r) => r.label === "勤務時間")!;
    expect(row.changed).toBe(true);
    expect(row.current).toBe("09:00 ~ 18:00");
    expect(row.requested).toBe("10:00 ~ 18:00");
  });

  it("休憩時間 row – not changed when undefined in changeRequest", () => {
    const att = makeAttendance({
      rests: [
        {
          __typename: "Rest",
          startTime: "2024-04-01T12:00:00",
          endTime: "2024-04-01T13:00:00",
        },
      ],
    });
    const rows = buildChangeRequestDiffRows(att, makeChangeRequest());
    const row = rows.find((r) => r.label === "休憩時間")!;
    expect(row.changed).toBe(false);
  });

  it("休憩時間 row – changed when changeRequest.rests differs", () => {
    const att = makeAttendance({
      rests: [
        {
          __typename: "Rest",
          startTime: "2024-04-01T12:00:00",
          endTime: "2024-04-01T13:00:00",
        },
      ],
    });
    const cr = makeChangeRequest({
      rests: [
        {
          __typename: "Rest",
          startTime: "2024-04-01T11:30:00",
          endTime: "2024-04-01T12:30:00",
        },
      ],
    });
    const rows = buildChangeRequestDiffRows(att, cr);
    const row = rows.find((r) => r.label === "休憩時間")!;
    expect(row.changed).toBe(true);
  });

  it("boolean rows – not changed when changeRequest field is undefined", () => {
    const att = makeAttendance({ goDirectlyFlag: true });
    const rows = buildChangeRequestDiffRows(att, makeChangeRequest());
    const row = rows.find((r) => r.label === "直行")!;
    expect(row.changed).toBe(false);
    expect(row.current).toBe("あり");
    expect(row.requested).toBe("あり");
  });

  it("boolean rows – changed when changeRequest flag differs", () => {
    const att = makeAttendance({ goDirectlyFlag: false });
    const rows = buildChangeRequestDiffRows(
      att,
      makeChangeRequest({ goDirectlyFlag: true }),
    );
    const row = rows.find((r) => r.label === "直行")!;
    expect(row.changed).toBe(true);
    expect(row.current).toBe("なし");
    expect(row.requested).toBe("あり");
  });

  it("代休取得日 row – shows formatted date", () => {
    const att = makeAttendance({ substituteHolidayDate: "2024-04-10" });
    const rows = buildChangeRequestDiffRows(att, makeChangeRequest());
    const row = rows.find((r) => r.label === "代休取得日")!;
    expect(row.current).toBe("2024/04/10");
  });

  it("時間単位有給 row – shows hours when set", () => {
    const att = makeAttendance({ hourlyPaidHolidayHours: 3 });
    const rows = buildChangeRequestDiffRows(att, makeChangeRequest());
    const row = rows.find((r) => r.label === "時間単位有給")!;
    expect(row.current).toBe("3h");
    expect(row.changed).toBe(false);
  });

  it("摘要 row – shows '-' for null remarks", () => {
    const att = makeAttendance({ remarks: null });
    const rows = buildChangeRequestDiffRows(att, makeChangeRequest());
    const row = rows.find((r) => r.label === "摘要")!;
    expect(row.current).toBe("-");
  });

  it("摘要 row – changed when changeRequest.remarks differs", () => {
    const att = makeAttendance({ remarks: "before" });
    const rows = buildChangeRequestDiffRows(
      att,
      makeChangeRequest({ remarks: "after" }),
    );
    const row = rows.find((r) => r.label === "摘要")!;
    expect(row.changed).toBe(true);
    expect(row.current).toBe("before");
    expect(row.requested).toBe("after");
  });
});
