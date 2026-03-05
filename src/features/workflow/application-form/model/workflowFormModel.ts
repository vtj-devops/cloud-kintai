import {
  buildSystemWorkflowComment,
  type WorkflowCommentBuilderOptions,
} from "@features/workflow/comment-thread/model/workflowCommentBuilder";
import {
  type CreateWorkflowInput,
  type UpdateWorkflowInput,
  WorkflowCategory,
  type WorkflowCommentInput,
  WorkflowStatus,
} from "@shared/api/graphql/types";
import { z } from "zod";

import {
  CLOCK_CORRECTION_CHECK_OUT_LABEL,
  CLOCK_CORRECTION_LABEL,
  REVERSE_CATEGORY,
} from "@/entities/workflow/lib/workflowLabels";
import { validationMessages } from "@/shared/config/validationMessages";
import { formatISOToTime } from "@/shared/lib/time";

export { CLOCK_CORRECTION_CHECK_OUT_LABEL, CLOCK_CORRECTION_LABEL };

const VACATION_LABEL = "有給休暇申請";
const ABSENCE_LABEL = "欠勤申請";
const OVERTIME_LABEL = "残業申請";
const CUSTOM_LABEL = "その他";

const defaultOvertimeDateFactory = () => new Date().toISOString().slice(0, 10);

export type WorkflowFormState = {
  categoryLabel: string;
  startDate: string;
  endDate: string;
  absenceDate: string;
  paidReason: string;
  absenceReason: string;
  overtimeDate: string;
  /** ISO 8601形式の日時文字列 (例: "2024-01-15T09:00:00+09:00") または空文字列 */
  overtimeStart: string | null;
  /** ISO 8601形式の日時文字列 (例: "2024-01-15T18:00:00+09:00") または空文字列 */
  overtimeEnd: string | null;
  overtimeReason: string;
  customWorkflowTitle: string;
  customWorkflowContent: string;
};

export type WorkflowFormErrors = {
  dateError?: string;
  absenceDateError?: string;
  overtimeDateError?: string;
  overtimeError?: string;
  customWorkflowTitleError?: string;
  customWorkflowContentError?: string;
};

export type WorkflowFormValidationResult = {
  isValid: boolean;
  errors: WorkflowFormErrors;
};

// Zodスキーマによるバリデーション定義
const workflowFormSchema = z
  .object({
    categoryLabel: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    absenceDate: z.string(),
    paidReason: z.string(),
    absenceReason: z.string(),
    overtimeDate: z.string(),
    overtimeStart: z.string().nullable(),
    overtimeEnd: z.string().nullable(),
    overtimeReason: z.string(),
    customWorkflowTitle: z.string().optional().default(""),
    customWorkflowContent: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    // 有給休暇のバリデーション
    if (data.categoryLabel === VACATION_LABEL) {
      if (!data.startDate || !data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dateError"],
          message: validationMessages.workflow.paidLeave.dateRequired,
        });
      } else if (data.startDate > data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dateError"],
          message: validationMessages.workflow.paidLeave.dateRange,
        });
      }
    }

    // 欠勤のバリデーション
    if (data.categoryLabel === ABSENCE_LABEL && !data.absenceDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["absenceDateError"],
        message: validationMessages.workflow.absence.dateRequired,
      });
    }

    // 残業のバリデーション
    if (data.categoryLabel === OVERTIME_LABEL) {
      if (!data.overtimeDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["overtimeDateError"],
          message: validationMessages.workflow.overtime.dateRequired,
        });
      }
      if (!data.overtimeStart || !data.overtimeEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["overtimeError"],
          message: validationMessages.workflow.overtime.timeRequired,
        });
      } else if (data.overtimeStart >= data.overtimeEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["overtimeError"],
          message: validationMessages.workflow.overtime.timeRange,
        });
      }
    }

    // 打刻修正のバリデーション
    const isClockInCorrection = data.categoryLabel === CLOCK_CORRECTION_LABEL;
    const isClockOutCorrection =
      data.categoryLabel === CLOCK_CORRECTION_CHECK_OUT_LABEL;
    if (isClockInCorrection || isClockOutCorrection) {
      if (!data.overtimeDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["overtimeDateError"],
          message: validationMessages.workflow.clockCorrection.dateRequired,
        });
      }
      if (isClockInCorrection && !data.overtimeStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["overtimeError"],
          message: validationMessages.workflow.clockCorrection.clockInRequired,
        });
      }
      if (isClockOutCorrection && !data.overtimeEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["overtimeError"],
          message: validationMessages.workflow.clockCorrection.clockOutRequired,
        });
      }
    }

    if (data.categoryLabel === CUSTOM_LABEL) {
      if (!data.customWorkflowTitle.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customWorkflowTitleError"],
          message: "タイトルを入力してください。",
        });
      }
      if (!data.customWorkflowContent.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customWorkflowContentError"],
          message: "詳細を入力してください。",
        });
      }
    }
  });

