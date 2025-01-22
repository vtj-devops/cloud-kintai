import { Typography } from "@mui/material";
import { useContext } from "react";

import { AttendanceEditContext } from "../AttendanceEditProvider";
import { Label } from "./Label";

export function StaffNameItem() {
  const { staff } = useContext(AttendanceEditContext);

  if (!staff) {
    return null;
  }

  return (
    <>
      <Label variant="body1">スタッフ</Label>
      <Typography variant="body1">
        {`${staff.familyName} ${staff.givenName}`}
      </Typography>
    </>
  );
}
