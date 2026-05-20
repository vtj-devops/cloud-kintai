import { Logger } from "@shared/lib/logger";
import type {
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
  logger: createMockLogger(),
  ...overrides,
});
