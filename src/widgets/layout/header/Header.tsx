import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { resolveThemeColor } from "@shared/config/theme";
import { designTokenVar } from "@shared/designSystem";
import HeaderBar from "@shared/ui/header/HeaderBar";
import Logo from "@shared/ui/logo/Logo";
import { useContext, useMemo } from "react";

import { ExternalLinks } from "./ExternalLinks/ExternalLinks";
import NavigationMenu from "./NavigationMenu";
import { SignInOutButton } from "./SignInOutButton";
import WorkflowNotificationButton from "./WorkflowNotificationButton";

export default function Header() {
  const { getThemeColor } = useContext(AppConfigContext);

  const resolvedThemeColor = useMemo(
    () =>
      resolveThemeColor(
        typeof getThemeColor === "function" ? getThemeColor() : undefined,
      ),
    [getThemeColor],
  );
  const headerThemeColor = designTokenVar(
    "color.brand.primary.base",
    resolvedThemeColor,
  );

  return (
    <HeaderBar
      themeColor={headerThemeColor}
      logo={<Logo />}
      navigation={<NavigationMenu />}
      notificationsButton={<WorkflowNotificationButton />}
      externalLinks={<ExternalLinks />}
      signInOutButton={<SignInOutButton />}
    />
  );
}
