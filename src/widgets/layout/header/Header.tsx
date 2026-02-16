import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import Logo from "@shared/ui/logo/Logo";
import { useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";

import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";
import { resolveThemeColor } from "@/shared/config/theme";
import { designTokenVar } from "@/shared/designSystem";
import HeaderBar from "@/shared/ui/header/HeaderBar";

import { ExternalLinks } from "./ExternalLinks/ExternalLinks";
import NavigationMenu from "./NavigationMenu";
import { SignInOutButton } from "./SignInOutButton";

export default function Header() {
  const { isCognitoUserRole } = useContext(AuthContext);
  const { getThemeColor } = useContext(AppConfigContext);
  const location = useLocation();

  const pathName = location.pathname === "/" ? "/register" : location.pathname;

  const resolvedThemeColor = useMemo(
    () =>
      resolveThemeColor(
        typeof getThemeColor === "function" ? getThemeColor() : undefined
      ),
    [getThemeColor]
  );
  const headerThemeColor = designTokenVar(
    "color.brand.primary.base",
    resolvedThemeColor
  );

  const showExternalLinks = !isCognitoUserRole(StaffRole.OPERATOR);

  return (
    <HeaderBar
      themeColor={headerThemeColor}
      logo={<Logo />}
      navigation={<NavigationMenu pathName={pathName} />}
      externalLinks={showExternalLinks ? <ExternalLinks /> : null}
      signInOutButton={<SignInOutButton />}
    />
  );
}
