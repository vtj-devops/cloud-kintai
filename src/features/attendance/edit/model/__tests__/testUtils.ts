import type { SystemCommentInput } from "@shared/api/graphql/types";
import { Logger } from "@shared/lib/logger";
import type {
  UseFormGetValues,
  UseFormReset,
  UseFormSetValue,
} from "react-hook-form";

import type {
  AttendanceEditInputs,
  HourlyPaidHolidayTimeInputs,
  RestInputs,
} from "../common";

type ReplaceFn<T> = (value: T[]) => void;

export type MockAttendanceRecordParams = {
  targetStaffId?: string;
  targetWorkDate?: string;
  readOnly?: boolean;
  setValue: UseFormSetValue<AttendanceEditInputs>;
  reset: UseFormReset<AttendanceEditInputs>;
  restReplace: ReplaceFn<RestInputs>;
  hourlyPaidHolidayTimeReplace: ReplaceFn<HourlyPaidHolidayTimeInputs>;
  systemCommentReplace: ReplaceFn<SystemCommentInput>;
  getValues: UseFormGetValues<AttendanceEditInputs>;
  logger: Logger;
};

export const createMockLogger = (): Logger =>
  ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }) as unknown as Logger;

export const createMockAttendanceRecordParams = (
  overrides?: Partial<MockAttendanceRecordParams>,
): MockAttendanceRecordParams => ({
  targetStaffId: undefined,
  targetWorkDate: undefined,
  readOnly: false,
  setValue: jest.fn() as unknown as UseFormSetValue<AttendanceEditInputs>,
  reset: jest.fn() as unknown as UseFormReset<AttendanceEditInputs>,
  restReplace: jest.fn() as unknown as ReplaceFn<RestInputs>,
  hourlyPaidHolidayTimeReplace:
    jest.fn() as unknown as ReplaceFn<HourlyPaidHolidayTimeInputs>,
  systemCommentReplace: jest.fn() as unknown as ReplaceFn<SystemCommentInput>,
  getValues: jest.fn() as unknown as UseFormGetValues<AttendanceEditInputs>,
  logger: createMockLogger(),
  ...overrides,
});
