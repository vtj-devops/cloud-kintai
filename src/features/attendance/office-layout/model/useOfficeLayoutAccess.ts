import { AuthContext } from "@app/providers/auth/AuthContext";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { useContext } from "react";

export function useOfficeLayoutAccess() {
  const { isCognitoUserRole } = useContext(AuthContext);

  const isAuthorized =
    isCognitoUserRole(StaffRole.OPERATOR) || isCognitoUserRole(StaffRole.ADMIN);

  return {
    isAuthorized,
  } as const;
}
