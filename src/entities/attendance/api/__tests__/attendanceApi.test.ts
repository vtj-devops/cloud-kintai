/**
 * attendanceApi のユニットテスト
 *
 * テスト戦略:
 *  - RTK Query の queryFn を Redux store 経由で実行し、
 *    graphqlClient.graphql のモック戻り値を使って各ブランチをカバーする。
 *  - logOperationEvent はモックして副作用をスキップする。
 */

import { configureStore } from "@reduxjs/toolkit";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";

import {
  ATTENDANCE_DUPLICATE_CONFLICT,
  ATTENDANCE_REVISION_CONFLICT,
  attendanceApi,
} from "../attendanceApi";

// ---- モック ----

const logOperationEventMock = jest.fn();

jest.mock("@entities/operation-log/model/canonicalOperationLog", () => ({
  logOperationEvent: (...args: unknown[]) => logOperationEventMock(...args),
}));

// ---- テスト対象のインポート（モック定義より後） ----

// ---- ヘルパー ----

const graphqlMock = graphqlClient.graphql as jest.Mock;

/** テスト用 Redux ストアを生成する */
const makeStore = () =>
  configureStore({
    reducer: {
      [attendanceApi.reducerPath]: attendanceApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(attendanceApi.middleware),
  });

/** 標準的な Attendance オブジェクトを返す */
const makeAttendance = (overrides: Record<string, unknown> = {}) => ({
  __typename: "Attendance",
  id: "attendance#staff1#2024-01-15",
  staffId: "staff1",
  workDate: "2024-01-15",
  startTime: "09:00",
  endTime: "18:00",
  goDirectlyFlag: false,
  returnDirectlyFlag: false,
  absentFlag: false,
  rests: [],
  hourlyPaidHolidayTimes: [],
  remarks: "",
  paidHolidayFlag: false,
  specialHolidayFlag: false,
  isDeemedHoliday: false,
  substituteHolidayDate: null,
  changeRequests: [],
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
  revision: 1,
  ...overrides,
});

/** attendancesByStaffId レスポンスを組み立てる */
const makeListResponse = (items: unknown[], nextToken: string | null = null) => ({
  data: {
    attendancesByStaffId: { items, nextToken },
  },
});

/** getAttendance レスポンスを組み立てる */
const makeGetResponse = (attendance: unknown) => ({
  data: { getAttendance: attendance },
});

beforeEach(() => {
  jest.resetAllMocks();
  logOperationEventMock.mockResolvedValue(undefined);
});

// =============================================================================
// getAttendanceByStaffAndDate
// =============================================================================

describe("getAttendanceByStaffAndDate", () => {
  it("1件取得できた場合はその勤怠データを返す", async () => {
    const attendance = makeAttendance();
    graphqlMock.mockResolvedValue(makeListResponse([attendance]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.getAttendanceByStaffAndDate.initiate({
        staffId: "staff1",
        workDate: "2024-01-15",
      }),
    );

    expect(result.data).toEqual(attendance);
    expect(result.error).toBeUndefined();
  });

  it("0件の場合は null を返す", async () => {
    graphqlMock.mockResolvedValue(makeListResponse([]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.getAttendanceByStaffAndDate.initiate({
        staffId: "staff1",
        workDate: "2024-01-15",
      }),
    );

    expect(result.data).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it("2件以上の場合は DUPLICATE_CONFLICT エラーを返す", async () => {
    const attendance1 = makeAttendance({ id: "id1" });
    const attendance2 = makeAttendance({ id: "id2" });
    graphqlMock.mockResolvedValue(makeListResponse([attendance1, attendance2]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.getAttendanceByStaffAndDate.initiate({
        staffId: "staff1",
        workDate: "2024-01-15",
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { details?: { code?: string } })?.details?.code).toBe(
      ATTENDANCE_DUPLICATE_CONFLICT,
    );
  });

  it("GraphQL エラー時はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ errors: [{ message: "Network error" }] });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.getAttendanceByStaffAndDate.initiate({
        staffId: "staff1",
        workDate: "2024-01-15",
      }),
    );

    expect(result.error).toBeDefined();
  });

  it("connection が null の場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ data: { attendancesByStaffId: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.getAttendanceByStaffAndDate.initiate({
        staffId: "staff1",
        workDate: "2024-01-15",
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { message?: string })?.message).toContain(
      "Failed to fetch attendance",
    );
  });
});

