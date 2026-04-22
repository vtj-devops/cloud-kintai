import { AuthContext } from "@app/providers/auth/AuthContext";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import { useContext } from "react";
import { Outlet } from "react-router-dom";

import NotFound from "../NotFound";

export default function AdminGuard() {
  const { isCognitoUserRole } = useContext(AuthContext);

  if (!isCognitoUserRole(StaffRole.ADMIN)) {
    return <NotFound />;
  }

  return <Outlet />;
}
