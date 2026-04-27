import { type DesignTokens } from "@shared/designSystem";

import { type TypographyMode } from "./types";

type FontSizeTokenKey = keyof DesignTokens["typography"]["fontSize"];

export const TYPOGRAPHY_MODE_ADJUSTMENTS: Record<
  TypographyMode,
  Record<FontSizeTokenKey, number>
> = {
  balanced: {
    xs: -1,
    sm: -1,
    md: -2,
    lg: -2,
    xl: -3,
    display: -4,
  },
  comfortable: {
    xs: 0,
    sm: 0,
    md: 0,
    lg: 0,
    xl: 0,
    display: 0,
  },
};

export const LINE_HEIGHT_SCALE: Record<TypographyMode, number> = {
  balanced: 0.95,
  comfortable: 1,
};

const MIN_FONT_SIZE = 10;

export const createTypographyHelpers = (
  tokens: DesignTokens,
  mode: TypographyMode,
) => {
  const adjustments = TYPOGRAPHY_MODE_ADJUSTMENTS[mode];
  const scale = LINE_HEIGHT_SCALE[mode];

  const getFontSize = (key: FontSizeTokenKey) => {
    const base = tokens.typography.fontSize[key];
    const delta = adjustments[key] ?? 0;
    return Math.max(MIN_FONT_SIZE, base + delta);
  };

  const getLineHeight = (value: number) => {
    const scaled = Number((value * scale).toFixed(2));
    return Math.max(1.1, scaled);
  };

  return { getFontSize, getLineHeight };
};

export type TypographyHelpers = ReturnType<typeof createTypographyHelpers>;

export const buildTypography = (
  tokens: DesignTokens,
  helpers: TypographyHelpers,
) => {
  const { fontFamily, fontWeight, lineHeight } = tokens.typography;
  const { heading } = tokens.component;
  const { getFontSize, getLineHeight } = helpers;

  return {
    fontFamily,
    fontSize: getFontSize("md"),
    h1: {
      fontSize: heading.page.fontSizeMobile,
      fontWeight: heading.page.fontWeight,
      lineHeight: getLineHeight(heading.page.lineHeight),
      letterSpacing: heading.page.letterSpacing,
    },
    h2: {
      fontSize: heading.section.fontSizeMobile,
      fontWeight: heading.section.fontWeight,
      lineHeight: getLineHeight(heading.section.lineHeight),
      letterSpacing: heading.section.letterSpacing,
    },
    h3: {
      fontSize: heading.subsection.fontSizeMobile,
      fontWeight: heading.subsection.fontWeight,
      lineHeight: getLineHeight(heading.subsection.lineHeight),
      letterSpacing: heading.subsection.letterSpacing,
    },
    h4: {
      fontSize: getFontSize("md"),
      fontWeight: fontWeight.bold,
      lineHeight: getLineHeight(lineHeight.comfy),
    },
    h5: {
      fontSize: getFontSize("sm"),
      fontWeight: fontWeight.medium,
      lineHeight: getLineHeight(lineHeight.relaxed),
    },
    h6: {
      fontSize: getFontSize("xs"),
      fontWeight: fontWeight.medium,
      lineHeight: getLineHeight(lineHeight.relaxed),
    },
    subtitle1: {
      fontSize: getFontSize("md"),
      fontWeight: fontWeight.medium,
      lineHeight: getLineHeight(lineHeight.comfy),
    },
    subtitle2: {
      fontSize: getFontSize("sm"),
      fontWeight: fontWeight.medium,
      lineHeight: getLineHeight(lineHeight.comfy),
    },
    body1: {
      fontSize: getFontSize("md"),
      lineHeight: getLineHeight(lineHeight.relaxed),
    },
    body2: {
      fontSize: getFontSize("sm"),
      lineHeight: getLineHeight(lineHeight.relaxed),
    },
    button: {
      fontSize: getFontSize("md"),
      fontWeight: fontWeight.medium,
      lineHeight: getLineHeight(lineHeight.comfy),
      textTransform: "none" as const,
    },
    caption: {
      fontSize: getFontSize("xs"),
      lineHeight: getLineHeight(lineHeight.tight),
    },
    overline: {
      fontSize: getFontSize("xs"),
      letterSpacing: 0.8,
      textTransform: "uppercase" as const,
      lineHeight: getLineHeight(lineHeight.tight),
    },
  };
};
