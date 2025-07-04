import { useContext } from "react";
import { Outlet } from "react-router-dom";

import { StaffRole } from "../../hooks/useStaffs/useStaffs";
import { AuthContext } from "../../context/AuthContext";
import NotFound from "../NotFound";

export default function OfficeLayout() {
  const { isCognitoUserRole } = useContext(AuthContext);

  if (
    !isCognitoUserRole(StaffRole.OPERATOR) &&
    !isCognitoUserRole(StaffRole.ADMIN)
  ) {
    return <NotFound />;
  }

  return <Outlet />;
}
