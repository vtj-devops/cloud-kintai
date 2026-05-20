import { createTimeRangeValidator } from "@entities/attendance/validation/validators";
import { validationMessages } from "@shared/config/validationMessages";
import dayjs from "dayjs";
import { z } from "zod";

const isoDateTimeSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? validationMessages.common.invalidDateTime
        : validationMessages.common.invalidDateTime,
  })
  .datetime({
    offset: true,
    message: validationMessages.common.invalidDateTime,
  });

const dateTimeField = z.union([isoDateTimeSchema, z.null(), z.undefined()]);

const isoDateSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? validationMessages.common.invalidDate
        : validationMessages.common.invalidDate,
  })
  .refine((value) => dayjs(value, "YYYY-MM-DD", true).isValid(), {
    message: validationMessages.common.invalidDate,
  });

const dateField = z.union([isoDateSchema, z.null(), z.undefined()]);

const restIntervalSchema = createTimeRangeValidator(
  z.object({
    startTime: dateTimeField,
    endTime: dateTimeField,
  }),
  {
    incomplete: validationMessages.attendance.rest.incomplete,
    range: validationMessages.attendance.rest.range,
  },
);

const hourlyPaidHolidayTimeSchema = createTimeRangeValidator(
  z.object({
    startTime: dateTimeField,
    endTime: dateTimeField,
  }),
  {
    incomplete: validationMessages.attendance.hourlyPaidHoliday.incomplete,
    range: validationMessages.attendance.hourlyPaidHoliday.range,
  },
);

export const attendanceEditSchema = z
  .object({
    workDate: dateField.optional(),
    startTime: dateTimeField.optional(),
    endTime: dateTimeField.optional(),
    isDeemedHoliday: z.union([z.boolean(), z.null(), z.undefined()]).optional(),
    specialHolidayFlag: z
      .union([z.boolean(), z.null(), z.undefined()])
      .optional(),
    paidHolidayFlag: z.union([z.boolean(), z.null(), z.undefined()]).optional(),
    absentFlag: z.union([z.boolean(), z.null(), z.undefined()]).optional(),
    hourlyPaidHolidayTimes: z.array(hourlyPaidHolidayTimeSchema).optional(),
    substituteHolidayDate: dateField.optional(),
    goDirectlyFlag: z.union([z.boolean(), z.null(), z.undefined()]).optional(),
    returnDirectlyFlag: z
      .union([z.boolean(), z.null(), z.undefined()])
      .optional(),
    remarks: z.union([z.string(), z.null()]).optional(),
    remarkTags: z.array(z.string()).optional(),
    rests: z.array(restIntervalSchema).optional(),
    staffComment: z.string().optional(),
    histories: z.any().optional(),
    changeRequests: z.any().optional(),
    revision: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // 勤務時間の前後関係チェック（両方入力されている場合のみ）
    if (
      data.startTime &&
      data.endTime &&
      !dayjs(data.endTime).isAfter(dayjs(data.startTime))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validationMessages.attendance.workTime.range,
        path: ["endTime"],
      });
    }

    if (
      data.substituteHolidayDate &&
      !dayjs(data.substituteHolidayDate, "YYYY-MM-DD", true).isValid()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validationMessages.attendance.substituteHoliday.invalidDate,
        path: ["substituteHolidayDate"],
      });
    }

    // 振替休日指定時は勤務時間/休憩を入力不可とする（差し戻し防止）
    if (data.substituteHolidayDate) {
      const hasWorkTime = data.startTime || data.endTime;
      const hasRest = data.rests?.some(
        (rest) => rest?.startTime || rest?.endTime,
      );
      if (hasWorkTime || hasRest) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            validationMessages.attendance.substituteHoliday.workTimeNotAllowed,
          path: hasWorkTime ? ["startTime"] : ["rests"],
        });
      }
    }
  });