// =============================================================================
// getAttendanceById
// =============================================================================

describe("getAttendanceById", () => {
  it("取得できた場合は勤怠データを返す", async () => {
    const attendance = makeAttendance();
    graphqlMock.mockResolvedValue(makeGetResponse(attendance));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.getAttendanceById.initiate({
        id: "attendance#staff1#2024-01-15",
      }),
    );

    expect(result.data).toEqual(attendance);
  });

  it("データが null の場合は null を返す", async () => {
    graphqlMock.mockResolvedValue({ data: { getAttendance: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.getAttendanceById.initiate({ id: "nonexistent" }),
    );

    expect(result.data).toBeNull();
  });

  it("GraphQL エラー時はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ errors: [{ message: "Not found" }] });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.getAttendanceById.initiate({ id: "bad-id" }),
    );

    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// listRecentAttendances
// =============================================================================

describe("listRecentAttendances", () => {
  it("正常レスポンスで attendances リストを返す", async () => {
    const attendance = makeAttendance();
    graphqlMock.mockResolvedValue(makeListResponse([attendance]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendances.initiate({
        staffId: "staff1",
        days: 7,
      }),
    );

    expect(result.data).toBeDefined();
    expect(result.data?.attendances).toHaveLength(7);
  });

  it("0件の場合は全日付プレースホルダーを返す", async () => {
    graphqlMock.mockResolvedValue(makeListResponse([]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendances.initiate({
        staffId: "staff1",
        days: 3,
      }),
    );

    expect(result.data?.attendances).toHaveLength(3);
    result.data?.attendances.forEach((a) => expect(a.id).toBe(""));
  });

  it("重複がある場合は DUPLICATE_CONFLICT エラーを返す", async () => {
    const a1 = makeAttendance({ id: "id1", workDate: "2024-01-15" });
    const a2 = makeAttendance({ id: "id2", workDate: "2024-01-15" });
    graphqlMock.mockResolvedValue(makeListResponse([a1, a2]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendances.initiate({
        staffId: "staff1",
        days: 30,
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { details?: { code?: string } })?.details?.code).toBe(
      ATTENDANCE_DUPLICATE_CONFLICT,
    );
  });

  it("GraphQL エラー時はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ errors: [{ message: "Server error" }] });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendances.initiate({
        staffId: "staff1",
      }),
    );

    expect(result.error).toBeDefined();
  });

  it("connection が null の場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ data: { attendancesByStaffId: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendances.initiate({
        staffId: "staff1",
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { message?: string })?.message).toContain(
      "Failed to fetch attendance",
    );
  });

  it("days が 0 以下の場合は safeDays = 1 として処理する", async () => {
    graphqlMock.mockResolvedValue(makeListResponse([]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendances.initiate({
        staffId: "staff1",
        days: 0,
      }),
    );

    expect(result.data?.attendances).toHaveLength(1);
  });
});

// =============================================================================
// listRecentAttendancesWithWarnings
// =============================================================================

describe("listRecentAttendancesWithWarnings", () => {
  it("正常レスポンスで attendances リストを返す", async () => {
    const attendance = makeAttendance();
    graphqlMock.mockResolvedValue(makeListResponse([attendance]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendancesWithWarnings.initiate({
        staffId: "staff1",
        days: 5,
      }),
    );

    expect(result.data?.attendances).toHaveLength(5);
  });

  it("重複がある場合は DUPLICATE_CONFLICT エラーを返す", async () => {
    const a1 = makeAttendance({ id: "id1", workDate: "2024-01-15" });
    const a2 = makeAttendance({ id: "id2", workDate: "2024-01-15" });
    graphqlMock.mockResolvedValue(makeListResponse([a1, a2]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendancesWithWarnings.initiate({
        staffId: "staff1",
        days: 30,
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { details?: { code?: string } })?.details?.code).toBe(
      ATTENDANCE_DUPLICATE_CONFLICT,
    );
  });

  it("GraphQL エラー時はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ errors: [{ message: "Server error" }] });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendancesWithWarnings.initiate({
        staffId: "staff1",
      }),
    );

    expect(result.error).toBeDefined();
  });

  it("connection が null の場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ data: { attendancesByStaffId: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listRecentAttendancesWithWarnings.initiate({
        staffId: "staff1",
      }),
    );

    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// listAttendancesByDateRange
