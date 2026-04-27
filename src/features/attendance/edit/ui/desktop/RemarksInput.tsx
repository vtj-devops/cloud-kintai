import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import RemarksItem from "@features/attendance/edit/ui/items/RemarksItem";
import { useContext } from "react";

export default function RemarksInput() {
  const { changeRequests } = useContext(AttendanceEditContext);

  if (!changeRequests) return null;

  return <RemarksItem />;
}
