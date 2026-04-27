import {
  GoDirectlyFlag,
  ReturnDirectlyFlag,
} from "@entities/attendance/lib/actions/attendanceActions";
import type { CognitoUser } from "@entities/staff/model/useCognitoUser";
import type { Dispatch } from "@reduxjs/toolkit";
import type { Attendance, Staff } from "@shared/api/graphql/types";
import type { Logger } from "@shared/lib/logger";

import { goDirectlyCallback } from "../goDirectlyCallback";
import { returnDirectlyCallback } from "../returnDirectlyCallback";

jest.mock("@shared/lib/mail/TimeRecordMailSender", () => ({
  TimeRecordMailSender: jest.fn().mockImplementation(() => ({
    clockIn: jest.fn().mockResolvedValue(undefined),
    clockOut: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@entities/attendance/lib/AttendanceDateTime", () => ({
  AttendanceDateTime: jest.fn().mockImplementation(() => ({
    setWorkStart: jest.fn().mockReturnThis(),
    setWorkEnd: jest.fn().mockReturnThis(),
    toISOString: jest.fn().mockReturnValue("2024-03-15T09:00:00.000Z"),
  })),
}));

const mockCognitoUser: CognitoUser = {
  id: "user-1",
  givenName: "Test",
  familyName: "User",
  mailAddress: "test@example.com",
  owner: false,
  roles: [],
  emailVerified: true,
};
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

describe("goDirectlyCallback", () => {
  it("cognitoUser がない場合はスキップする", async () => {
    const clockIn = jest.fn();
    await goDirectlyCallback(
      null,
      mockStaff,
      mockDispatch,
      clockIn,
      mockLogger,
      undefined,
      OCC,
    );
    expect(clockIn).not.toHaveBeenCalled();
  });

  it("成功時に success dispatch を呼ぶ", async () => {
    const clockIn = jest.fn().mockResolvedValue(mockAttendance);
    await goDirectlyCallback(
      mockCognitoUser,
      mockStaff,
      mockDispatch,
      clockIn,
      mockLogger,
      undefined,
      OCC,
    );
    expect(clockIn).toHaveBeenCalledWith(
      "user-1",
      "2024-03-15",
      expect.any(String),
      GoDirectlyFlag.YES,
    );
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("startTimeIso が明示的に渡されたとき使用する", async () => {
    const clockIn = jest.fn().mockResolvedValue(mockAttendance);
    await goDirectlyCallback(
      mockCognitoUser,
      mockStaff,
      mockDispatch,
      clockIn,
      mockLogger,
      "2024-03-15T08:30:00.000Z",
      OCC,
    );
    expect(clockIn).toHaveBeenCalledWith(
      "user-1",
      "2024-03-15",
      "2024-03-15T08:30:00.000Z",
      GoDirectlyFlag.YES,
    );
  });

  it("失敗時に error dispatch を呼ぶ", async () => {
    const clockIn = jest.fn().mockRejectedValue(new Error("error"));
    await goDirectlyCallback(
      mockCognitoUser,
      mockStaff,
      mockDispatch,
      clockIn,
      mockLogger,
      undefined,
      OCC,
    );
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });
});

describe("returnDirectlyCallback", () => {
  it("cognitoUser がない場合はスキップする", async () => {
    const clockOut = jest.fn();
    await returnDirectlyCallback(
      null,
      mockStaff,
      mockDispatch,
      clockOut,
      mockLogger,
    );
    expect(clockOut).not.toHaveBeenCalled();
  });

  it("成功時に success dispatch を呼ぶ", async () => {
    const clockOut = jest.fn().mockResolvedValue(mockAttendance);
    await returnDirectlyCallback(
      mockCognitoUser,
      mockStaff,
      mockDispatch,
      clockOut,
      mockLogger,
      undefined,
      OCC,
    );
    expect(clockOut).toHaveBeenCalledWith(
      "user-1",
      "2024-03-15",
      expect.any(String),
      ReturnDirectlyFlag.YES,
    );
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("endTimeIso を優先して使用する", async () => {
    const clockOut = jest.fn().mockResolvedValue(mockAttendance);
    await returnDirectlyCallback(
      mockCognitoUser,
      mockStaff,
      mockDispatch,
      clockOut,
      mockLogger,
      "2024-03-15T18:00:00.000Z",
      OCC,
    );
    expect(clockOut).toHaveBeenCalledWith(
      "user-1",
      "2024-03-15",
      "2024-03-15T18:00:00.000Z",
      ReturnDirectlyFlag.YES,
    );
  });

  it("失敗時に error dispatch を呼ぶ", async () => {
    const clockOut = jest.fn().mockRejectedValue(new Error("error"));
    await returnDirectlyCallback(
      mockCognitoUser,
      mockStaff,
      mockDispatch,
      clockOut,
      mockLogger,
      undefined,
      OCC,
    );
    expect(mockDispatch).toHaveBeenCalled();
  });
});
