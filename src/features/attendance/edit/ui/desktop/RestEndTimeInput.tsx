import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { FieldArrayWithId } from "react-hook-form";

import RestDesktopTimeInput from "./RestDesktopTimeInput";

type Props = {
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  index: number;
  testIdPrefix?: string;
};

export default function RestEndTimeInput({ rest, index, testIdPrefix }: Props) {
  return (
    <RestDesktopTimeInput type="end" rest={rest} index={index} testIdPrefix={testIdPrefix} />
  );
}
