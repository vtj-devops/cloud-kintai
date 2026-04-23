import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { Attendance, AttendanceChangeRequest , Staff } from "@shared/api/graphql/types";
import { createMockAttendance, createMockStaff } from "@shared/test-utils";
import { act, renderHook } from "@testing-library/react";
import { MutableRefObject } from "react";

import { useAdminAttendanceChangeRequests } from "../useAdminAttendanceChangeRequests";

// ─────────────────────────────────────────
// モック: react-redux
// useDispatch だけ差し替え、RTK Query が必要とする useSelector/useStore は実装を維持する
// ─────────────────────────────────────────
jest.mock("react-redux", () => ({
  ...jest.requireActual<typeof import("react-redux")>("react-redux"),
  useDispatch: jest.fn(),
}));

// ─────────────────────────────────────────
// モック: handleApproveChangeRequest
// ─────────────────────────────────────────
const mockHandleApproveChangeRequest = jest.fn();
jest.mock(
  "@features/attendance/edit/ui/ChangeRequestDialog/handleApproveChangeRequest",
  () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockHandleApproveChangeRequest(...args),
  }),
);

// ─────────────────────────────────────────
// モック: GenericMailSender
// ─────────────────────────────────────────
const mockApproveChangeRequest = jest.fn().mockResolvedValue(undefined);
jest.mock("@shared/lib/mail/GenericMailSender", () => ({
  GenericMailSender: jest.fn().mockImplementation(() => ({
    approveChangeRequest: mockApproveChangeRequest,
  })),
}));

// ─────────────────────────────────────────
// モック: createLogger（ログ出力を抑制）
// ─────────────────────────────────────────
jest.mock("@shared/lib/logger", () => ({
  createLogger: () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }),
}));

// ─────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────

/** 未承認の変更リクエストを 1 件持つ Attendance を作成する */
const createAttendanceWithPendingRequest = (
  id: string = "att-1",
  overrides?: Partial<AttendanceChangeRequest>,
): Attendance =>
  createMockAttendance({
    id,
    workDate: `2024-01-0${id.slice(-1) || "1"}`,
    changeRequests: [
      {
        __typename: "AttendanceChangeRequest",
        startTime: "09:00",
        endTime: "18:00",
        goDirectlyFlag: false,
        returnDirectlyFlag: false,
        remarks: null,
        rests: [],
        hourlyPaidHolidayTimes: [],
        hourlyPaidHolidayHours: null,
        paidHolidayFlag: false,
        specialHolidayFlag: false,
        substituteHolidayDate: null,
        completed: false,
        comment: null,
        ...overrides,
      },
    ],
  });