// =============================================================================

describe("listAttendancesByDateRange", () => {
  it("日付範囲の勤怠を返す", async () => {
    const a1 = makeAttendance({ id: "id1", workDate: "2024-01-01" });
    const a2 = makeAttendance({ id: "id2", workDate: "2024-01-02" });
    graphqlMock.mockResolvedValue(makeListResponse([a1, a2]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRange.initiate({
        staffId: "staff1",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      }),
    );

    expect(result.data).toHaveLength(2);
  });

  it("nextToken によるページネーションを処理する", async () => {
    const a1 = makeAttendance({ id: "id1", workDate: "2024-01-01" });
    const a2 = makeAttendance({ id: "id2", workDate: "2024-01-02" });
    graphqlMock
      .mockResolvedValueOnce(makeListResponse([a1], "token123"))
      .mockResolvedValueOnce(makeListResponse([a2], null));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRange.initiate({
        staffId: "staff1",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      }),
    );

    expect(result.data).toHaveLength(2);
    expect(graphqlMock).toHaveBeenCalledTimes(2);
  });

  it("重複がある場合は DUPLICATE_CONFLICT エラーを返す", async () => {
    const a1 = makeAttendance({ id: "id1", workDate: "2024-01-01" });
    const a2 = makeAttendance({ id: "id2", workDate: "2024-01-01" });
    graphqlMock.mockResolvedValue(makeListResponse([a1, a2]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRange.initiate({
        staffId: "staff1",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { details?: { code?: string } })?.details?.code).toBe(
      ATTENDANCE_DUPLICATE_CONFLICT,
    );
  });

  it("GraphQL エラー時はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ errors: [{ message: "DB error" }] });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRange.initiate({
        staffId: "staff1",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      }),
    );

    expect(result.error).toBeDefined();
  });

  it("connection が null の場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ data: { attendancesByStaffId: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRange.initiate({
        staffId: "staff1",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { message?: string })?.message).toContain(
      "Failed to fetch attendance",
    );
  });
});

// =============================================================================
// listAttendancesByDateRangeWithPlaceholders
// =============================================================================

describe("listAttendancesByDateRangeWithPlaceholders", () => {
  it("正常レスポンスで全日付プレースホルダー付きリストを返す", async () => {
    const a1 = makeAttendance({ id: "id1", workDate: "2024-01-02" });
    graphqlMock.mockResolvedValue(makeListResponse([a1]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRangeWithPlaceholders.initiate({
        staffId: "staff1",
        startDate: "2024-01-01",
        endDate: "2024-01-03",
      }),
    );

    // 3日分のプレースホルダーが生成される
    expect(result.data?.attendances).toHaveLength(3);
    // 一致する日付は実データが入る
    expect(
      result.data?.attendances.find((a) => a.workDate === "2024-01-02")?.id,
    ).toBe("id1");
    // 一致しない日付はプレースホルダー（id が空）
    expect(
      result.data?.attendances.find((a) => a.workDate === "2024-01-01")?.id,
    ).toBe("");
  });

  it("無効な日付範囲（start > end）の場合は空リストを返す", async () => {
    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRangeWithPlaceholders.initiate({
        staffId: "staff1",
        startDate: "2024-01-31",
        endDate: "2024-01-01",
      }),
    );

    expect(result.data?.attendances).toHaveLength(0);
    expect(graphqlMock).not.toHaveBeenCalled();
  });

  it("重複がある場合は DUPLICATE_CONFLICT エラーを返す", async () => {
    const a1 = makeAttendance({ id: "id1", workDate: "2024-01-01" });
    const a2 = makeAttendance({ id: "id2", workDate: "2024-01-01" });
    graphqlMock.mockResolvedValue(makeListResponse([a1, a2]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRangeWithPlaceholders.initiate({
        staffId: "staff1",
        startDate: "2024-01-01",
        endDate: "2024-01-03",
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { details?: { code?: string } })?.details?.code).toBe(
      ATTENDANCE_DUPLICATE_CONFLICT,
    );
  });

  it("GraphQL エラー時はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ errors: [{ message: "Error" }] });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRangeWithPlaceholders.initiate({
        staffId: "staff1",
        startDate: "2024-01-01",
        endDate: "2024-01-03",
      }),
    );

    expect(result.error).toBeDefined();
  });

  it("connection が null の場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ data: { attendancesByStaffId: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.listAttendancesByDateRangeWithPlaceholders.initiate({
        staffId: "staff1",
        startDate: "2024-01-01",
        endDate: "2024-01-03",
      }),
    );

    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// deleteAttendance
