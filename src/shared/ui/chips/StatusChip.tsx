import { Chip } from "@mui/material";
import { WorkflowStatus } from "@shared/api/graphql/types";

import { REVERSE_STATUS, STATUS_LABELS } from "@/entities/workflow/lib/workflowLabels";
import { designTokenVar } from "@/shared/designSystem";

type FeedbackKey = "success" | "warning" | "danger" | "info";

const STATUS_FEEDBACK_MAP: Record<WorkflowStatus, FeedbackKey> = {
  [WorkflowStatus.DRAFT]: "info",
  [WorkflowStatus.SUBMITTED]: "info",
  [WorkflowStatus.PENDING]: "warning",
  [WorkflowStatus.APPROVED]: "success",
  [WorkflowStatus.REJECTED]: "danger",
  [WorkflowStatus.CANCELLED]: "danger",
};

type PaletteVars = {
  base: string;
  surface: string;
  border: string;
};

const createFeedbackPalette = (
  key: FeedbackKey,
  defaults: PaletteVars
): PaletteVars => ({
  base: designTokenVar(`color.feedback.${key}.base`, defaults.base),
  surface: designTokenVar(`color.feedback.${key}.surface`, defaults.surface),
  border: designTokenVar(`color.feedback.${key}.border`, defaults.border),
});

const FEEDBACK_COLORS: Record<FeedbackKey, PaletteVars> = {
  success: createFeedbackPalette("success", {
    base: "#1EAA6A",
    surface: "#ECF8F1",
    border: "rgba(30, 170, 106, 0.4)",
  }),
  warning: createFeedbackPalette("warning", {
    base: "#E8A447",
    surface: "#FFF7EA",
    border: "rgba(232, 164, 71, 0.4)",
  }),
  danger: createFeedbackPalette("danger", {
    base: "#D7443E",
    surface: "#FDECEC",
    border: "rgba(215, 68, 62, 0.4)",
  }),
  info: createFeedbackPalette("info", {
    base: "#3C7EDB",
    surface: "#EDF2FC",
    border: "rgba(60, 126, 219, 0.4)",
  }),
};

const FALLBACK_COLORS: PaletteVars = {
  base: designTokenVar(
    "component.workflowList.statusChip.fallback.base",
    "#45574F"
  ),
  surface: designTokenVar(
    "component.workflowList.statusChip.fallback.surface",
    "#EDF1EF"
  ),
  border: designTokenVar(
    "component.workflowList.statusChip.fallback.border",
    "rgba(69, 87, 79, 0.4)"
  ),
};

const STATUS_CHIP_BORDER_RADIUS = designTokenVar(
  "component.workflowList.statusChip.borderRadius",
  "999px"
);
const STATUS_CHIP_FONT_SIZE = designTokenVar(
  "component.workflowList.statusChip.fontSize",
  "14px"
);
const STATUS_CHIP_GAP = designTokenVar(
  "component.workflowList.statusChip.gap",
  "4px"
);
const STATUS_CHIP_PADDING_X = designTokenVar(
  "component.workflowList.statusChip.paddingX",
  "8px"
);
const STATUS_CHIP_FONT_WEIGHT = designTokenVar(
  "component.workflowList.statusChip.fontWeight",
  "500"
);
const STATUS_CHIP_EASING = designTokenVar(
  "component.workflowList.statusChip.transitionEasing",
  "cubic-bezier(0.2, 0.8, 0.4, 1)"
);
const STATUS_CHIP_DURATION = designTokenVar(
  "component.workflowList.statusChip.transitionMs",
  "120ms"
);

const isWorkflowStatus = (value: string): value is WorkflowStatus =>
  Boolean(STATUS_LABELS[value as WorkflowStatus]);

interface StatusChipProps {
  status?: string | null;
}

export default function StatusChip({ status }: StatusChipProps) {
  const resolvedStatus = (() => {
    if (!status) return undefined;
    if (typeof status === "string" && isWorkflowStatus(status)) {
      return status;
    }
    const reverseKey = REVERSE_STATUS[status];
    if (reverseKey && isWorkflowStatus(reverseKey)) {
      return reverseKey;
    }
    return undefined;
  })();

  const label = resolvedStatus
    ? STATUS_LABELS[resolvedStatus]
    : status
    ? status
    : "-";

  const feedbackPalette = resolvedStatus
    ? FEEDBACK_COLORS[STATUS_FEEDBACK_MAP[resolvedStatus]]
    : undefined;
  const palette = feedbackPalette ?? FALLBACK_COLORS;

  return (
    <Chip
      label={label}
      size="small"
      style={{
        borderRadius: STATUS_CHIP_BORDER_RADIUS,
        fontSize: STATUS_CHIP_FONT_SIZE,
        fontWeight: STATUS_CHIP_FONT_WEIGHT,
        columnGap: STATUS_CHIP_GAP,
        paddingLeft: STATUS_CHIP_PADDING_X,
        paddingRight: STATUS_CHIP_PADDING_X,
        transition: `background-color ${STATUS_CHIP_DURATION} ${STATUS_CHIP_EASING}, color ${STATUS_CHIP_DURATION} ${STATUS_CHIP_EASING}`,
        backgroundColor: palette.surface,
        color: palette.base,
        border: `1px solid ${palette.border}`,
      }}
    />
  );
}
