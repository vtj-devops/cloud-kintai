import { clockInCallback } from "../clockInCallback";
import { clockOutCallback } from "../clockOutCallback";
import { createCallbackFixtures, OCCURRED_AT } from "./callbackTestUtils";

jest.mock("@shared/lib/mail/TimeRecordMailSender", () => ({
  TimeRecordMailSender: jest.fn().mockImplementation(() => ({
    clockIn: jest.fn().mockResolvedValue(undefined),
    clockOut: jest.fn().mockResolvedValue(undefined),
  })),
}));

const {
  mockCognitoUser,
  mockStaff,
  mockAttendance,
  mockDispatch,
  mockLogger,
} = createCallbackFixtures();

beforeEach(() => jest.clearAllMocks());

describe("clockInCallback", () => {
  it.each([
    { label: "cognitoUser がない場合", cognitoUser: null, staff: mockStaff },
    { label: "staff がない場合", cognitoUser: mockCognitoUser, staff: null },
  ])("$labelはスキップする", async ({ cognitoUser, staff }) => {
    const clockIn = jest.fn();
    await clockInCallback(
      cognitoUser,
      clockIn,
      mockDispatch,
      staff,
      mockLogger,
      OCCURRED_AT,
    );
    expect(clockIn).not.toHaveBeenCalled();
  });

  it("成功時に success dispatch を呼ぶ", async () => {
    const clockIn = jest.fn().mockResolvedValue(mockAttendance);
    await clockInCallback(
      mockCognitoUser,
      clockIn,
      mockDispatch,
      mockStaff,
      mockLogger,
      OCCURRED_AT,
    );
    expect(clockIn).toHaveBeenCalledWith("user-1", "2024-03-15", OCCURRED_AT);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("失敗時に error dispatch を呼ぶ", async () => {
    const clockIn = jest.fn().mockRejectedValue(new Error("error"));
    await clockInCallback(
      mockCognitoUser,
      clockIn,
      mockDispatch,
      mockStaff,
      mockLogger,
      OCCURRED_AT,
    );
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("メール送信失敗は握りつぶされる", async () => {
    const { TimeRecordMailSender } = jest.requireMock(
      "@shared/lib/mail/TimeRecordMailSender",
    );
    TimeRecordMailSender.mockImplementationOnce(() => ({
      clockIn: jest.fn().mockRejectedValue(new Error("mail error")),
    }));
    const clockIn = jest.fn().mockResolvedValue(mockAttendance);
    await expect(
      clockInCallback(
        mockCognitoUser,
        clockIn,
        mockDispatch,
        mockStaff,
        mockLogger,
        OCCURRED_AT,
      ),
    ).resolves.not.toThrow();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

describe("clockOutCallback", () => {
  it.each([
    { label: "cognitoUser がない場合", cognitoUser: null, staff: mockStaff },
    { label: "staff がない場合", cognitoUser: mockCognitoUser, staff: null },
  ])("$labelはスキップする", async ({ cognitoUser, staff }) => {
    const clockOut = jest.fn();
    await clockOutCallback(cognitoUser, clockOut, mockDispatch, staff, mockLogger);
    expect(clockOut).not.toHaveBeenCalled();
  });

  it("成功時に success dispatch を呼ぶ", async () => {
    const clockOut = jest.fn().mockResolvedValue(mockAttendance);
    await clockOutCallback(
      mockCognitoUser,
      clockOut,
      mockDispatch,
      mockStaff,
      mockLogger,
      undefined,
      OCCURRED_AT,
    );
    expect(clockOut).toHaveBeenCalledWith("user-1", "2024-03-15", OCCURRED_AT);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("endTimeIso を優先して使用する", async () => {
    const clockOut = jest.fn().mockResolvedValue(mockAttendance);
    await clockOutCallback(
      mockCognitoUser,
      clockOut,
      mockDispatch,
      mockStaff,
      mockLogger,
      "2024-03-15T18:00:00.000Z",
      OCCURRED_AT,
    );
    expect(clockOut).toHaveBeenCalledWith(
      "user-1",
      "2024-03-15",
      "2024-03-15T18:00:00.000Z",
    );
  });

  it("失敗時に error dispatch を呼ぶ", async () => {
    const clockOut = jest.fn().mockRejectedValue(new Error("error"));
    await clockOutCallback(
      mockCognitoUser,
      clockOut,
      mockDispatch,
      mockStaff,
      mockLogger,
      undefined,
      OCCURRED_AT,
    );
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });
});
