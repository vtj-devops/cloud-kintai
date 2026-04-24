import { act, renderHook, waitFor } from "@testing-library/react";
import type { UseFormGetValues } from "react-hook-form";

import type { AttendanceEditInputs } from "../common";
import { useAttendanceRecord } from "../useAttendanceRecord";
import { createMockAttendanceRecordParams, createMockLogger } from "./testUtils";

// ---- モック定義 ----

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

const mockTriggerGetAttendance = jest.fn();
let mockAttendanceQueryData: unknown = undefined;

jest.mock("@entities/attendance/api/attendanceApi", () => ({
  useLazyGetAttendanceByStaffAndDateQuery: () => [
    mockTriggerGetAttendance,
    { data: mockAttendanceQueryData },
  ],
}));

const fetchStaffMock = jest.fn();
jest.mock("@entities/staff/model/useStaff/fetchStaff", () => ({
  __esModule: true,
  default: (...args: unknown[]) => fetchStaffMock(...args),
}));

jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((payload) => ({
    type: "notification/push",
    payload,
  })),
}));

// ---- テスト用定数 ----

const mockFetchedStaff = {
  id: "staff-id-1",
  cognitoUserId: "cognito-id-1",
  familyName: "テスト",
  givenName: "太郎",
  mailAddress: "test@example.com",
  owner: false,
  role: "STAFF" as const,
  enabled: true,
  status: "active" as const,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  usageStartDate: null,
  notifications: null,
  workType: null,
};

const historyEntry = {
  startTime: "2024-01-15T09:00:00.000Z",
  endTime: "2024-01-15T18:00:00.000Z",
  goDirectlyFlag: true,
  returnDirectlyFlag: false,
  paidHolidayFlag: false,
  specialHolidayFlag: false,
  remarks: "テスト備考",
  substituteHolidayDate: null,
  rests: [
    {
      startTime: "2024-01-15T12:00:00.000Z",
      endTime: "2024-01-15T13:00:00.000Z",
    },
  ],
  hourlyPaidHolidayTimes: [],
  createdAt: "2024-01-15T10:00:00.000Z",
};

// ----------------------------------------------------------------
// IMPORTANT: params をコールバックの外で生成し参照を安定させる。
// renderHook コールバック内で makeParams() を毎回呼ぶと、logger や
// setValue 等が毎レンダーで新オブジェクトとなり useEffect の依存配列が
// 変化して無限ループが発生する。
// ----------------------------------------------------------------

