import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { resolveThemeColor } from "@shared/config/theme";
import FooterView from "@shared/ui/footer/Footer";
import { useContext, useMemo } from "react";

export default function Footer() {
  const { getThemeColor } = useContext(AppConfigContext);
  const themeColor = useMemo(
    () =>
      resolveThemeColor(
        typeof getThemeColor === "function" ? getThemeColor() : undefined
      ),
    [getThemeColor]
  );

  return <FooterView themeColor={themeColor} />;
}
