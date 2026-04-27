// cspell:words Noto
import { type ThemeOptions } from "@mui/material/styles";
import { type DesignTokens } from "@shared/designSystem";

import { type AppPalette } from "./palette";
import { type TypographyHelpers } from "./typography";

const toPx = (value: number) => `${value}px`;

export const createComponents = (
  tokens: DesignTokens,
  palette: AppPalette,
  helpers: TypographyHelpers,
): ThemeOptions["components"] => {
  const { spacing, radius, typography, component, shadow, color } = tokens;
  const { getLineHeight } = helpers;
  const buttonPadding = `${toPx(spacing.xs)} ${toPx(spacing.lg)}`;
  const pageSectionRadius = component.pageSection.radius ?? radius.lg;
  const pageSectionBackground = component.pageSection.background;
  const surfaceBorderColor = color.neutral[200];
  const cardShadow = component.pageSection.shadow ?? shadow.card;
  const cardPadding = `${toPx(spacing.md)} ${toPx(spacing.lg)}`;
  const rootLineHeight = getLineHeight(typography.lineHeight.relaxed);
  const buttonLineHeight = getLineHeight(typography.lineHeight.comfy);

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: component.appShell.background,
          color: component.appShell.textColor,
          fontFamily: typography.fontFamily,
          lineHeight: rootLineHeight,
        },
        "#root": {
          backgroundColor: component.appShell.contentBackground,
        },
        "@font-face": [
          {
            fontFamily: "Noto Sans JP",
            fontStyle: "normal",
            fontWeight: 700,
            fontDisplay: "swap",
            src: "local('Noto Sans JP')",
          },
        ],
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: toPx(radius.sm),
          fontWeight: typography.fontWeight.medium,
          padding: buttonPadding,
          gap: toPx(spacing.xs),
          textTransform: "none",
          boxShadow: "none",
          lineHeight: buttonLineHeight,
          "&:hover": {
            boxShadow: shadow.card,
          },
        },
        containedSecondary: {
          color: palette.secondary.contrastText,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: pageSectionBackground,
          color: component.appShell.textColor,
        },
        rounded: {
          borderRadius: toPx(pageSectionRadius),
        },
        outlined: {
          border: `1px solid ${surfaceBorderColor}`,
          boxShadow: "none",
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: toPx(pageSectionRadius),
          boxShadow: cardShadow,
          padding: cardPadding,
          backgroundColor: pageSectionBackground,
          border: `1px solid ${surfaceBorderColor}`,
        },
      },
    },
    MuiLink: {
      variants: [
        {
          props: { variant: "button", color: "primary" },
          style: {
            backgroundColor: palette.primary.main,
            color: palette.primary.contrastText,
            textDecoration: "none",
            borderRadius: toPx(radius.sm),
            padding: buttonPadding,
            fontWeight: typography.fontWeight.medium,
            "&:hover": {
              backgroundColor: palette.primary.contrastText,
              color: palette.primary.main,
              textDecoration: "none",
            },
          },
        },
        {
          props: { variant: "button", color: "secondary" },
          style: {
            backgroundColor: palette.secondary.main,
            color: palette.secondary.contrastText,
            textDecoration: "none",
            borderRadius: toPx(radius.sm),
            padding: buttonPadding,
            fontWeight: typography.fontWeight.medium,
            "&:hover": {
              backgroundColor: palette.secondary.contrastText,
              color: palette.secondary.main,
              textDecoration: "none",
            },
          },
        },
      ],
    },
  };
};
