import { Rest, SystemCommentInput, UpdateAttendanceInput } from "../../API";

export type RestInputs = {
  startTime: Rest["startTime"] | null;
  endTime: Rest["endTime"] | null;
};

export type AttendanceEditInputs = {
  workDate?: UpdateAttendanceInput["workDate"] | null;
  startTime: UpdateAttendanceInput["startTime"];
  endTime: UpdateAttendanceInput["endTime"];
  paidHolidayFlag: UpdateAttendanceInput["paidHolidayFlag"];
  substituteHolidayDate: UpdateAttendanceInput["substituteHolidayDate"];
  goDirectlyFlag: UpdateAttendanceInput["goDirectlyFlag"];
  returnDirectlyFlag: UpdateAttendanceInput["returnDirectlyFlag"];
  remarks: UpdateAttendanceInput["remarks"];
  rests: RestInputs[];
  staffComment?: string;
  histories?: UpdateAttendanceInput["histories"];
  changeRequests?: UpdateAttendanceInput["changeRequests"];
  systemComments: SystemCommentInput[];
  revision?: UpdateAttendanceInput["revision"];
};

export const defaultValues: AttendanceEditInputs = {
  startTime: undefined,
  endTime: undefined,
  paidHolidayFlag: undefined,
  substituteHolidayDate: undefined,
  goDirectlyFlag: undefined,
  returnDirectlyFlag: undefined,
  remarks: undefined,
  rests: [],
  systemComments: [],
};