// =============================================================================

describe("deleteAttendance", () => {
  it("正常削除時は削除された勤怠データを返す", async () => {
    const attendance = makeAttendance();
    graphqlMock.mockResolvedValue({
      data: { deleteAttendance: attendance },
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.deleteAttendance.initiate({
        id: "attendance#staff1#2024-01-15",
      }),
    );

    expect(result.data).toEqual(attendance);
    expect(logOperationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "attendance.delete",
        resource: "attendance",
      }),
    );
  });

  it("GraphQL エラー時はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ errors: [{ message: "Delete failed" }] });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.deleteAttendance.initiate({ id: "bad-id" }),
    );

    expect(result.error).toBeDefined();
    expect(logOperationEventMock).not.toHaveBeenCalled();
  });

  it("deleteAttendance が null の場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValue({ data: { deleteAttendance: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.deleteAttendance.initiate({ id: "id1" }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { message?: string })?.message).toContain(
      "Failed to delete attendance",
    );
  });

  it("カスタム logContext の action が使われる", async () => {
    const attendance = makeAttendance();
    graphqlMock.mockResolvedValue({
      data: { deleteAttendance: attendance },
    });

    const store = makeStore();
    await store.dispatch(
      attendanceApi.endpoints.deleteAttendance.initiate({
        id: attendance.id,
        logContext: {
          action: "attendance.admin_delete",
          actorStaffId: "admin1",
          targetStaffId: "staff1",
        },
      }),
    );

    expect(logOperationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "attendance.admin_delete" }),
    );
  });
});

// =============================================================================
// createAttendance
// =============================================================================

