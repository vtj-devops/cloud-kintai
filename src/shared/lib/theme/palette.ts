import { type DesignTokens } from "@shared/designSystem";

export const createPalette = (tokens: DesignTokens) => {
  const {
    color: { brand, feedback, neutral },
  } = tokens;
  const lightOnPrimary = brand.primary.contrastText;
  const darkText = neutral[900];

  return {
    primary: {
      main: brand.primary.base,
      contrastText: lightOnPrimary,
    },
    secondary: {
      main: brand.primary.contrastText,
      contrastText: brand.primary.base,
    },
    success: {
      main: feedback.success.base,
      contrastText: lightOnPrimary,
    },
    error: {
      main: feedback.danger.base,
      contrastText: lightOnPrimary,
    },
    warning: {
      main: feedback.warning.base,
      contrastText: lightOnPrimary,
    },
    cancel: {
      main: feedback.danger.base,
      contrastText: lightOnPrimary,
    },
    rest: {
      main: brand.primary.surface,
      contrastText: brand.primary.base,
    },
    clock_in: {
      main: brand.primary.base,
      contrastText: lightOnPrimary,
    },
    clock_out: {
      main: feedback.danger.base,
      contrastText: lightOnPrimary,
    },
    login: {
      main: brand.primary.base,
      contrastText: lightOnPrimary,
    },
    logout: {
      main: feedback.danger.base,
      contrastText: lightOnPrimary,
    },
    delete: {
      main: feedback.danger.base,
      contrastText: lightOnPrimary,
    },
    info: {
      main: feedback.info.base,
      contrastText: darkText,
    },
  };
};

export type AppPalette = ReturnType<typeof createPalette>;
