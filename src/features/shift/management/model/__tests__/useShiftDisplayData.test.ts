import { renderHook } from "@testing-library/react";
import dayjs from "dayjs";

import type { ShiftState } from "../../lib/generateMockShifts";
import { useShiftDisplayData } from "../useShiftDisplayData";

// ---- モック定義 ----

const mockUseShiftRequestAssignments = jest.fn();

jest.mock("../useShiftRequestAssignments", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseShiftRequestAssignments(...args),
}));

const mockPersistShiftRequestChanges = jest.fn();

const makeDefaultAssignmentsResult = (
  overrides: {
    shiftRequestAssignments?: Map<string, Record<string, ShiftState>>;
    shiftRequestsLoading?: boolean;
    shiftRequestsError?: string | null;
  } = {}
) => ({
  shiftRequestAssignments:
    overrides.shiftRequestAssignments ?? new Map<string, Record<string, ShiftState>>(),
  shiftRequestHistoryMeta: new Map(),
  shiftRequestsLoading: overrides.shiftRequestsLoading ?? false,
  shiftRequestsError: overrides.shiftRequestsError ?? null,
  persistShiftRequestChanges: mockPersistShiftRequestChanges,
});

/** テスト用スタッフオブジェクトを最小限の型で生成 */
const makeStaff = (id: string) =>
  ({
    id,
    cognitoUserId: `cognito-${id}`,
    familyName: "テスト",
    givenName: "太郎",
    mailAddress: `${id}@example.com`,
    owner: false,
    role: "Staff",
    enabled: true,
    status: "CONFIRMED",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  }) as unknown as Parameters<typeof useShiftDisplayData>[0]["shiftStaffs"][0];

// ---- テスト ----

describe("useShiftDisplayData", () => {
  // params はコールバック外で定義して不要な再レンダーを防ぐ
  const monthStart = dayjs("2024-01-01");
  const days = [dayjs("2024-01-01"), dayjs("2024-01-02")];

  const baseParams = {
    shiftStaffs: [] as ReturnType<typeof makeStaff>[],
    groupedShiftStaffs: [],
    monthStart,
    days,
    cognitoUserId: "user-1",
    isAuthenticated: true,
    shiftPlanPlans: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseShiftRequestAssignments.mockReturnValue(makeDefaultAssignmentsResult());
  });

  it('scenario は常に "actual" を返す', () => {
    const { result } = renderHook(() => useShiftDisplayData(baseParams));
    expect(result.current.scenario).toBe("actual");
  });

  it("isAuthenticated=true のとき enabled=true で useShiftRequestAssignments を呼ぶ", () => {
    const params = { ...baseParams, isAuthenticated: true };
    renderHook(() => useShiftDisplayData(params));
    expect(mockUseShiftRequestAssignments).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true })
    );
  });

  it("isAuthenticated=false のとき enabled=false で useShiftRequestAssignments を呼ぶ", () => {
    const params = { ...baseParams, isAuthenticated: false };
    renderHook(() => useShiftDisplayData(params));
    expect(mockUseShiftRequestAssignments).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    );
  });

  it("displayShifts は shiftRequestAssignments のデータをスタッフごとに返す", () => {
    const staff = makeStaff("staff-1");
    const assignments = new Map([
      ["staff-1", { "2024-01-01": "work" as ShiftState }],
    ]);
    mockUseShiftRequestAssignments.mockReturnValue(
      makeDefaultAssignmentsResult({ shiftRequestAssignments: assignments })
    );
    const params = { ...baseParams, shiftStaffs: [staff] };
    const { result } = renderHook(() => useShiftDisplayData(params));
    expect(result.current.displayShifts.get("staff-1")).toEqual({
      "2024-01-01": "work",
    });
  });

  it("shiftRequestAssignments に存在しないスタッフの displayShifts は空オブジェクト", () => {
    const staff = makeStaff("staff-2");
    mockUseShiftRequestAssignments.mockReturnValue(
      makeDefaultAssignmentsResult({ shiftRequestAssignments: new Map() })
    );
    const params = { ...baseParams, shiftStaffs: [staff] };
    const { result } = renderHook(() => useShiftDisplayData(params));
    expect(result.current.displayShifts.get("staff-2")).toEqual({});
  });

  it("shiftRequestsLoading は useShiftRequestAssignments の loading 値を伝播する", () => {
    mockUseShiftRequestAssignments.mockReturnValue(
      makeDefaultAssignmentsResult({ shiftRequestsLoading: true })
    );
    const { result } = renderHook(() => useShiftDisplayData(baseParams));
    expect(result.current.shiftRequestsLoading).toBe(true);
  });

  it("dailyCounts は work 状態のスタッフ数を日ごとに集計する", () => {
    const staff = makeStaff("staff-1");
    const assignments = new Map([
      [
        "staff-1",
        {
          "2024-01-01": "work" as ShiftState,
          "2024-01-02": "fixedOff" as ShiftState,
        },
      ],
    ]);
    mockUseShiftRequestAssignments.mockReturnValue(
      makeDefaultAssignmentsResult({ shiftRequestAssignments: assignments })
    );
    const params = { ...baseParams, shiftStaffs: [staff] };
    const { result } = renderHook(() => useShiftDisplayData(params));
    expect(result.current.dailyCounts.get("2024-01-01")).toBe(1);
    expect(result.current.dailyCounts.get("2024-01-02")).toBe(0);
  });

  it("persistShiftRequestChanges は useShiftRequestAssignments から伝播される", () => {
    mockUseShiftRequestAssignments.mockReturnValue(
      makeDefaultAssignmentsResult()
    );
    const { result } = renderHook(() => useShiftDisplayData(baseParams));
    expect(result.current.persistShiftRequestChanges).toBe(
      mockPersistShiftRequestChanges
    );
  });
});