const mockGraphqlStaff: Staff = {
  __typename: "Staff",
  id: "staff-1",
  cognitoUserId: "cognito-1",
  mailAddress: "staff@example.com",
  role: "Staff",
  enabled: true,
  status: "CONFIRMED",
  owner: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const createDefaultParams = (
  overrides: Partial<Parameters<typeof useAdminAttendanceChangeRequests>[0]> = {},
) => ({
  staffId: "staff-1",
  staff: mockGraphqlStaff as Staff,
  staffForMail: createMockStaff() as StaffType,
  pendingAttendances: [] as Attendance[],
  updateAttendance: jest.fn(),
  isBulkApprovingRef: { current: false } as MutableRefObject<boolean>,
  ...overrides,
});

// ─────────────────────────────────────────
// テスト
// ─────────────────────────────────────────

describe("useAdminAttendanceChangeRequests", () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      jest.requireMock("react-redux") as { useDispatch: jest.Mock }
    ).useDispatch.mockReturnValue(mockDispatch);
    mockApproveChangeRequest.mockResolvedValue(undefined);
  });

  // ── 初期状態 ──────────────────────────────────────────────────────

  it("初期状態では quickViewOpen=false かつ selectedAttendanceIds=[] であること", () => {
    // params を renderHook コールバック外で固定し、再レンダリングで新参照が生成されないようにする
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    expect(result.current.quickViewOpen).toBe(false);
    expect(result.current.selectedAttendanceIds).toEqual([]);
    expect(result.current.bulkApproving).toBe(false);
    expect(result.current.quickViewAttendance).toBeNull();
    expect(result.current.quickViewChangeRequest).toBeNull();
  });

  // ── handleOpenQuickView ────────────────────────────────────────────

  it("handleOpenQuickView: 未承認の変更リクエストがある場合、クイックビューが開くこと", () => {
    const attendance = createAttendanceWithPendingRequest("att-1");
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.handleOpenQuickView(attendance);
    });

    expect(result.current.quickViewOpen).toBe(true);
    expect(result.current.quickViewAttendance).toEqual(attendance);
    expect(result.current.quickViewChangeRequest).not.toBeNull();
    expect(result.current.quickViewChangeRequest?.completed).toBe(false);
  });

  it("handleOpenQuickView: 変更リクエストがない場合、クイックビューが開かないこと", () => {
    const attendance = createMockAttendance({ changeRequests: [] });
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.handleOpenQuickView(attendance);
    });

    expect(result.current.quickViewOpen).toBe(false);
    expect(result.current.quickViewAttendance).toBeNull();
  });

  it("handleOpenQuickView: 承認済みの変更リクエストのみの場合、クイックビューが開かないこと", () => {
    const attendance = createMockAttendance({
      changeRequests: [
        {
          __typename: "AttendanceChangeRequest",
          completed: true,
          startTime: "09:00",
          endTime: "18:00",
          goDirectlyFlag: false,
          returnDirectlyFlag: false,
          remarks: null,
          rests: [],
          hourlyPaidHolidayTimes: [],
          hourlyPaidHolidayHours: null,
          paidHolidayFlag: false,
          specialHolidayFlag: false,
          substituteHolidayDate: null,
          comment: null,
        },
      ],
    });
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.handleOpenQuickView(attendance);
    });

    expect(result.current.quickViewOpen).toBe(false);
  });

  // ── handleCloseQuickView ───────────────────────────────────────────

  it("handleCloseQuickView: クイックビューが閉じること", () => {
    const attendance = createAttendanceWithPendingRequest("att-1");
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.handleOpenQuickView(attendance);
    });
    act(() => {
      result.current.handleCloseQuickView();
    });

    expect(result.current.quickViewOpen).toBe(false);
    expect(result.current.quickViewAttendance).toBeNull();
    expect(result.current.quickViewChangeRequest).toBeNull();
  });

  // ── toggleAttendanceSelection / isAttendanceSelected ──────────────

  it("toggleAttendanceSelection: 未選択の勤怠 ID を追加すること", () => {
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.toggleAttendanceSelection("att-1");
    });

    expect(result.current.selectedAttendanceIds).toContain("att-1");
    expect(result.current.isAttendanceSelected("att-1")).toBe(true);
  });

  it("toggleAttendanceSelection: 選択済みの勤怠 ID を削除すること", () => {
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.toggleAttendanceSelection("att-1");
    });
    act(() => {
      result.current.toggleAttendanceSelection("att-1");
    });

    expect(result.current.selectedAttendanceIds).not.toContain("att-1");
    expect(result.current.isAttendanceSelected("att-1")).toBe(false);
  });

  it("isAttendanceSelected: 未選択の勤怠 ID に false を返すこと", () => {
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    expect(result.current.isAttendanceSelected("att-99")).toBe(false);
  });

  // ── toggleSelectAllPending ─────────────────────────────────────────

  it("toggleSelectAllPending: 全未対応勤怠を一括選択すること", () => {
    const att1 = createAttendanceWithPendingRequest("att-1");
    const att2 = createAttendanceWithPendingRequest("att-2");
    const params = createDefaultParams({ pendingAttendances: [att1, att2] });
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.toggleSelectAllPending();
    });

    expect(result.current.selectedAttendanceIds).toEqual(["att-1", "att-2"]);
  });

  it("toggleSelectAllPending: 全選択状態から全解除すること", () => {
    const att1 = createAttendanceWithPendingRequest("att-1");
    const att2 = createAttendanceWithPendingRequest("att-2");
    const params = createDefaultParams({ pendingAttendances: [att1, att2] });
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.toggleSelectAllPending();
    });
    act(() => {
      result.current.toggleSelectAllPending();
    });

    expect(result.current.selectedAttendanceIds).toEqual([]);
  });

  it("toggleSelectAllPending: pendingAttendances が空の場合、何もしないこと", () => {
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.toggleSelectAllPending();
    });

    expect(result.current.selectedAttendanceIds).toEqual([]);
  });

  // ── canBulkApprove ─────────────────────────────────────────────────

  it("canBulkApprove: staffForMail が存在する場合 true を返すこと", () => {
    const params = createDefaultParams({ staffForMail: createMockStaff() });
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    expect(result.current.canBulkApprove).toBe(true);
  });

  it("canBulkApprove: staffForMail が null の場合 false を返すこと", () => {
    const params = createDefaultParams({ staffForMail: null });
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    expect(result.current.canBulkApprove).toBe(false);
  });

  // ── handleBulkApprove ──────────────────────────────────────────────

  it("handleBulkApprove: 選択なしの場合、何もしないこと", async () => {
    const params = createDefaultParams();
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    await act(async () => {
      await result.current.handleBulkApprove();
    });

    expect(mockHandleApproveChangeRequest).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("handleBulkApprove: staffForMail が null の場合、早期リターンすること", async () => {
    const att1 = createAttendanceWithPendingRequest("att-1");
    const params = createDefaultParams({
      staffForMail: null,
      pendingAttendances: [att1],
    });
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.toggleAttendanceSelection("att-1");
    });

    await act(async () => {
      await result.current.handleBulkApprove();
    });

    expect(mockHandleApproveChangeRequest).not.toHaveBeenCalled();
  });

  it("handleBulkApprove: 一括承認が成功した場合、成功通知を dispatch すること", async () => {
    const att1 = createAttendanceWithPendingRequest("att-1");
    const updatedAttendance = createMockAttendance({ id: "att-1" });
    mockHandleApproveChangeRequest.mockResolvedValue(updatedAttendance);

    const params = createDefaultParams({ pendingAttendances: [att1] });
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.toggleAttendanceSelection("att-1");
    });

    await act(async () => {
      await result.current.handleBulkApprove();
    });

    expect(mockHandleApproveChangeRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ tone: "success" }),
      }),
    );
  });

  it("handleBulkApprove: updateAttendance が失敗した場合、エラー通知を dispatch すること", async () => {
    const att1 = createAttendanceWithPendingRequest("att-1");
    mockHandleApproveChangeRequest.mockRejectedValue(new Error("API Error"));

    const params = createDefaultParams({ pendingAttendances: [att1] });
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.toggleAttendanceSelection("att-1");
    });

    await act(async () => {
      await result.current.handleBulkApprove();
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ tone: "error" }),
      }),
    );
  });

  it("handleBulkApprove: 完了後 bulkApproving が false に戻ること", async () => {
    const att1 = createAttendanceWithPendingRequest("att-1");
    const updatedAttendance = createMockAttendance({ id: "att-1" });
    mockHandleApproveChangeRequest.mockResolvedValue(updatedAttendance);

    const params = createDefaultParams({ pendingAttendances: [att1] });
    const { result } = renderHook(() =>
      useAdminAttendanceChangeRequests(params),
    );

    act(() => {
      result.current.toggleAttendanceSelection("att-1");
    });

    await act(async () => {
      await result.current.handleBulkApprove();
    });

    expect(result.current.bulkApproving).toBe(false);
  });

  // ── useEffect: pendingAttendances 同期 ─────────────────────────────

  it("pendingAttendances から外れた勤怠 ID が selectedAttendanceIds から除去されること", () => {
    const att1 = createAttendanceWithPendingRequest("att-1");
    const att2 = createAttendanceWithPendingRequest("att-2");

    const { result, rerender } = renderHook(
      (props: { pending: Attendance[] }) => {
        // 毎レンダリングで params を再生成しない
        const params = createDefaultParams({ pendingAttendances: props.pending });
        return useAdminAttendanceChangeRequests(params);
      },
      { initialProps: { pending: [att1, att2] } },
    );

    act(() => {
      result.current.toggleAttendanceSelection("att-1");
      result.current.toggleAttendanceSelection("att-2");
    });

    expect(result.current.selectedAttendanceIds).toEqual(["att-1", "att-2"]);

    // att-2 が pending から外れる（att1 の配列は同一参照）
    rerender({ pending: [att1] });

    expect(result.current.selectedAttendanceIds).toContain("att-1");
    expect(result.current.selectedAttendanceIds).not.toContain("att-2");
  });
});