describe("createAttendance", () => {
  const createInput = {
    staffId: "staff1",
    workDate: "2024-01-15",
    startTime: "09:00",
    endTime: "18:00",
    goDirectlyFlag: false,
    returnDirectlyFlag: false,
    absentFlag: false,
    rests: [],
    paidHolidayFlag: false,
    specialHolidayFlag: false,
  };

  it("新規作成に成功すると作成された勤怠を返す", async () => {
    const created = makeAttendance({ revision: 1 });
    // 1st call: fetchAttendancesByStaffDate (既存なし)
    graphqlMock.mockResolvedValueOnce(makeListResponse([]));
    // 2nd call: createAttendance mutation
    graphqlMock.mockResolvedValueOnce({
      data: { createAttendance: created },
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.createAttendance.initiate(createInput),
    );

    expect(result.data).toEqual(created);
    expect(logOperationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "attendance.create" }),
    );
  });

  it("既存データが1件ある場合は DUPLICATE_CONFLICT エラーを返す", async () => {
    const existing = makeAttendance({ id: "existing-id" });
    graphqlMock.mockResolvedValueOnce(makeListResponse([existing]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.createAttendance.initiate(createInput),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { details?: { code?: string } })?.details?.code).toBe(
      ATTENDANCE_DUPLICATE_CONFLICT,
    );
    expect(logOperationEventMock).not.toHaveBeenCalled();
  });

  it("既存データが2件以上ある場合は DUPLICATE_CONFLICT エラーを返す", async () => {
    const a1 = makeAttendance({ id: "id1" });
    const a2 = makeAttendance({ id: "id2" });
    graphqlMock.mockResolvedValueOnce(makeListResponse([a1, a2]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.createAttendance.initiate(createInput),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { details?: { code?: string } })?.details?.code).toBe(
      ATTENDANCE_DUPLICATE_CONFLICT,
    );
  });

  it("fetchAttendancesByStaffDate がエラーの場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValueOnce({ errors: [{ message: "Fetch error" }] });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.createAttendance.initiate(createInput),
    );

    expect(result.error).toBeDefined();
  });

  it("createAttendance が null を返した場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValueOnce(makeListResponse([]));
    graphqlMock.mockResolvedValueOnce({ data: { createAttendance: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.createAttendance.initiate(createInput),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { message?: string })?.message).toContain(
      "Failed to create attendance",
    );
  });

  it("ConditionalCheckFailed エラー後にリロードして既存データが見つかった場合は DUPLICATE_CONFLICT を返す", async () => {
    const existing = makeAttendance({ id: "existing" });
    // 1st call: 既存チェック(なし)
    graphqlMock.mockResolvedValueOnce(makeListResponse([]));
    // 2nd call: createAttendance -> ConditionalCheckFailed
    graphqlMock.mockRejectedValueOnce(new Error("ConditionalCheckFailed"));
    // 3rd call: リロード -> 既存データあり
    graphqlMock.mockResolvedValueOnce(makeListResponse([existing]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.createAttendance.initiate(createInput),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { details?: { code?: string } })?.details?.code).toBe(
      ATTENDANCE_DUPLICATE_CONFLICT,
    );
  });

  it("staffWorkDateKey 不明フィールドエラー時は stripStaffWorkDateKey でリトライする", async () => {
    const created = makeAttendance({ revision: 1 });
    // 1st call: 既存チェック
    graphqlMock.mockResolvedValueOnce(makeListResponse([]));
    // 2nd call: createAttendance -> staffWorkDateKey エラー
    graphqlMock.mockRejectedValueOnce(
      new Error("contains a field not in 'CreateAttendanceInput'"),
    );
    // 3rd call: リトライ成功
    graphqlMock.mockResolvedValueOnce({
      data: { createAttendance: created },
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.createAttendance.initiate(createInput),
    );

    expect(result.data).toEqual(created);
    expect(graphqlMock).toHaveBeenCalledTimes(3);
  });
});

// =============================================================================
// updateAttendance
// =============================================================================