describe("useAttendanceRecord", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAttendanceQueryData = undefined;
    mockTriggerGetAttendance.mockReturnValue({
      unwrap: () => Promise.resolve(null),
    });
    fetchStaffMock.mockResolvedValue(mockFetchedStaff);
  });

  // ----------------------------------------------------------------
  // 初期状態
  // ----------------------------------------------------------------
  describe("初期状態", () => {
    it("targetStaffId / targetWorkDate が未指定のとき正しい初期値を返す", async () => {
      // params を外側で生成して参照を安定させる
      const params = createMockAttendanceRecordParams();

      const { result } = renderHook(() => useAttendanceRecord(params));

      // staff が null になるまで待つ（useEffect の結果）
      await waitFor(() => {
        expect(result.current.staff).toBeNull();
      });

      expect(result.current.attendance).toBeNull();
      expect(result.current.workDate).toBeNull();
      expect(result.current.historiesLoading).toBe(false);
      expect(result.current.sortedHistories).toEqual([]);
      expect(result.current.historyIndex).toBe(0);
      expect(result.current.hasAttendanceFetched).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // スタッフ取得
  // ----------------------------------------------------------------
  describe("スタッフ取得（targetStaffId が指定されたとき）", () => {
    it("fetchStaff が targetStaffId で呼ばれる", async () => {
      const params = createMockAttendanceRecordParams({
      targetStaffId: "staff-001",
    });

      renderHook(() => useAttendanceRecord(params));

      await waitFor(() => {
        expect(fetchStaffMock).toHaveBeenCalledWith("staff-001");
      });
    });

    it("fetchStaff 成功時に staff がセットされる", async () => {
      const params = createMockAttendanceRecordParams({
      targetStaffId: "staff-001",
    });

      const { result } = renderHook(() => useAttendanceRecord(params));

      await waitFor(() => {
        expect(result.current.staff).not.toBeUndefined();
        expect(result.current.staff?.id).toBe("staff-id-1");
        expect(result.current.staff?.cognitoUserId).toBe("cognito-id-1");
      });
    });

    it("fetchStaff 失敗時に staff = null になり dispatch が呼ばれる", async () => {
      fetchStaffMock.mockRejectedValue(new Error("Network error"));

      const mockLogger = createMockLogger();
      const params = createMockAttendanceRecordParams({
      targetStaffId: "staff-001",
      logger: mockLogger,
    });

      const { result } = renderHook(() => useAttendanceRecord(params));

      await waitFor(() => {
        expect(result.current.staff).toBeNull();
        expect(mockDispatch).toHaveBeenCalled();
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("staff-001"),
      );
    });
  });

  // ----------------------------------------------------------------
  // 勤怠データ取得
  // ----------------------------------------------------------------
  describe("勤怠データ取得（staff + targetWorkDate が揃ったとき）", () => {
    it("triggerGetAttendance が staff.cognitoUserId と targetWorkDate で呼ばれる", async () => {
      const params = createMockAttendanceRecordParams({
      targetStaffId: "staff-001",
      targetWorkDate: "2024-01-15",
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
    });

      renderHook(() => useAttendanceRecord(params));

      await waitFor(() => {
        expect(mockTriggerGetAttendance).toHaveBeenCalledWith(
          expect.objectContaining({
            staffId: "cognito-id-1",
            workDate: expect.any(String),
          }),
        );
      });
    });

    it("triggerGetAttendance が null を返したとき reset / setValue('workDate') が呼ばれる", async () => {
      const mockReset = jest.fn();
      const mockSetValue = jest.fn();
      const mockRestReplace = jest.fn();
      const mockHourlyPaidHolidayTimeReplace = jest.fn();
      const mockSystemCommentReplace = jest.fn();

      mockTriggerGetAttendance.mockReturnValue({
        unwrap: () => Promise.resolve(null),
      });

      const params = createMockAttendanceRecordParams({
      targetStaffId: "staff-001",
      targetWorkDate: "2024-01-15",
      setValue: mockSetValue,
      reset: mockReset,
      restReplace: mockRestReplace,
      hourlyPaidHolidayTimeReplace: mockHourlyPaidHolidayTimeReplace,
      systemCommentReplace: mockSystemCommentReplace,
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
    });

      renderHook(() => useAttendanceRecord(params));

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
        expect(mockSetValue).toHaveBeenCalledWith(
          "workDate",
          expect.any(String),
        );
      });
    });

    it("triggerGetAttendance 失敗時に dispatch が呼ばれる", async () => {
      mockTriggerGetAttendance.mockReturnValue({
        unwrap: () => Promise.reject(new Error("API error")),
      });

      const params = createMockAttendanceRecordParams({
      targetStaffId: "staff-001",
      targetWorkDate: "2024-01-15",
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
    });

      renderHook(() => useAttendanceRecord(params));

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });
  });

  // ----------------------------------------------------------------
  // applyHistory
  // ----------------------------------------------------------------
  describe("applyHistory", () => {
    it("applyHistory(0) が form の setValue を正しく呼ぶ（sortedHistories が空の場合は何もしない）", () => {
      // attendance が null → sortedHistories = []
      const mockSetValue = jest.fn();
      const params = createMockAttendanceRecordParams({
      setValue: mockSetValue,
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
    });

      const { result } = renderHook(() => useAttendanceRecord(params));

      act(() => {
        result.current.applyHistory(0);
      });

      // sortedHistories が空なので setValue は呼ばれない
      expect(mockSetValue).not.toHaveBeenCalled();
    });

    it("sortedHistories が存在するとき applyHistory(0) が各フィールドに setValue を呼ぶ", () => {
      // attendance に histories を注入
      mockAttendanceQueryData = {
        id: "att-1",
        workDate: "2024-01-15",
        startTime: null,
        endTime: null,
        histories: [historyEntry],
        rests: [],
        systemComments: [],
        hourlyPaidHolidayTimes: [],
        changeRequests: [],
      };

      const mockSetValue = jest.fn();
      const mockRestReplace = jest.fn();
      const mockHourlyPaidHolidayTimeReplace = jest.fn();

      const params = createMockAttendanceRecordParams({
      setValue: mockSetValue,
      restReplace: mockRestReplace,
      hourlyPaidHolidayTimeReplace: mockHourlyPaidHolidayTimeReplace,
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
    });

      const { result } = renderHook(() => useAttendanceRecord(params));

      // sortedHistories が存在することを確認
      expect(result.current.sortedHistories).toHaveLength(1);

      // 呼び出し記録をクリアして applyHistory の呼び出しのみを検証
      mockSetValue.mockClear();
      mockRestReplace.mockClear();
      mockHourlyPaidHolidayTimeReplace.mockClear();

      act(() => {
        result.current.applyHistory(0);
      });

      expect(mockSetValue).toHaveBeenCalledWith("startTime", historyEntry.startTime);
      expect(mockSetValue).toHaveBeenCalledWith("endTime", historyEntry.endTime);
      expect(mockSetValue).toHaveBeenCalledWith("goDirectlyFlag", true);
      expect(mockSetValue).toHaveBeenCalledWith("returnDirectlyFlag", false);
      expect(mockSetValue).toHaveBeenCalledWith("remarks", "テスト備考");
      expect(mockRestReplace).toHaveBeenCalledWith([
        {
          startTime: "2024-01-15T12:00:00.000Z",
          endTime: "2024-01-15T13:00:00.000Z",
        },
      ]);
      expect(mockHourlyPaidHolidayTimeReplace).toHaveBeenCalledWith([]);

      // クリーンアップ
      mockAttendanceQueryData = undefined;
    });

    it("存在しないインデックスを指定しても applyHistory は何もしない", () => {
      const mockSetValue = jest.fn();
      const params = createMockAttendanceRecordParams({
      setValue: mockSetValue,
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
    });

      const { result } = renderHook(() => useAttendanceRecord(params));

      act(() => {
        result.current.applyHistory(99);
      });

      expect(mockSetValue).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------
  // setHistoryIndex
  // ----------------------------------------------------------------
  describe("setHistoryIndex", () => {
    it("setHistoryIndex で historyIndex が更新される", () => {
      const params = createMockAttendanceRecordParams();

      const { result } = renderHook(() => useAttendanceRecord(params));

      act(() => {
        result.current.setHistoryIndex(2);
      });

      expect(result.current.historyIndex).toBe(2);
    });
  });

  // ----------------------------------------------------------------
  // refetchAttendance
  // ----------------------------------------------------------------
  describe("refetchAttendance", () => {
    it("staff がないとき refetchAttendance は triggerGetAttendance を呼ばない", async () => {
      const params = createMockAttendanceRecordParams({
      targetWorkDate: "2024-01-15",
    });

      const { result } = renderHook(() => useAttendanceRecord(params));

      // staff が null になるまで待つ
      await waitFor(() => expect(result.current.staff).toBeNull());

      mockTriggerGetAttendance.mockClear();

      await act(async () => {
        await result.current.refetchAttendance();
      });

      expect(mockTriggerGetAttendance).not.toHaveBeenCalled();
    });

    it("staff と targetWorkDate が揃っているとき refetchAttendance が triggerGetAttendance を呼ぶ", async () => {
      const params = createMockAttendanceRecordParams({
      targetStaffId: "staff-001",
      targetWorkDate: "2024-01-15",
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
    });

      const { result } = renderHook(() => useAttendanceRecord(params));

      // staff が解決されるまで待つ
      await waitFor(() => {
        expect(result.current.staff).not.toBeUndefined();
        expect(result.current.staff).not.toBeNull();
      });

      mockTriggerGetAttendance.mockClear();

      await act(async () => {
        await result.current.refetchAttendance();
      });

      expect(mockTriggerGetAttendance).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: "cognito-id-1",
          workDate: expect.any(String),
        }),
      );
    });

    it("refetchAttendance 失敗時に historiesLoading が false に戻る", async () => {
      mockTriggerGetAttendance.mockReturnValue({
        unwrap: () => Promise.reject(new Error("refetch error")),
      });

      const mockLogger = createMockLogger();
      const params = createMockAttendanceRecordParams({
      targetStaffId: "staff-001",
      targetWorkDate: "2024-01-15",
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
      logger: mockLogger,
    });

      const { result } = renderHook(() => useAttendanceRecord(params));

      await waitFor(() => {
        expect(result.current.staff).not.toBeUndefined();
        expect(result.current.staff).not.toBeNull();
      });

      await act(async () => {
        await result.current.refetchAttendance();
      });

      expect(result.current.historiesLoading).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // sortedHistories のソート順
  // ----------------------------------------------------------------
  describe("sortedHistories のソート", () => {
    it("histories は createdAt の降順（新しい順）でソートされる", () => {
      const older = {
        startTime: "2024-01-15T09:00:00.000Z",
        endTime: "2024-01-15T18:00:00.000Z",
        goDirectlyFlag: false,
        returnDirectlyFlag: false,
        paidHolidayFlag: false,
        specialHolidayFlag: false,
        remarks: "",
        substituteHolidayDate: null,
        rests: [],
        hourlyPaidHolidayTimes: [],
        createdAt: "2024-01-15T08:00:00.000Z",
      };
      const newer = {
        ...older,
        createdAt: "2024-01-15T10:00:00.000Z",
      };

      mockAttendanceQueryData = {
        id: "att-1",
        workDate: "2024-01-15",
        startTime: null,
        endTime: null,
        histories: [older, newer], // 古い順で渡す
        rests: [],
        systemComments: [],
        hourlyPaidHolidayTimes: [],
        changeRequests: [],
      };

      const params = createMockAttendanceRecordParams({
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
    });

      const { result } = renderHook(() => useAttendanceRecord(params));

      // 新しい順（降順）にソートされている
      expect(result.current.sortedHistories[0].createdAt).toBe(
        "2024-01-15T10:00:00.000Z",
      );
      expect(result.current.sortedHistories[1].createdAt).toBe(
        "2024-01-15T08:00:00.000Z",
      );

      mockAttendanceQueryData = undefined;
    });
  });

  // ----------------------------------------------------------------
  // hasAttendanceFetched
  // ----------------------------------------------------------------
  describe("hasAttendanceFetched", () => {
    it("attendanceData が undefined のとき hasAttendanceFetched = false", () => {
      mockAttendanceQueryData = undefined;
      const params = createMockAttendanceRecordParams();
      const { result } = renderHook(() => useAttendanceRecord(params));
      expect(result.current.hasAttendanceFetched).toBe(false);
    });

    it("attendanceData が null のとき hasAttendanceFetched = true", () => {
      mockAttendanceQueryData = null;
      const params = createMockAttendanceRecordParams({
      getValues: jest.fn(() => []) as unknown as UseFormGetValues<AttendanceEditInputs>,
    });
      const { result } = renderHook(() => useAttendanceRecord(params));
      expect(result.current.hasAttendanceFetched).toBe(true);
      mockAttendanceQueryData = undefined;
    });
  });
});
