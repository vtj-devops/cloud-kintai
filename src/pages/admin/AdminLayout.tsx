import { useContext } from "react";
import { Outlet } from "react-router-dom";

import { StaffRole } from "../../hooks/useStaffs/useStaffs";
import { AuthContext } from "../../Layout";
import NotFound from "../NotFound";

export default function AdminLayout() {
  const { isCognitoUserRole } = useContext(AuthContext);

  if (!isCognitoUserRole(StaffRole.ADMIN)) {
    return <NotFound />;
  }

  return <Outlet />;
}