describe("updateAttendance", () => {
  const baseUpdateInput = {
    id: "attendance#staff1#2024-01-15",
    staffId: "staff1",
    workDate: "2024-01-15",
    startTime: "10:00",
    endTime: "19:00",
    goDirectlyFlag: false,
    returnDirectlyFlag: false,
    absentFlag: false,
    rests: [],
    paidHolidayFlag: false,
    specialHolidayFlag: false,
    revision: 1,
  };

  it("正常更新時は更新された勤怠を返す", async () => {
    const currentAttendance = makeAttendance({ revision: 1 });
    const updatedAttendance = makeAttendance({ revision: 2, startTime: "10:00" });
    // 1st call: getAttendance (現在値取得)
    graphqlMock.mockResolvedValueOnce(makeGetResponse(currentAttendance));
    // 2nd call: updateAttendance mutation
    graphqlMock.mockResolvedValueOnce({
      data: { updateAttendance: updatedAttendance },
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.updateAttendance.initiate(baseUpdateInput),
    );

    expect(result.data).toEqual(updatedAttendance);
    expect(logOperationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "attendance.update" }),
    );
  });

  it("現在値取得に失敗した場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValueOnce({ errors: [{ message: "Fetch error" }] });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.updateAttendance.initiate(baseUpdateInput),
    );

    expect(result.error).toBeDefined();
  });

  it("getAttendance が null の場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValueOnce({ data: { getAttendance: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.updateAttendance.initiate(baseUpdateInput),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { message?: string })?.message).toContain(
      "Failed to load current attendance",
    );
  });

  it("updateAttendance が null を返した場合はエラーを返す", async () => {
    const currentAttendance = makeAttendance({ revision: 1 });
    graphqlMock.mockResolvedValueOnce(makeGetResponse(currentAttendance));
    graphqlMock.mockResolvedValueOnce({ data: { updateAttendance: null } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.updateAttendance.initiate(baseUpdateInput),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { message?: string })?.message).toContain(
      "Failed to update attendance",
    );
  });

  it("ConditionalCheckFailed の場合はリロードしてリビジョンを更新してリトライする", async () => {
    const currentAttendance = makeAttendance({ revision: 1 });
    const reloadedAttendance = makeAttendance({ revision: 2 });
    const updatedAttendance = makeAttendance({ revision: 3, startTime: "10:00" });
    // 1st call: getAttendance
    graphqlMock.mockResolvedValueOnce(makeGetResponse(currentAttendance));
    // 2nd call: updateAttendance -> ConditionalCheckFailed
    graphqlMock.mockRejectedValueOnce(new Error("ConditionalCheckFailed"));
    graphqlMock.mockResolvedValueOnce(makeGetResponse(reloadedAttendance));
    // 4th call: updateAttendance リトライ成功
    graphqlMock.mockResolvedValueOnce({
      data: { updateAttendance: updatedAttendance },
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.updateAttendance.initiate(baseUpdateInput),
    );

    expect(result.data).toEqual(updatedAttendance);
    expect(graphqlMock).toHaveBeenCalledTimes(4);
  });

  it("ConditionalCheckFailed 後に2度目も失敗した場合は REVISION_CONFLICT エラーを返す", async () => {
    const currentAttendance = makeAttendance({ revision: 1 });
    const reloadedAttendance = makeAttendance({ revision: 2 });
    // 1st call: getAttendance
    graphqlMock.mockResolvedValueOnce(makeGetResponse(currentAttendance));
    // 2nd call: updateAttendance -> ConditionalCheckFailed
    graphqlMock.mockRejectedValueOnce(new Error("ConditionalCheckFailed"));
    // 3rd call: リロード
    graphqlMock.mockResolvedValueOnce(makeGetResponse(reloadedAttendance));
    // 4th call: updateAttendance リトライ -> ConditionalCheckFailed (再失敗)
    graphqlMock.mockRejectedValueOnce(new Error("ConditionalCheckFailed"));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.updateAttendance.initiate(baseUpdateInput),
    );

    expect(result.error).toBeDefined();
    expect(
      (result.error as { details?: { code?: string } })?.details?.code,
    ).toBe(ATTENDANCE_REVISION_CONFLICT);
  });

  it("一般的なエラー（ConditionalCheckFailed 以外）はそのまま返す", async () => {
    const currentAttendance = makeAttendance({ revision: 1 });
    graphqlMock.mockResolvedValueOnce(makeGetResponse(currentAttendance));
    graphqlMock.mockResolvedValueOnce({
      errors: [{ message: "Some other database error" }],
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.updateAttendance.initiate(baseUpdateInput),
    );

    expect(result.error).toBeDefined();
    expect(
      (result.error as { details?: { code?: string } })?.details?.code,
    ).not.toBe(ATTENDANCE_REVISION_CONFLICT);
  });

  it("staffWorkDateKey 不明フィールドエラー時はリトライする", async () => {
    const currentAttendance = makeAttendance({ revision: 1 });
    const updatedAttendance = makeAttendance({ revision: 2 });
    graphqlMock.mockResolvedValueOnce(makeGetResponse(currentAttendance));
    // 1st update: 不明フィールドエラー
    graphqlMock.mockRejectedValueOnce(
      new Error("contains a field not in 'UpdateAttendanceInput'"),
    );
    // 2nd update: 成功
    graphqlMock.mockResolvedValueOnce({
      data: { updateAttendance: updatedAttendance },
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.updateAttendance.initiate(baseUpdateInput),
    );

    expect(result.data).toEqual(updatedAttendance);
    expect(graphqlMock).toHaveBeenCalledTimes(3);
  });
});

// =============================================================================
// upsertAttendanceByStaffAndDate
// =============================================================================

