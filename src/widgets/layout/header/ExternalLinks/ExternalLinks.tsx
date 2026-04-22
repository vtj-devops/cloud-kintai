import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { usePersonalExternalLinks } from "@entities/staff/model/useStaff/usePersonalExternalLinks";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import ExternalLinksView, {
  ExternalLinkItem,
} from "@shared/ui/header/ExternalLinks";
import { useContext, useMemo } from "react";

export function ExternalLinks() {
  const { cognitoUser, authStatus, isCognitoUserRole } =
    useContext(AuthContext);
  const { getLinks } = useContext(AppConfigContext);

  const companyLinks = useMemo<ExternalLinkItem[]>(() => {
    const resolvedLinks =
      typeof getLinks === "function" ? filterEnabledLinks(getLinks()) : [];
    return resolvedLinks;
  }, [getLinks]);

  const personalLinks = usePersonalExternalLinks(cognitoUser?.id);

  const { familyName = "", givenName = "" } = cognitoUser ?? {};

  const staffName = useMemo(() => {
    const names = [familyName, givenName]
      .map((name) => name.trim())
      .filter(Boolean);
    return names.join(" ");
  }, [familyName, givenName]);

  const mergedLinks = useMemo(
    () => [...companyLinks, ...personalLinks],
    [companyLinks, personalLinks],
  );

  if (
    isCognitoUserRole(StaffRole.OPERATOR) ||
    authStatus !== "authenticated" ||
    !cognitoUser
  ) {
    return null;
  }

  return <ExternalLinksView links={mergedLinks} staffName={staffName} />;
}

const filterEnabledLinks = (links: ExternalLinkItem[]) =>
  links.filter(
    (link) =>
      Boolean(link.enabled) &&
      typeof link.label === "string" &&
      link.label.trim() !== "" &&
      typeof link.url === "string" &&
      link.url.trim() !== "",
  );