export const validateWorkflowForm = (
  state: WorkflowFormState,
): WorkflowFormValidationResult => {
  const result = workflowFormSchema.safeParse(state);

  if (result.success) {
    return { isValid: true, errors: {} };
  }

  // Zodのエラーを既存のエラー形式に変換
  const errors: WorkflowFormErrors = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path[0] as keyof WorkflowFormErrors;
    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  });

  return { isValid: false, errors };
};

const normalizeCategory = (label: string): WorkflowCategory => {
  const mapped = REVERSE_CATEGORY[label];
  return (mapped as WorkflowCategory) || WorkflowCategory.CUSTOM;
};

const buildSubmissionCommentText = (categoryLabel: string) =>
  `${categoryLabel || "申請"}が提出されました。`;

type SubmissionCommentOptions = {
  commentText?: string;
  builderOptions?: WorkflowCommentBuilderOptions;
};

type SubmissionCommentPayloadOptions = SubmissionCommentOptions & {
  include: boolean;
  categoryLabel: string;
  existingComments?: WorkflowCommentInput[];
};

const buildSubmissionCommentsPayload = (
  options: SubmissionCommentPayloadOptions,
): WorkflowCommentInput[] | undefined => {
  if (!options.include) return undefined;
  const existing = options.existingComments
    ? [...options.existingComments]
    : [];
  const text =
    options.commentText ?? buildSubmissionCommentText(options.categoryLabel);
  const systemComment = buildSystemWorkflowComment(text, {
    ...options.builderOptions,
  });
  return [...existing, systemComment];
};

type OvertimeDetailsOptions = {
  fallbackDateFactory?: () => string;
};

const buildWorkflowOvertimeDetails = (
  state: WorkflowFormState,
  options?: OvertimeDetailsOptions,
): CreateWorkflowInput["overTimeDetails"] | undefined => {
  const isOvertime = state.categoryLabel === OVERTIME_LABEL;
  const isVacation = state.categoryLabel === VACATION_LABEL;
  const isAbsence = state.categoryLabel === ABSENCE_LABEL;
  const isClockInCorrection = state.categoryLabel === CLOCK_CORRECTION_LABEL;
  const isClockOutCorrection =
    state.categoryLabel === CLOCK_CORRECTION_CHECK_OUT_LABEL;
  const isClockCorrection = isClockInCorrection || isClockOutCorrection;
  if (!isOvertime && !isClockCorrection && !isVacation && !isAbsence)
    return undefined;

  // 有給休暇申請の場合
  if (isVacation) {
    return {
      date: state.startDate || "",
      startTime: state.startDate || "",
      endTime: state.endDate || "",
      reason: state.paidReason || "",
    };
  }

  // 欠勤申請の場合
  if (isAbsence) {
    return {
      date: state.absenceDate || "",
      startTime: state.absenceDate || "",
      endTime: state.absenceDate || "",
      reason: state.absenceReason || "",
    };
  }

  const resolveDate = () =>
    state.overtimeDate ||
    (options?.fallbackDateFactory ?? defaultOvertimeDateFactory)();
  if (isOvertime) {
    return {
      date: resolveDate(),
      startTime: state.overtimeStart
        ? formatISOToTime(state.overtimeStart)
        : "",
      endTime: state.overtimeEnd ? formatISOToTime(state.overtimeEnd) : "",
      reason: state.overtimeReason || "",
    };
  }
  // 打刻修正の場合
  const startTime = state.overtimeStart
    ? formatISOToTime(state.overtimeStart)
    : "";
  const endTime = state.overtimeEnd ? formatISOToTime(state.overtimeEnd) : "";

  if (isClockInCorrection) {
    return {
      date: resolveDate(),
      startTime,
      endTime: startTime, // 出勤打刻修正では開始と終了を同じ値で保持
      reason: state.overtimeReason || CLOCK_CORRECTION_LABEL,
    };
  }

  const clockOutTime = endTime || startTime;
  return {
    date: resolveDate(),
    startTime: clockOutTime,
    endTime: clockOutTime,
    reason: state.overtimeReason || CLOCK_CORRECTION_CHECK_OUT_LABEL,
  };
};

