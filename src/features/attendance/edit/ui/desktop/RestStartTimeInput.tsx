import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { FieldArrayWithId } from "react-hook-form";

import RestDesktopTimeInput from "./RestDesktopTimeInput";

type Props = {
  rest: FieldArrayWithId<AttendanceEditInputs, "rests", "id">;
  index: number;
  testIdPrefix?: string;
};

export default function RestStartTimeInput({ rest, index, testIdPrefix }: Props) {
  return (
    <RestDesktopTimeInput type="start" rest={rest} index={index} testIdPrefix={testIdPrefix} />
  );
}
