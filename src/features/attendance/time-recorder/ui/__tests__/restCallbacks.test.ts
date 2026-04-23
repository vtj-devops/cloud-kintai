import type { CognitoUser } from "@entities/staff/model/useCognitoUser";
import type { Dispatch } from "@reduxjs/toolkit";
import type { Attendance } from "@shared/api/graphql/types";
import type { Logger } from "@shared/lib/logger";

import { restEndCallback } from "../restEndCallback";
import { restStartCallback } from "../restStartCallback";

const mockCognitoUser: CognitoUser = {
  id: "user-1",
  email: "test@example.com",
} as CognitoUser;

const mockAttendance = { id: "att-1" } as Attendance;
const mockDispatch = jest.fn() as unknown as Dispatch;
const mockLogger: Logger = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
} as unknown as Logger;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("restStartCallback", () => {
  it("cognitoUser がない場合はスキップする", async () => {
    const restStart = jest.fn();
    await restStartCallback(null, mockDispatch, restStart, mockLogger, "2024-03-15T09:00:00.000Z");
    expect(restStart).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("成功時に dispatch を呼ぶ", async () => {
    const restStart = jest.fn().mockResolvedValue(mockAttendance);
    await restStartCallback(
      mockCognitoUser,
      mockDispatch,
      restStart,
      mockLogger,
      "2024-03-15T12:00:00.000Z",
    );
    expect(restStart).toHaveBeenCalledWith("user-1", "2024-03-15", "2024-03-15T12:00:00.000Z");
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("失敗時にエラー dispatch を呼ぶ", async () => {
    const restStart = jest.fn().mockRejectedValue(new Error("network error"));
    await restStartCallback(
      mockCognitoUser,
      mockDispatch,
      restStart,
      mockLogger,
      "2024-03-15T12:00:00.000Z",
    );
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });
});

describe("restEndCallback", () => {
  it("cognitoUser がない場合はスキップする", async () => {
    const restEnd = jest.fn();
    await restEndCallback(null, restEnd, mockDispatch, mockLogger, "2024-03-15T13:00:00.000Z");
    expect(restEnd).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("成功時に dispatch を呼ぶ", async () => {
    const restEnd = jest.fn().mockResolvedValue(mockAttendance);
    await restEndCallback(
      mockCognitoUser,
      restEnd,
      mockDispatch,
      mockLogger,
      "2024-03-15T13:00:00.000Z",
    );
    expect(restEnd).toHaveBeenCalledWith("user-1", "2024-03-15", "2024-03-15T13:00:00.000Z");
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("失敗時にエラー dispatch を呼ぶ", async () => {
    const restEnd = jest.fn().mockRejectedValue(new Error("error"));
    await restEndCallback(
      mockCognitoUser,
      restEnd,
      mockDispatch,
      mockLogger,
      "2024-03-15T13:00:00.000Z",
    );
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });
});
