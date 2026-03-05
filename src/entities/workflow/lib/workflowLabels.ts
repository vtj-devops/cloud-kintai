import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";

export const CLOCK_CORRECTION_CHECK_IN_LABEL = "打刻修正(出勤忘れ)";
export const CLOCK_CORRECTION_CHECK_OUT_LABEL = "打刻修正(退勤忘れ)";
export const CLOCK_CORRECTION_LABEL = CLOCK_CORRECTION_CHECK_IN_LABEL;
const CLOCK_CORRECTION_DISPLAY_LABEL = "打刻修正(出勤/退勤忘れ)";

export const CATEGORY_LABELS: Record<string, string> = {
  [WorkflowCategory.PAID_LEAVE]: "有給休暇申請",
  [WorkflowCategory.ABSENCE]: "欠勤申請",
  [WorkflowCategory.OVERTIME]: "残業申請",
  [WorkflowCategory.CLOCK_CORRECTION]: CLOCK_CORRECTION_DISPLAY_LABEL,
  [WorkflowCategory.CUSTOM]: "その他",
};

export type WorkflowCategoryOrderItem = {
  category: WorkflowCategory;
  label: string;
  displayOrder: number;
  enabled: boolean;
};

type WorkflowCategoryOrderConfigLike = {
  workflowCategoryOrder?: {
    categories?: Array<{
      category?: WorkflowCategory | null;
      label?: string | null;
      displayOrder?: number | null;
      enabled?: boolean | null;
    } | null> | null;
  } | null;
};

const DEFAULT_WORKFLOW_CATEGORY_ORDER: readonly WorkflowCategory[] = [
  WorkflowCategory.PAID_LEAVE,
  WorkflowCategory.ABSENCE,
  WorkflowCategory.CLOCK_CORRECTION,
  WorkflowCategory.OVERTIME,
  WorkflowCategory.CUSTOM,
];

export const getDefaultWorkflowCategoryOrder =
  (): WorkflowCategoryOrderItem[] =>
    DEFAULT_WORKFLOW_CATEGORY_ORDER.map((category, index) => ({
      category,
      label: CATEGORY_LABELS[category],
      displayOrder: index,
      enabled: true,
    }));

const isWorkflowCategory = (value?: string | null): value is WorkflowCategory =>
  typeof value === "string" && value in CATEGORY_LABELS;

export const normalizeWorkflowCategoryOrder = (
  categories?: Array<{
    category?: WorkflowCategory | null;
    label?: string | null;
    displayOrder?: number | null;
    enabled?: boolean | null;
  } | null> | null,
): WorkflowCategoryOrderItem[] => {
  const fallback = getDefaultWorkflowCategoryOrder();
  if (!categories || categories.length === 0) {
    return fallback;
  }

  const inputByCategory = new Map<
    WorkflowCategory,
    WorkflowCategoryOrderItem
  >();
  categories.forEach((item) => {
    if (!item || !isWorkflowCategory(item.category)) {
      return;
    }

    inputByCategory.set(item.category, {
      category: item.category,
      label: item.label?.trim() || CATEGORY_LABELS[item.category],
      displayOrder: item.displayOrder ?? Number.MAX_SAFE_INTEGER,
      enabled: item.enabled ?? true,
    });
  });

  fallback.forEach((item) => {
    if (!inputByCategory.has(item.category)) {
      inputByCategory.set(item.category, item);
    }
  });

  return Array.from(inputByCategory.values())
    .toSorted((a, b) => a.displayOrder - b.displayOrder)
    .map((item, index) => ({ ...item, displayOrder: index }));
};

export const getWorkflowCategoryOrder = (
  appConfig?: WorkflowCategoryOrderConfigLike | null,
): WorkflowCategoryOrderItem[] => {
  const configured = appConfig?.workflowCategoryOrder?.categories;
  return normalizeWorkflowCategoryOrder(configured);
};

export const getEnabledWorkflowCategories = (
  appConfig?: WorkflowCategoryOrderConfigLike | null,
): WorkflowCategoryOrderItem[] =>
  getWorkflowCategoryOrder(appConfig).filter((item) => item.enabled);

export const STATUS_LABELS: Record<string, string> = {
  [WorkflowStatus.DRAFT]: "下書き",
  [WorkflowStatus.SUBMITTED]: "提出済",
  [WorkflowStatus.PENDING]: "承認待ち",
  [WorkflowStatus.APPROVED]: "承認済",
  [WorkflowStatus.REJECTED]: "却下",
  [WorkflowStatus.CANCELLED]: "キャンセル",
};

export const REVERSE_CATEGORY: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(CATEGORY_LABELS).map(([k, v]) => [v, k]),
  ),
  [CLOCK_CORRECTION_CHECK_IN_LABEL]: WorkflowCategory.CLOCK_CORRECTION,
  [CLOCK_CORRECTION_CHECK_OUT_LABEL]: WorkflowCategory.CLOCK_CORRECTION,
};
export const REVERSE_STATUS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_LABELS).map(([k, v]) => [v, k]),
);

type WorkflowLike = {
  category?: WorkflowCategory | null;
  overTimeDetails?: { reason?: string | null } | null;
} | null;

export const resolveClockCorrectionLabel = (reason?: string | null): string => {
  if (reason === CLOCK_CORRECTION_CHECK_OUT_LABEL)
    return CLOCK_CORRECTION_CHECK_OUT_LABEL;
  if (reason === CLOCK_CORRECTION_CHECK_IN_LABEL)
    return CLOCK_CORRECTION_CHECK_IN_LABEL;
  return CLOCK_CORRECTION_DISPLAY_LABEL;
};

export const getWorkflowCategoryLabel = (workflow: WorkflowLike): string => {
  if (!workflow?.category) return "-";
  if (workflow.category === WorkflowCategory.CLOCK_CORRECTION) {
    return resolveClockCorrectionLabel(workflow.overTimeDetails?.reason);
  }
  return (
    CATEGORY_LABELS[workflow.category as WorkflowCategory] ||
    String(workflow.category)
  );
};
