import { TableCell } from "@mui/material";

import { StaffType } from "../../../hooks/useStaffs/useStaffs";

export function StaffNameTableCell({ staff }: { staff: StaffType }) {
  const { familyName, givenName } = staff;
  const fullName = (() => {
    if (!familyName || !givenName) {
      return null;
    }

    const names = [];
    if (familyName) names.push(familyName);
    if (givenName) names.push(givenName);

    return names.join(" ");
  })();

  return <TableCell>{fullName || "(未設定)"}</TableCell>;
}
