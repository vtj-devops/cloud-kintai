import {
  Rest,
  UpdateAttendanceInput,
} from "@shared/api/graphql/types";

export type RestInputs = {
  startTime: Rest["startTime"] | null;
  endTime: Rest["endTime"] | null;
};

export type HourlyPaidHolidayTimeInputs = {
  startTime: string | null | undefined;
  endTime: string | null | undefined;
};

export type AttendanceEditInputs = {
  workDate?: UpdateAttendanceInput["workDate"] | null;
  startTime?: UpdateAttendanceInput["startTime"] | null;
  endTime?: UpdateAttendanceInput["endTime"] | null;
  isDeemedHoliday?: UpdateAttendanceInput["isDeemedHoliday"];
  specialHolidayFlag?: UpdateAttendanceInput["specialHolidayFlag"];
  paidHolidayFlag?: UpdateAttendanceInput["paidHolidayFlag"];
  absentFlag?: UpdateAttendanceInput["absentFlag"];
  hourlyPaidHolidayTimes?: HourlyPaidHolidayTimeInputs[];
  substituteHolidayDate?: UpdateAttendanceInput["substituteHolidayDate"];
  goDirectlyFlag?: UpdateAttendanceInput["goDirectlyFlag"];
  returnDirectlyFlag?: UpdateAttendanceInput["returnDirectlyFlag"];
  remarks?: UpdateAttendanceInput["remarks"];
  remarkTags?: string[];
  rests?: RestInputs[];
  staffComment?: string;
  histories?: UpdateAttendanceInput["histories"];
  changeRequests?: UpdateAttendanceInput["changeRequests"];
  revision?: UpdateAttendanceInput["revision"];
};

export const defaultValues: AttendanceEditInputs = {
  startTime: null,
  isDeemedHoliday: false,
  specialHolidayFlag: false,
  endTime: null,
  paidHolidayFlag: false,
  hourlyPaidHolidayTimes: [],
  substituteHolidayDate: null,
  absentFlag: false,
  goDirectlyFlag: false,
  returnDirectlyFlag: false,
  remarks: "",
  remarkTags: [],
  rests: [],
};
