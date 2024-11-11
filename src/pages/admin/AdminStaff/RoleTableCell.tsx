import { TableCell } from "@mui/material";

import {
  roleLabelMap,
  StaffRole,
  StaffType,
} from "../../../hooks/useStaffs/useStaffs";

export function RoleTableCell({ staff }: { staff: StaffType }) {
  const { role, owner } = staff;
  if (owner) {
    return <TableCell>{roleLabelMap.get(StaffRole.OWNER) || "***"}</TableCell>;
  }

  return <TableCell>{roleLabelMap.get(role) || "***"}</TableCell>;
}
