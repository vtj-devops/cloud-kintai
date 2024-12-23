import { TableCell } from "@mui/material";
import dayjs from "dayjs";

import { StaffType } from "../../../hooks/useStaffs/useStaffs";

export function UpdatedAtTableCell({ staff }: { staff: StaffType }) {
  const { updatedAt } = staff;
  const formattedDate = dayjs(updatedAt).format("YYYY/MM/DD HH:mm");

  return <TableCell>{formattedDate}</TableCell>;
}
