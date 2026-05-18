import type { CognitoUser } from "@entities/staff/model/useCognitoUser";
import type { Dispatch } from "@reduxjs/toolkit";
import type { Attendance, Staff } from "@shared/api/graphql/types";
import type { Logger } from "@shared/lib/logger";
import { createMockAttendance, createMockUser } from "@shared/test-utils";

export const OCCURRED_AT = "2024-03-15T09:00:00.000Z";

export const createMockLogger = (): Logger =>
  ({
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }) as unknown as Logger;

export const createCallbackFixtures = (): {
  mockCognitoUser: CognitoUser;
  mockStaff: Staff;
  mockAttendance: Attendance;
  mockDispatch: Dispatch;
  mockLogger: Logger;
} => ({
  mockCognitoUser: createMockUser({ id: "user-1" }),
  mockStaff: { id: "user-1" } as Staff,
  mockAttendance: createMockAttendance({ id: "att-1" }),
  mockDispatch: jest.fn() as unknown as Dispatch,
  mockLogger: createMockLogger(),
});