describe("upsertAttendanceByStaffAndDate", () => {
  const upsertInput = {
    input: {
      staffId: "staff1",
      workDate: "2024-01-15",
      startTime: "09:00",
      endTime: "18:00",
      goDirectlyFlag: false,
      returnDirectlyFlag: false,
      absentFlag: false,
      rests: [],
      paidHolidayFlag: false,
      specialHolidayFlag: false,
    },
    action: "clock_in" as const,
    occurredAt: "2024-01-15T09:00:00.000Z",
    idempotencyKey: "key-001",
  };

  it("staffId がない場合はエラーを返す", async () => {
    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate({
        ...upsertInput,
        input: { ...upsertInput.input, staffId: "" },
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { message?: string })?.message).toContain(
      "staffId",
    );
  });

  it("workDate がない場合はエラーを返す", async () => {
    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate({
        ...upsertInput,
        input: { ...upsertInput.input, workDate: "" },
      }),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { message?: string })?.message).toContain(
      "workDate",
    );
  });

  it("サーバーサイド upsert が成功した場合はその結果を返す", async () => {
    const upserted = makeAttendance({ startTime: "09:00" });
    // 1st call: fetchAttendancesByStaffDate (既存データ確認)
    graphqlMock.mockResolvedValueOnce(makeListResponse([]));
    // 2nd call: upsertAttendanceByStaffAndDate サーバーAPI
    graphqlMock.mockResolvedValueOnce({
      data: { upsertAttendanceByStaffAndDate: upserted },
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate(upsertInput),
    );

    expect(result.data).toEqual(upserted);
    expect(logOperationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "attendance.clock_in" }),
    );
  });

  it("サーバーサイド upsert の結果が null の場合はクライアント upsert にフォールバックする", async () => {
    const created = makeAttendance({ startTime: "09:00" });
    // 1st call: fetchAttendancesByStaffDate
    graphqlMock.mockResolvedValueOnce(makeListResponse([]));
    // 2nd call: サーバー upsert -> null
    graphqlMock.mockResolvedValueOnce({
      data: { upsertAttendanceByStaffAndDate: null },
    });
    // 3rd call: クライアント create (existing 確認)
    // ※ 実際は既に loadByStaffDate を1度呼んでいるので create 直行
    graphqlMock.mockResolvedValueOnce({ data: { createAttendance: created } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate(upsertInput),
    );

    expect(result.data).toEqual(created);
  });

  it("サーバーサイド upsert がスキーマ未対応エラーの場合はクライアント upsert にフォールバックして新規作成する", async () => {
    const created = makeAttendance();
    // 1st call: fetchAttendancesByStaffDate (既存なし)
    graphqlMock.mockResolvedValueOnce(makeListResponse([]));
    // 2nd call: サーバー upsert -> スキーマ未対応エラー
    graphqlMock.mockRejectedValueOnce(
      new Error("Cannot query field upsertAttendanceByStaffAndDate"),
    );
    // 3rd call: クライアント create
    graphqlMock.mockResolvedValueOnce({ data: { createAttendance: created } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate(upsertInput),
    );

    expect(result.data).toEqual(created);
    expect(logOperationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "attendance.clock_in" }),
    );
  });

  it("既存データがある場合はサーバー upsert 成功で update を処理する", async () => {
    const existing = makeAttendance({ revision: 1, startTime: "" });
    const upserted = makeAttendance({ startTime: "09:00" });
    // 1st call: fetchAttendancesByStaffDate -> 既存あり
    graphqlMock.mockResolvedValueOnce(makeListResponse([existing]));
    // 2nd call: サーバー upsert
    graphqlMock.mockResolvedValueOnce({
      data: { upsertAttendanceByStaffAndDate: upserted },
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate(upsertInput),
    );

    expect(result.data).toEqual(upserted);
  });

  it("既存データがある場合のクライアントフォールバックで update が成功する", async () => {
    const existing = makeAttendance({ revision: 1, startTime: "" });
    const updated = makeAttendance({ revision: 2, startTime: "09:00" });
    // 1st call: fetchAttendancesByStaffDate -> 既存あり
    graphqlMock.mockResolvedValueOnce(makeListResponse([existing]));
    // 2nd call: サーバー upsert -> スキーマ未対応エラー (既存ありパターン)
    graphqlMock.mockRejectedValueOnce(
      new Error("Cannot query field upsertAttendanceByStaffAndDate"),
    );
    // 3rd call: updateAttendance (client upsert update path)
    graphqlMock.mockResolvedValueOnce({
      data: { updateAttendance: updated },
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate(upsertInput),
    );

    expect(result.data).toEqual(updated);
    expect(logOperationEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "attendance.clock_in" }),
    );
  });

  it("初期ロードでエラーが発生した場合はエラーを返す", async () => {
    graphqlMock.mockResolvedValueOnce({
      errors: [{ message: "Network error" }],
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate(upsertInput),
    );

    expect(result.error).toBeDefined();
  });

  it("初期ロードで重複データがある場合は DUPLICATE_CONFLICT エラーを返す", async () => {
    const a1 = makeAttendance({ id: "id1" });
    const a2 = makeAttendance({ id: "id2" });
    graphqlMock.mockResolvedValueOnce(makeListResponse([a1, a2]));

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate(upsertInput),
    );

    expect(result.error).toBeDefined();
    expect((result.error as { details?: { code?: string } })?.details?.code).toBe(
      ATTENDANCE_DUPLICATE_CONFLICT,
    );
  });

  it("クライアント create で ConditionalCheckFailed の場合はリロードして update にフォールバックする", async () => {
    const reloaded = makeAttendance({ revision: 1 });
    const updated = makeAttendance({ revision: 2, startTime: "09:00" });
    // 1st call: fetchAttendancesByStaffDate (既存なし)
    graphqlMock.mockResolvedValueOnce(makeListResponse([]));
    // 2nd call: サーバー upsert -> スキーマ未対応エラー
    graphqlMock.mockRejectedValueOnce(
      new Error("Cannot query field upsertAttendanceByStaffAndDate"),
    );
    // 3rd call: create -> ConditionalCheckFailed
    graphqlMock.mockRejectedValueOnce(new Error("ConditionalCheckFailed"));
    // 4th call: リロード
    graphqlMock.mockResolvedValueOnce(makeListResponse([reloaded]));
    // 5th call: update 成功
    graphqlMock.mockResolvedValueOnce({ data: { updateAttendance: updated } });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate(upsertInput),
    );

    expect(result.data).toEqual(updated);
  });

  it("サーバー upsert が汎用エラーの場合はフォールバックせずエラーを返す", async () => {
    // 1st call: fetchAttendancesByStaffDate
    graphqlMock.mockResolvedValueOnce(makeListResponse([]));
    // 2nd call: サーバー upsert -> 汎用エラー（フォールバック不可）
    graphqlMock.mockResolvedValueOnce({
      errors: [{ message: "Internal server error" }],
    });

    const store = makeStore();
    const result = await store.dispatch(
      attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate(upsertInput),
    );

    expect(result.error).toBeDefined();
  });

  it("各 action が正しいログアクションにマッピングされる", async () => {
    const actions = [
      ["clock_in", "attendance.clock_in"],
      ["clock_out", "attendance.clock_out"],
      ["go_directly", "attendance.go_directly"],
      ["return_directly", "attendance.return_directly"],
      ["rest_start", "attendance.rest_start"],
      ["rest_end", "attendance.rest_end"],
      ["manual", "attendance.update"],
    ] as const;

    for (const [action, expectedLogAction] of actions) {
      jest.resetAllMocks();
      logOperationEventMock.mockResolvedValue(undefined);
      const upserted = makeAttendance();
      graphqlMock.mockResolvedValueOnce(makeListResponse([]));
      graphqlMock.mockResolvedValueOnce({
        data: { upsertAttendanceByStaffAndDate: upserted },
      });

      const store = makeStore();
      await store.dispatch(
        attendanceApi.endpoints.upsertAttendanceByStaffAndDate.initiate({
          ...upsertInput,
          action,
        }),
      );

      expect(logOperationEventMock).toHaveBeenCalledWith(
        expect.objectContaining({ action: expectedLogAction }),
      );
    }
  });
});
