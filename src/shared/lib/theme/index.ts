import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { getDesignTokens } from "@shared/designSystem";

import { createComponents } from "./components";
import { createPalette } from "./palette";
import { type ThemeOverrideOptions, type TypographyMode } from "./types";
import { buildTypography, createTypographyHelpers } from "./typography";

export type { Color, ThemeOverrideOptions, TypographyMode, Variant } from "./types";

type ThemeFactoryInput = string | ThemeOverrideOptions | undefined;

const normalizeThemeOverrides = (input?: ThemeFactoryInput) => {
  if (!input || typeof input === "string") {
    return {
      brandPrimary: typeof input === "string" ? input : undefined,
      typographyMode: "balanced" as TypographyMode,
    };
  }

  return {
    brandPrimary: input.brandPrimary,
    typographyMode: input.typographyMode ?? "balanced",
  };
};

const createThemeConfig = (overrides?: ThemeFactoryInput) => {
  const { brandPrimary, typographyMode } = normalizeThemeOverrides(overrides);
  const tokens = getDesignTokens(brandPrimary ? { brandPrimary } : undefined);
  const palette = createPalette(tokens);
  const typographyHelpers = createTypographyHelpers(tokens, typographyMode);

  return createTheme({
    palette,
    spacing: tokens.spacing.unit,
    typography: buildTypography(tokens, typographyHelpers),
    shape: {
      borderRadius: tokens.radius.md,
    },
    cssVariables: {
      colorSchemeSelector: "class",
    },
    components: createComponents(tokens, palette, typographyHelpers),
  });
};

export const createAppTheme = (overrides?: ThemeFactoryInput) =>
  responsiveFontSizes(createThemeConfig(overrides));

export const theme = createAppTheme();
