import { designTokenVar } from "@shared/designSystem";

type FeedbackKey = "success" | "warning" | "danger" | "info";

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

type StatusChipProps<T extends string = string> = {
  status?: T | null;
  labelMap: Partial<Record<T, string>>;
  colorMap: Partial<Record<T, FeedbackKey>>;
  size?: "small" | "medium";
};

export default function StatusChip<T extends string = string>({
  status,
  labelMap,
  colorMap,
}: StatusChipProps<T>) {
  const label = status != null ? (labelMap[status] ?? status) : "-";
  const feedbackKey = status != null ? colorMap[status] : undefined;
  const palette = feedbackKey != null ? FEEDBACK_COLORS[feedbackKey] : FALLBACK_COLORS;

  return (
    <span
      className="inline-flex min-h-6 max-w-full items-center justify-center whitespace-nowrap"
      style={{
        boxSizing: "border-box",
        borderRadius: STATUS_CHIP_BORDER_RADIUS,
        fontSize: `clamp(12px, 3.2vw, ${STATUS_CHIP_FONT_SIZE})`,
        fontWeight: STATUS_CHIP_FONT_WEIGHT,
        lineHeight: 1.4,
        gap: STATUS_CHIP_GAP,
        maxWidth: "100%",
        paddingLeft: STATUS_CHIP_PADDING_X,
        paddingRight: STATUS_CHIP_PADDING_X,
        paddingTop: "2px",
        paddingBottom: "2px",
        transition: `background-color ${STATUS_CHIP_DURATION} ${STATUS_CHIP_EASING}, color ${STATUS_CHIP_DURATION} ${STATUS_CHIP_EASING}`,
        backgroundColor: palette.surface,
        color: palette.base,
        border: `1px solid ${palette.border}`,
        overflow: "hidden",
        textOverflow: "ellipsis",
        verticalAlign: "middle",
        flexShrink: 1,
      }}
    >
      {label}
    </span>
  );
}
