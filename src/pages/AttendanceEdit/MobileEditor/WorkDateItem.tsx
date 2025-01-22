import { useContext } from "react";

import { AttendanceEditContext } from "../AttendanceEditProvider";
import MoveDateItem from "../MoveDateItem";
import { Label } from "./Label";

export function WorkDateItem() {
  const { workDate } = useContext(AttendanceEditContext);

  if (!workDate) return null;

  return (
    <>
      <Label variant="body1">勤務日</Label>
      <MoveDateItem workDate={workDate} />
    </>
  );
}
