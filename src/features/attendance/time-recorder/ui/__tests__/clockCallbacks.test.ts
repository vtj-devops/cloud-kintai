import type { CognitoUser } from "@entities/staff/model/useCognitoUser";
import type { Dispatch } from "@reduxjs/toolkit";
import type { Attendance, Staff } from "@shared/api/graphql/types";
import type { Logger } from "@shared/lib/logger";

import { clockInCallback } from "../clockInCallback";
import { clockOutCallback } from "../clockOutCallback";

jest.mock("@shared/lib/mail/TimeRecordMailSender", () => ({
  TimeRecordMailSender: jest.fn().mockImplementation(() => ({
    clockIn: jest.fn().mockResolvedValue(undefined),
    clockOut: jest.fn().mockResolvedValue(undefined),
  })),
}));

const mockCognitoUser = { id: "user-1", email: "test@example.com" } as CognitoUser;
const mockStaff = { id: "user-1" } as Staff;
const mockAttendance = { id: "att-1" } as Attendance;
const mockDispatch = jest.fn() as unknown as Dispatch;
const mockLogger: Logger = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
} as unknown as Logger;

const OCC = "2024-03-15T09:00:00.000Z";

beforeEach(() => jest.clearAllMocks());

describe("clockInCallback", () => {
  it("cognitoUser がない場合はスキップする", async () => {
    const clockIn = jest.fn();
    await clockInCallback(null, clockIn, mockDispatch, mockStaff, mockLogger, OCC);
    expect(clockIn).not.toHaveBeenCalled();
  });

  it("staff がない場合はスキップする", async () => {
    const clockIn = jest.fn();
    await clockInCallback(mockCognitoUser, clockIn, mockDispatch, null, mockLogger, OCC);
    expect(clockIn).not.toHaveBeenCalled();
  });

  it("成功時に success dispatch を呼ぶ", async () => {
    const clockIn = jest.fn().mockResolvedValue(mockAttendance);
    await clockInCallback(mockCognitoUser, clockIn, mockDispatch, mockStaff, mockLogger, OCC);
    expect(clockIn).toHaveBeenCalledWith("user-1", "2024-03-15", OCC);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("失敗時に error dispatch を呼ぶ", async () => {
    const clockIn = jest.fn().mockRejectedValue(new Error("error"));
    await clockInCallback(mockCognitoUser, clockIn, mockDispatch, mockStaff, mockLogger, OCC);
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("メール送信失敗は握りつぶされる", async () => {
    const { TimeRecordMailSender } = jest.requireMock("@shared/lib/mail/TimeRecordMailSender");
    TimeRecordMailSender.mockImplementationOnce(() => ({
      clockIn: jest.fn().mockRejectedValue(new Error("mail error")),
    }));
    const clockIn = jest.fn().mockResolvedValue(mockAttendance);
    await expect(
      clockInCallback(mockCognitoUser, clockIn, mockDispatch, mockStaff, mockLogger, OCC),
    ).resolves.not.toThrow();
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

describe("clockOutCallback", () => {
  it("cognitoUser がない場合はスキップする", async () => {
    const clockOut = jest.fn();
    await clockOutCallback(null, clockOut, mockDispatch, mockStaff, mockLogger);
    expect(clockOut).not.toHaveBeenCalled();
  });

  it("staff がない場合はスキップする", async () => {
    const clockOut = jest.fn();
    await clockOutCallback(mockCognitoUser, clockOut, mockDispatch, null, mockLogger);
    expect(clockOut).not.toHaveBeenCalled();
  });

  it("成功時に success dispatch を呼ぶ", async () => {
    const clockOut = jest.fn().mockResolvedValue(mockAttendance);
    await clockOutCallback(mockCognitoUser, clockOut, mockDispatch, mockStaff, mockLogger, undefined, OCC);
    expect(clockOut).toHaveBeenCalledWith("user-1", "2024-03-15", OCC);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("endTimeIso を優先して使用する", async () => {
    const clockOut = jest.fn().mockResolvedValue(mockAttendance);
    await clockOutCallback(mockCognitoUser, clockOut, mockDispatch, mockStaff, mockLogger, "2024-03-15T18:00:00.000Z", OCC);
    expect(clockOut).toHaveBeenCalledWith("user-1", "2024-03-15", "2024-03-15T18:00:00.000Z");
  });

  it("失敗時に error dispatch を呼ぶ", async () => {
    const clockOut = jest.fn().mockRejectedValue(new Error("error"));
    await clockOutCallback(mockCognitoUser, clockOut, mockDispatch, mockStaff, mockLogger, undefined, OCC);
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });
});
