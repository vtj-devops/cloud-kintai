// cspell:words Noto
import { createTheme, responsiveFontSizes } from "@mui/material";

declare module "@mui/material/styles" {
  interface Palette {
    cancel: Palette["error"];
    rest: Palette["primary"];
    clock_in: Palette["primary"];
    clock_out: Palette["error"];
    login: Palette["primary"];
    logout: Palette["error"];
    delete: Palette["error"];
  }

  interface PaletteOptions {
    cancel?: PaletteOptions["error"];
    rest?: PaletteOptions["primary"];
    clock_in?: PaletteOptions["primary"];
    clock_out?: PaletteOptions["error"];
    login?: PaletteOptions["primary"];
    logout?: PaletteOptions["error"];
    delete?: PaletteOptions["error"];
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    cancel: true;
    rest: true;
    clock_in: true;
    clock_out: true;
    login: true;
    logout: true;
    delete: true;
  }

  interface ButtonPropsVariantOverrides {
    cancel: true;
    rest: true;
    clock_in: true;
    clock_out: true;
    login: true;
    logout: true;
    delete: true;
  }
}

export type Color =
  | "inherit"
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "info"
  | "warning"
  | "cancel"
  | "rest"
  | "clock_in"
  | "clock_out"
  | "login"
  | "logout"
  | "delete";
export type Variant = "text" | "outlined" | "contained";

const palette = {
  primary: { main: "#0FA85E", contrastText: "#fff" },
  secondary: { main: "#fff", contrastText: "#0FA85E" },
  success: { main: "#0FA85E", contrastText: "#fff" },
  error: { main: "#B33D47", contrastText: "#fff" },
  warning: { main: "#B33D47", contrastText: "#fff" },
  cancel: { main: "#B33D47", contrastText: "#fff" },
  rest: { main: "#2ACEDB", contrastText: "#fff" },
  clock_in: { main: "#0FA85E", contrastText: "#fff" },
  clock_out: { main: "#B33D47", contrastText: "#fff" },
  login: { main: "#0FA85E", contrastText: "#fff" },
  logout: { main: "#B33D47", contrastText: "#fff" },
  delete: { main: "#B33D47", contrastText: "#fff" },
};

export const theme = responsiveFontSizes(
  createTheme({
    palette,
    typography: {
      fontFamily: ["Noto Sans JP"].join(","),
    },
    components: {
      MuiTypography: {
        styleOverrides: {
          h2: {
            lineHeight: "1.5",
          },
          h4: {
            lineHeight: "1.5",
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: `
        @font-face {
          font-family: 'Noto Sans JP';
          font-style: bold;
          font-weight: 700;
        }`,
      },
      MuiLink: {
        variants: [
          {
            props: { variant: "button", color: "primary" },
            style: {
              backgroundColor: palette.primary.main,
              color: palette.primary.contrastText,
              textDecoration: "none",
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
              borderRadius: "5px",
              "&:hover": {
                backgroundColor: palette.secondary.contrastText,
                color: palette.secondary.main,
                textDecoration: "none",
                borderRadius: "5px",
              },
            },
          },
        ],
      },
    },
  })
);