type BuildCreateWorkflowInputParams = {
  staffId: string;
  state: WorkflowFormState;
  draftMode: boolean;
  commentOptions?: SubmissionCommentOptions;
  overtimeDateFallbackFactory?: () => string;
};

type BuildUpdateWorkflowInputParams = {
  workflowId: string;
  state: WorkflowFormState;
  draftMode: boolean;
  commentOptions?: SubmissionCommentOptions;
  existingComments?: WorkflowCommentInput[];
};

export const buildCreateWorkflowInput = ({
  staffId,
  state,
  draftMode,
  commentOptions,
  overtimeDateFallbackFactory,
}: BuildCreateWorkflowInputParams): CreateWorkflowInput => {
  const status = draftMode ? WorkflowStatus.DRAFT : WorkflowStatus.SUBMITTED;
  const normalizedCategory = normalizeCategory(state.categoryLabel);
  const input: CreateWorkflowInput = {
    staffId,
    status,
    category: normalizedCategory,
  };

  if (normalizedCategory === WorkflowCategory.CUSTOM) {
    input.customWorkflowTitle = state.customWorkflowTitle.trim();
    input.customWorkflowContent = state.customWorkflowContent.trim();
  }

  const overtimeDetails = buildWorkflowOvertimeDetails(state, {
    fallbackDateFactory: overtimeDateFallbackFactory,
  });
  if (overtimeDetails) input.overTimeDetails = overtimeDetails;

  const comments = buildSubmissionCommentsPayload({
    include: status === WorkflowStatus.SUBMITTED,
    categoryLabel: state.categoryLabel,
    commentText: commentOptions?.commentText,
    builderOptions: commentOptions?.builderOptions,
  });
  if (comments?.length) input.comments = comments;

  return input;
};

export const buildUpdateWorkflowInput = ({
  workflowId,
  state,
  draftMode,
  commentOptions,
  existingComments,
}: BuildUpdateWorkflowInputParams): UpdateWorkflowInput => {
  const status = draftMode ? WorkflowStatus.DRAFT : WorkflowStatus.SUBMITTED;
  const input: UpdateWorkflowInput = {
    id: workflowId,
    status,
  };

  if (state.categoryLabel) {
    const normalizedCategory = normalizeCategory(state.categoryLabel);
    input.category = normalizedCategory;
    if (normalizedCategory === WorkflowCategory.CUSTOM) {
      input.customWorkflowTitle = state.customWorkflowTitle.trim();
      input.customWorkflowContent = state.customWorkflowContent.trim();
    }
  }

  const overtimeDetails = buildWorkflowOvertimeDetails(state);
  if (overtimeDetails) input.overTimeDetails = overtimeDetails;

  const comments = buildSubmissionCommentsPayload({
    include: status === WorkflowStatus.SUBMITTED,
    categoryLabel: state.categoryLabel,
    existingComments,
    commentText: commentOptions?.commentText,
    builderOptions: commentOptions?.builderOptions,
  });
  if (comments?.length) input.comments = comments;

  return input;
};
