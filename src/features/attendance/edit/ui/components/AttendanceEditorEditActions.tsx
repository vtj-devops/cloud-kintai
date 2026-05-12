import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import {
  AttendanceGetValues,
  AttendanceSetValue,
} from "@features/attendance/edit/model/types";
import GroupContainer from "@shared/ui/group-container/GroupContainer";
import { Dayjs } from "dayjs";
import { UseFieldArrayReplace } from "react-hook-form";

// eslint-disable-next-line import/no-cycle
import EditAttendanceHistoryList from "../EditAttendanceHistoryList/EditAttendanceHistoryList";
import QuickInputButtons from "../QuickInputButtons";
import { SystemCommentList } from "../SystemCommentList";

type AttendanceEditorEditActionsProps = {
  readOnly?: boolean;
  setValue: AttendanceSetValue;
  restReplace: UseFieldArrayReplace<AttendanceEditInputs, "rests">;
  hourlyPaidHolidayTimeReplace: UseFieldArrayReplace<
    AttendanceEditInputs,
    "hourlyPaidHolidayTimes"
  >;
  workDate: Dayjs | null;
  getValues: AttendanceGetValues;
};

export function AttendanceEditorEditActions({
  readOnly,
  setValue,
  restReplace,
  hourlyPaidHolidayTimeReplace,
  workDate,
  getValues,
}: AttendanceEditorEditActionsProps) {
  if (readOnly) {
    return null;
  }

  return (
    <>
      <div className="flex gap-1">
        <EditAttendanceHistoryList />
        <SystemCommentList />
      </div>

      <GroupContainer hideAccent hideBorder>
        <QuickInputButtons
          setValue={setValue}
          restReplace={restReplace}
          hourlyPaidHolidayTimeReplace={hourlyPaidHolidayTimeReplace}
          workDate={workDate}
          visibleMode="admin"
          getValues={getValues}
          readOnly={readOnly}
        />
      </GroupContainer>
    </>
  );
}