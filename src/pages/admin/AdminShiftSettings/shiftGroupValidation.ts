import type { ShiftGroupConfig } from "@entities/app-config/model/shiftGroupTypes";
import { SHIFT_GROUP_VALIDATION_TEXTS } from "@shared/config/shiftGroupTexts";
import {
  type FieldRule,
  type FieldState,
  resolveFieldState,
} from "@shared/lib/validation/fieldState";

export type ShiftGroupFormValue = {
  id: string;
  label: string;
  description: string;
  min: string;
  max: string;
  fixed: string;
};

export type { ShiftGroupConfig };

export type GroupValidationResult = {
  labelError: boolean;
  minInputError: boolean;
  maxInputError: boolean;
  fixedInputError: boolean;
  rangeError: boolean;
  fixedBelowMin: boolean;
  fixedAboveMax: boolean;
  fixedWithRangeConflict: boolean;
  minValue: number | null;
  maxValue: number | null;
  fixedValue: number | null;
  hasError: boolean;
};

export type GroupHelperTexts = {
  minHelperText: string;
  maxHelperText: string;
  fixedHelperText: string;
};

export type NumberFieldKey = "min" | "max" | "fixed";

export type NumberFieldState = FieldState;

export const isOptionalNonNegativeIntegerString = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" || /^\d+$/.test(trimmed);
};

export const parseOptionalInteger = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getGroupValidation = (
  group: ShiftGroupFormValue,
): GroupValidationResult => {
  const labelError = group.label.trim() === "";
  const minInputError = !isOptionalNonNegativeIntegerString(group.min);
  const maxInputError = !isOptionalNonNegativeIntegerString(group.max);
  const fixedInputError = !isOptionalNonNegativeIntegerString(group.fixed);

  const minValue = minInputError ? null : parseOptionalInteger(group.min);
  const maxValue = maxInputError ? null : parseOptionalInteger(group.max);
  const fixedValue = fixedInputError ? null : parseOptionalInteger(group.fixed);

  const rangeError =
    minValue !== null && maxValue !== null && minValue > maxValue;
  const fixedBelowMin =
    fixedValue !== null && minValue !== null && fixedValue < minValue;
  const fixedAboveMax =
    fixedValue !== null && maxValue !== null && fixedValue > maxValue;
  const fixedWithRangeConflict =
    fixedValue !== null && (minValue !== null || maxValue !== null);

  return {
    labelError,
    minInputError,
    maxInputError,
    fixedInputError,
    rangeError,
    fixedBelowMin,
    fixedAboveMax,
    fixedWithRangeConflict,
    minValue,
    maxValue,
    fixedValue,
    hasError:
      labelError ||
      minInputError ||
      maxInputError ||
      fixedInputError ||
      rangeError ||
      fixedBelowMin ||
      fixedAboveMax ||
      fixedWithRangeConflict,
  };
};

export const getHelperTexts = (
  validation: GroupValidationResult,
): GroupHelperTexts => {
  return {
    minHelperText: getNumberFieldState(validation, "min").helperText,
    maxHelperText: getNumberFieldState(validation, "max").helperText,
    fixedHelperText: getNumberFieldState(validation, "fixed").helperText,
  };
};

const buildNumberFieldState = (
  rules: FieldRule[],
  fallbackHelperText: string,
): NumberFieldState =>
  resolveFieldState(rules, { error: false, helperText: fallbackHelperText });

export const getNumberFieldState = (
  validation: GroupValidationResult,
  key: NumberFieldKey,
): NumberFieldState => {
  switch (key) {
    case "min":
      return buildNumberFieldState(
        [
          {
            when: validation.minInputError,
            helperText: SHIFT_GROUP_VALIDATION_TEXTS.minInvalid,
          },
          {
            when: validation.fixedWithRangeConflict,
            helperText: SHIFT_GROUP_VALIDATION_TEXTS.rangeConflict,
          },
        ],
        SHIFT_GROUP_VALIDATION_TEXTS.minOptional,
      );
    case "max":
      return buildNumberFieldState(
        [
          {
            when: validation.maxInputError,
            helperText: SHIFT_GROUP_VALIDATION_TEXTS.maxInvalid,
          },
          {
            when: validation.rangeError,
            helperText: SHIFT_GROUP_VALIDATION_TEXTS.maxRangeError,
          },
          {
            when: validation.fixedWithRangeConflict,
            helperText: SHIFT_GROUP_VALIDATION_TEXTS.rangeConflict,
          },
        ],
        SHIFT_GROUP_VALIDATION_TEXTS.maxOptional,
      );
    case "fixed":
    default:
      return buildNumberFieldState(
        [
          {
            when: validation.fixedInputError,
            helperText: SHIFT_GROUP_VALIDATION_TEXTS.fixedInvalid,
          },
          {
            when: validation.fixedBelowMin,
            helperText: SHIFT_GROUP_VALIDATION_TEXTS.fixedBelowMin,
          },
          {
            when: validation.fixedAboveMax,
            helperText: SHIFT_GROUP_VALIDATION_TEXTS.fixedAboveMax,
          },
          {
            when: validation.fixedWithRangeConflict,
            helperText: SHIFT_GROUP_VALIDATION_TEXTS.fixedRangeConflict,
          },
        ],
        SHIFT_GROUP_VALIDATION_TEXTS.fixedOptional,
      );
  }
};
