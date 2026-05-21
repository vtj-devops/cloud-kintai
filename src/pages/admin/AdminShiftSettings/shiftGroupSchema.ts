import { SHIFT_GROUP_VALIDATION_TEXTS } from "@shared/config/shiftGroupTexts";
import { z } from "zod";

import {
  getGroupValidation,
  isOptionalNonNegativeIntegerString,
} from "./shiftGroupValidation";

const optionalNonNegativeIntegerString = (message: string) =>
  z.string().refine((value) => {
    return isOptionalNonNegativeIntegerString(value);
  }, { message });

export const shiftGroupSchema = z
  .object({
    id: z.string(),
    label: z
      .string()
      .trim()
      .min(1, { message: SHIFT_GROUP_VALIDATION_TEXTS.labelRequired }),
    description: z.string(),
    min: optionalNonNegativeIntegerString(
      SHIFT_GROUP_VALIDATION_TEXTS.minInvalid,
    ),
    max: optionalNonNegativeIntegerString(
      SHIFT_GROUP_VALIDATION_TEXTS.maxInvalid,
    ),
    fixed: optionalNonNegativeIntegerString(
      SHIFT_GROUP_VALIDATION_TEXTS.fixedInvalid,
    ),
  })
  .superRefine((values, ctx) => {
    const validation = getGroupValidation(values);

    if (validation.rangeError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max"],
        message: SHIFT_GROUP_VALIDATION_TEXTS.maxRangeError,
      });
    }

    if (validation.fixedBelowMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fixed"],
        message: SHIFT_GROUP_VALIDATION_TEXTS.fixedBelowMin,
      });
    }

    if (validation.fixedAboveMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fixed"],
        message: SHIFT_GROUP_VALIDATION_TEXTS.fixedAboveMax,
      });
    }

    if (validation.fixedWithRangeConflict) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["min"],
        message: SHIFT_GROUP_VALIDATION_TEXTS.rangeConflict,
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max"],
        message: SHIFT_GROUP_VALIDATION_TEXTS.rangeConflict,
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fixed"],
        message: SHIFT_GROUP_VALIDATION_TEXTS.fixedRangeConflict,
      });
    }
  });

export const shiftGroupFormSchema = z.object({
  shiftGroups: z.array(shiftGroupSchema),
});

export type ShiftGroupFormState = z.infer<typeof shiftGroupFormSchema>;
