import { createMockUser } from "@shared/test-utils";

import {
  type AttendanceMutationOptions,
  executeAttendanceMutation,
} from "../attendanceMutation";

// -------------------------------------------------------------------
// モック: getNowISOStringWithZeroSeconds
// -------------------------------------------------------------------
const FIXED_TIMESTAMP = "2024-06-15T09:00:00.000Z";
jest.mock("@entities/attendance/lib/time", () => ({
  getNowISOStringWithZeroSeconds: jest.fn(() => FIXED_TIMESTAMP),
}));

// -------------------------------------------------------------------
// モック: pushNotification（action creator のみ再現）
// -------------------------------------------------------------------
jest.mock("@shared/lib/store/notificationSlice", () => ({
  pushNotification: jest.fn((payload) => ({
    type: "notifications/push",
    payload,
  })),
}));

// -------------------------------------------------------------------
// ヘルパー
// -------------------------------------------------------------------
const TODAY = "2024-06-15";
const mockUser = createMockUser({ id: "user-001" });

function buildOptions(
  overrides?: Partial<AttendanceMutationOptions>,
): AttendanceMutationOptions {
  return {
    cognitoUser: mockUser,
    today: TODAY,
    mutation: jest.fn().mockResolvedValue({ id: "att-001" }),
    dispatch: jest.fn(),
    successMessage: "打刻しました",
    errorMessage: "打刻に失敗しました",
    logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() } as unknown as AttendanceMutationOptions["logger"],
    ...overrides,
  };
}

// -------------------------------------------------------------------
// テスト
// -------------------------------------------------------------------
describe("executeAttendanceMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("cognitoUser が null のとき mutation を呼ばずに warn ログを出して終了する", () => {
    const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() } as unknown as AttendanceMutationOptions["logger"];
    const mutation = jest.fn();
    const dispatch = jest.fn();

    executeAttendanceMutation(
      buildOptions({ cognitoUser: null, mutation, dispatch, logger }),
    );

    expect(mutation).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it("cognitoUser が undefined のとき mutation を呼ばない", () => {
    const mutation = jest.fn();

    executeAttendanceMutation(
      buildOptions({ cognitoUser: undefined, mutation }),
    );

    expect(mutation).not.toHaveBeenCalled();
  });

  it("mutation を staffId・today・固定タイムスタンプで呼び出す", () => {
    const mutation = jest.fn().mockResolvedValue({ id: "att-001" });

    executeAttendanceMutation(buildOptions({ mutation }));

    expect(mutation).toHaveBeenCalledTimes(1);
    expect(mutation).toHaveBeenCalledWith(
      mockUser.id,   // staffId
      TODAY,         // workDate
      FIXED_TIMESTAMP, // getNowISOStringWithZeroSeconds()
    );
  });

  it("mutation が成功したとき dispatch を success トーンで呼び出す", async () => {
    const dispatch = jest.fn();
    const mutation = jest.fn().mockResolvedValue({ id: "att-001" });

    executeAttendanceMutation(buildOptions({ mutation, dispatch }));

    // Promise の解決を待つ
    await Promise.resolve();
    await Promise.resolve();

    expect(dispatch).toHaveBeenCalledTimes(1);
    const dispatchedAction = dispatch.mock.calls[0][0];
    expect(dispatchedAction.payload.tone).toBe("success");
    expect(dispatchedAction.payload.message).toBe("打刻しました");
  });

  it("mutation が失敗したとき dispatch を error トーンで呼び出す", async () => {
    const dispatch = jest.fn();
    const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() } as unknown as AttendanceMutationOptions["logger"];
    const mutation = jest
      .fn()
      .mockRejectedValue(new Error("Network error"));

    executeAttendanceMutation(buildOptions({ mutation, dispatch, logger }));

    // Promise の拒否を待つ
    await Promise.resolve();
    await Promise.resolve();

    expect(dispatch).toHaveBeenCalledTimes(1);
    const dispatchedAction = dispatch.mock.calls[0][0];
    expect(dispatchedAction.payload.tone).toBe("error");
    expect(dispatchedAction.payload.message).toBe("打刻に失敗しました");
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it("actionLabel が logger の warn メッセージに含まれる", () => {
    const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() } as unknown as AttendanceMutationOptions["logger"];

    executeAttendanceMutation(
      buildOptions({
        cognitoUser: null,
        logger,
        actionLabel: "clock-in",
      }),
    );

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("clock-in"),
    );
  });

  it("actionLabel を省略した場合デフォルト値 'attendance mutation' が warn に使われる", () => {
    const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() } as unknown as AttendanceMutationOptions["logger"];

    executeAttendanceMutation(
      buildOptions({ cognitoUser: null, logger, actionLabel: undefined }),
    );

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("attendance mutation"),
    );
  });

  it("mutation 成功後の dispatch には pushNotification で生成したアクションが渡される", async () => {
    const { pushNotification } =
      jest.requireMock("@shared/lib/store/notificationSlice");
    const dispatch = jest.fn();
    const mutation = jest.fn().mockResolvedValue({ id: "att-999" });

    executeAttendanceMutation(buildOptions({ mutation, dispatch }));
    await Promise.resolve();
    await Promise.resolve();

    expect(pushNotification).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "success" }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "notifications/push" }),
    );
  });
});
