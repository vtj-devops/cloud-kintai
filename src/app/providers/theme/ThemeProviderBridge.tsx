import { ThemeContextProvider } from "@app/providers/theme/ThemeContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "@shared/lib/theme";
import type { ReactNode } from "react";
import { useContext, useMemo } from "react";

type ThemeProviderBridgeProps = {
  children: ReactNode;
};

export function ThemeProviderBridge({ children }: ThemeProviderBridgeProps) {
  const { derived } = useContext(AppConfigContext);
  const appTheme = useMemo(
    () => createAppTheme(derived?.themeColor),
    [derived?.themeColor],
  );

  return (
    <ThemeContextProvider>
      <ThemeProvider theme={appTheme}>{children}</ThemeProvider>
    </ThemeContextProvider>
  );
}
