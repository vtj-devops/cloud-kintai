/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateCheckForUpdateInput = {
  id?: string | null;
  deployUuid: string;
};

export type ModelCheckForUpdateConditionInput = {
  deployUuid?: ModelStringInput | null;
  and?: Array<ModelCheckForUpdateConditionInput | null> | null;
  or?: Array<ModelCheckForUpdateConditionInput | null> | null;
  not?: ModelCheckForUpdateConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelStringInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}

export type ModelSizeInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
};

export type CheckForUpdate = {
  __typename: "CheckForUpdate";
  id: string;
  deployUuid: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCheckForUpdateInput = {
  id: string;
  deployUuid?: string | null;
};

export type DeleteCheckForUpdateInput = {
  id: string;
};

export type CreateAppConfigInput = {
  id?: string | null;
  name: string;
  workStartTime?: string | null;
  workEndTime?: string | null;
  lunchRestStartTime?: string | null;
  lunchRestEndTime?: string | null;
  standardWorkHours?: number | null;
  amHolidayStartTime?: string | null;
  amHolidayEndTime?: string | null;
  pmHolidayStartTime?: string | null;
  pmHolidayEndTime?: string | null;
  specialHolidayEnabled?: boolean | null;
  amPmHolidayEnabled?: boolean | null;
  officeMode?: boolean | null;
  attendanceStatisticsEnabled?: boolean | null;
  absentEnabled?: boolean | null;
  hourlyPaidHolidayEnabled?: boolean | null;
  links?: Array<LinkInput | null> | null;
  reasons?: Array<ReasonInput | null> | null;
  quickInputStartTimes?: Array<QuickInputTimeInput | null> | null;
  quickInputEndTimes?: Array<QuickInputTimeInput | null> | null;
  themeColor?: string | null;
  shiftGroups?: Array<ShiftGroupInput | null> | null;
  overTimeCheckEnabled?: boolean | null;
};

export type LinkInput = {
  label: string;
  url: string;
  enabled: boolean;
  icon?: string | null;
};

export type ReasonInput = {
  reason: string;
  enabled: boolean;
};

export type QuickInputTimeInput = {
  time: string;
  enabled: boolean;
};

export type ShiftGroupInput = {
  label: string;
  description?: string | null;
  min?: number | null;
  max?: number | null;
  fixed?: number | null;
};

export type ModelAppConfigConditionInput = {
  name?: ModelStringInput | null;
  workStartTime?: ModelStringInput | null;
  workEndTime?: ModelStringInput | null;
  lunchRestStartTime?: ModelStringInput | null;
  lunchRestEndTime?: ModelStringInput | null;
  standardWorkHours?: ModelFloatInput | null;
  amHolidayStartTime?: ModelStringInput | null;
  amHolidayEndTime?: ModelStringInput | null;
  pmHolidayStartTime?: ModelStringInput | null;
  pmHolidayEndTime?: ModelStringInput | null;
  specialHolidayEnabled?: ModelBooleanInput | null;
  amPmHolidayEnabled?: ModelBooleanInput | null;
  officeMode?: ModelBooleanInput | null;
  attendanceStatisticsEnabled?: ModelBooleanInput | null;
  absentEnabled?: ModelBooleanInput | null;
  hourlyPaidHolidayEnabled?: ModelBooleanInput | null;
  themeColor?: ModelStringInput | null;
  overTimeCheckEnabled?: ModelBooleanInput | null;
  and?: Array<ModelAppConfigConditionInput | null> | null;
  or?: Array<ModelAppConfigConditionInput | null> | null;
  not?: ModelAppConfigConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelFloatInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export type ModelBooleanInput = {
  ne?: boolean | null;
  eq?: boolean | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export type AppConfig = {
  __typename: "AppConfig";
  id: string;
  name: string;
  workStartTime?: string | null;
  workEndTime?: string | null;
  lunchRestStartTime?: string | null;
  lunchRestEndTime?: string | null;
  standardWorkHours?: number | null;
  amHolidayStartTime?: string | null;
  amHolidayEndTime?: string | null;
  pmHolidayStartTime?: string | null;
  pmHolidayEndTime?: string | null;
  specialHolidayEnabled?: boolean | null;
  amPmHolidayEnabled?: boolean | null;
  officeMode?: boolean | null;
  attendanceStatisticsEnabled?: boolean | null;
  absentEnabled?: boolean | null;
  hourlyPaidHolidayEnabled?: boolean | null;
  links?: Array<Link | null> | null;
  reasons?: Array<Reason | null> | null;
  quickInputStartTimes?: Array<QuickInputTime | null> | null;
  quickInputEndTimes?: Array<QuickInputTime | null> | null;
  themeColor?: string | null;
  shiftGroups?: Array<ShiftGroup | null> | null;
  overTimeCheckEnabled?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type Link = {
  __typename: "Link";
  label: string;
  url: string;
  enabled: boolean;
  icon?: string | null;
};

export type Reason = {
  __typename: "Reason";
  reason: string;
  enabled: boolean;
};

export type QuickInputTime = {
  __typename: "QuickInputTime";
  time: string;
  enabled: boolean;
};

export type ShiftGroup = {
  __typename: "ShiftGroup";
  label: string;
  description?: string | null;
  min?: number | null;
  max?: number | null;
  fixed?: number | null;
};

export type UpdateAppConfigInput = {
  id: string;
  name?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  lunchRestStartTime?: string | null;
  lunchRestEndTime?: string | null;
  standardWorkHours?: number | null;
  amHolidayStartTime?: string | null;
  amHolidayEndTime?: string | null;
  pmHolidayStartTime?: string | null;
  pmHolidayEndTime?: string | null;
  specialHolidayEnabled?: boolean | null;
  amPmHolidayEnabled?: boolean | null;
  officeMode?: boolean | null;
  attendanceStatisticsEnabled?: boolean | null;
  absentEnabled?: boolean | null;
  hourlyPaidHolidayEnabled?: boolean | null;
  links?: Array<LinkInput | null> | null;
  reasons?: Array<ReasonInput | null> | null;
  quickInputStartTimes?: Array<QuickInputTimeInput | null> | null;
  quickInputEndTimes?: Array<QuickInputTimeInput | null> | null;
  themeColor?: string | null;
  shiftGroups?: Array<ShiftGroupInput | null> | null;
  overTimeCheckEnabled?: boolean | null;
};

export type DeleteAppConfigInput = {
  id: string;
};

export type CreateStaffInput = {
  id?: string | null;
  cognitoUserId: string;
  familyName?: string | null;
  givenName?: string | null;
  mailAddress: string;
  role: string;
  enabled: boolean;
  status: string;
  owner?: boolean | null;
  usageStartDate?: string | null;
  notifications?: NotificationInput | null;
  externalLinks?: Array<StaffExternalLinkInput | null> | null;
  sortKey?: string | null;
  workType?: string | null;
  developer?: boolean | null;
  approverSetting?: ApproverSettingMode | null;
  approverSingle?: string | null;
  approverMultiple?: Array<string | null> | null;
  approverMultipleMode?: ApproverMultipleMode | null;
  shiftGroup?: string | null;
};

export type NotificationInput = {
  workStart?: boolean | null;
  workEnd?: boolean | null;
};

export type StaffExternalLinkInput = {
  label: string;
  url: string;
  enabled: boolean;
  icon: string;
};

export enum ApproverSettingMode {
  ADMINS = "ADMINS",
  SINGLE = "SINGLE",
  MULTIPLE = "MULTIPLE",
}

export enum ApproverMultipleMode {
  ANY = "ANY",
  ORDER = "ORDER",
}

export type ModelStaffConditionInput = {
  cognitoUserId?: ModelStringInput | null;
  familyName?: ModelStringInput | null;
  givenName?: ModelStringInput | null;
  mailAddress?: ModelStringInput | null;
  role?: ModelStringInput | null;
  enabled?: ModelBooleanInput | null;
  status?: ModelStringInput | null;
  owner?: ModelBooleanInput | null;
  usageStartDate?: ModelStringInput | null;
  sortKey?: ModelStringInput | null;
  workType?: ModelStringInput | null;
  developer?: ModelBooleanInput | null;
  approverSetting?: ModelApproverSettingModeInput | null;
  approverSingle?: ModelStringInput | null;
  approverMultiple?: ModelStringInput | null;
  approverMultipleMode?: ModelApproverMultipleModeInput | null;
  shiftGroup?: ModelStringInput | null;
  and?: Array<ModelStaffConditionInput | null> | null;
  or?: Array<ModelStaffConditionInput | null> | null;
  not?: ModelStaffConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelApproverSettingModeInput = {
  eq?: ApproverSettingMode | null;
  ne?: ApproverSettingMode | null;
};

export type ModelApproverMultipleModeInput = {
  eq?: ApproverMultipleMode | null;
  ne?: ApproverMultipleMode | null;
};

export type Staff = {
  __typename: "Staff";
  id: string;
  cognitoUserId: string;
  familyName?: string | null;
  givenName?: string | null;
  mailAddress: string;
  role: string;
  enabled: boolean;
  status: string;
  owner?: boolean | null;
  usageStartDate?: string | null;
  notifications?: Notification | null;
  externalLinks?: Array<StaffExternalLink | null> | null;
  sortKey?: string | null;
  workType?: string | null;
  developer?: boolean | null;
  approverSetting?: ApproverSettingMode | null;
  approverSingle?: string | null;
  approverMultiple?: Array<string | null> | null;
  approverMultipleMode?: ApproverMultipleMode | null;
  shiftGroup?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  __typename: "Notification";
  workStart?: boolean | null;
  workEnd?: boolean | null;
};

export type StaffExternalLink = {
  __typename: "StaffExternalLink";
  label: string;
  url: string;
  enabled: boolean;
  icon: string;
};

export type UpdateStaffInput = {
  id: string;
  cognitoUserId?: string | null;
  familyName?: string | null;
  givenName?: string | null;
  mailAddress?: string | null;
  role?: string | null;
  enabled?: boolean | null;
  status?: string | null;
  owner?: boolean | null;
  usageStartDate?: string | null;
  notifications?: NotificationInput | null;
  externalLinks?: Array<StaffExternalLinkInput | null> | null;
  sortKey?: string | null;
  workType?: string | null;
  developer?: boolean | null;
  approverSetting?: ApproverSettingMode | null;
  approverSingle?: string | null;
  approverMultiple?: Array<string | null> | null;
  approverMultipleMode?: ApproverMultipleMode | null;
  shiftGroup?: string | null;
};

export type DeleteStaffInput = {
  id: string;
};

export type CreateHolidayCalendarInput = {
  id?: string | null;
  holidayDate: string;
  name: string;
};

export type ModelHolidayCalendarConditionInput = {
  holidayDate?: ModelStringInput | null;
  name?: ModelStringInput | null;
  and?: Array<ModelHolidayCalendarConditionInput | null> | null;
  or?: Array<ModelHolidayCalendarConditionInput | null> | null;
  not?: ModelHolidayCalendarConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type HolidayCalendar = {
  __typename: "HolidayCalendar";
  id: string;
  holidayDate: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateHolidayCalendarInput = {
  id: string;
  holidayDate?: string | null;
  name?: string | null;
};

export type DeleteHolidayCalendarInput = {
  id: string;
};

export type CreateCompanyHolidayCalendarInput = {
  id?: string | null;
  holidayDate: string;
  name: string;
};

export type ModelCompanyHolidayCalendarConditionInput = {
  holidayDate?: ModelStringInput | null;
  name?: ModelStringInput | null;
  and?: Array<ModelCompanyHolidayCalendarConditionInput | null> | null;
  or?: Array<ModelCompanyHolidayCalendarConditionInput | null> | null;
  not?: ModelCompanyHolidayCalendarConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type CompanyHolidayCalendar = {
  __typename: "CompanyHolidayCalendar";
  id: string;
  holidayDate: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCompanyHolidayCalendarInput = {
  id: string;
  holidayDate?: string | null;
  name?: string | null;
};

export type DeleteCompanyHolidayCalendarInput = {
  id: string;
};

export type CreateEventCalendarInput = {
  id?: string | null;
  eventDate: string;
  name: string;
  description?: string | null;
};

export type ModelEventCalendarConditionInput = {
  eventDate?: ModelStringInput | null;
  name?: ModelStringInput | null;
  description?: ModelStringInput | null;
  and?: Array<ModelEventCalendarConditionInput | null> | null;
  or?: Array<ModelEventCalendarConditionInput | null> | null;
  not?: ModelEventCalendarConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type EventCalendar = {
  __typename: "EventCalendar";
  id: string;
  eventDate: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateEventCalendarInput = {
  id: string;
  eventDate?: string | null;
  name?: string | null;
  description?: string | null;
};

export type DeleteEventCalendarInput = {
  id: string;
};

export type CreateCloseDateInput = {
  id?: string | null;
  closeDate: string;
  startDate: string;
  endDate: string;
};

export type ModelCloseDateConditionInput = {
  closeDate?: ModelStringInput | null;
  startDate?: ModelStringInput | null;
  endDate?: ModelStringInput | null;
  and?: Array<ModelCloseDateConditionInput | null> | null;
  or?: Array<ModelCloseDateConditionInput | null> | null;
  not?: ModelCloseDateConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type CloseDate = {
  __typename: "CloseDate";
  id: string;
  closeDate: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCloseDateInput = {
  id: string;
  closeDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

export type DeleteCloseDateInput = {
  id: string;
};

export type CreateAttendanceInput = {
  id?: string | null;
  staffId: string;
  workDate: string;
  startTime?: string | null;
  endTime?: string | null;
  goDirectlyFlag?: boolean | null;
  returnDirectlyFlag?: boolean | null;
  absentFlag?: boolean | null;
  rests?: Array<RestInput | null> | null;
  hourlyPaidHolidayTimes?: Array<HourlyPaidHolidayTimeInput | null> | null;
  remarks?: string | null;
  paidHolidayFlag?: boolean | null;
  specialHolidayFlag?: boolean | null;
  isDeemedHoliday?: boolean | null;
  hourlyPaidHolidayHours?: number | null;
  substituteHolidayDate?: string | null;
  histories?: Array<AttendanceHistoryInput | null> | null;
  changeRequests?: Array<AttendanceChangeRequestInput | null> | null;
  systemComments?: Array<SystemCommentInput | null> | null;
  revision?: number | null;
};

export type RestInput = {
  startTime?: string | null;
  endTime?: string | null;
};

export type HourlyPaidHolidayTimeInput = {
  startTime: string;
  endTime: string;
};

export type AttendanceHistoryInput = {
  staffId: string;
  workDate: string;
  startTime?: string | null;
  endTime?: string | null;
  goDirectlyFlag?: boolean | null;
  absentFlag?: boolean | null;
  returnDirectlyFlag?: boolean | null;
  rests?: Array<RestInput | null> | null;
  hourlyPaidHolidayTimes?: Array<HourlyPaidHolidayTimeInput | null> | null;
  remarks?: string | null;
  paidHolidayFlag?: boolean | null;
  specialHolidayFlag?: boolean | null;
  hourlyPaidHolidayHours?: number | null;
  substituteHolidayFlag?: boolean | null;
  substituteHolidayDate?: string | null;
  createdAt: string;
};

export type AttendanceChangeRequestInput = {
  startTime?: string | null;
  endTime?: string | null;
  goDirectlyFlag?: boolean | null;
  absentFlag?: boolean | null;
  returnDirectlyFlag?: boolean | null;
  rests?: Array<RestInput | null> | null;
  hourlyPaidHolidayTimes?: Array<HourlyPaidHolidayTimeInput | null> | null;
  remarks?: string | null;
  paidHolidayFlag?: boolean | null;
  specialHolidayFlag?: boolean | null;
  hourlyPaidHolidayHours?: number | null;
  substituteHolidayFlag?: boolean | null;
  substituteHolidayDate?: string | null;
  completed?: boolean | null;
  comment?: string | null;
  staffComment?: string | null;
};

export type SystemCommentInput = {
  comment: string;
  confirmed: boolean;
  createdAt: string;
};

export type ModelAttendanceConditionInput = {
  staffId?: ModelStringInput | null;
  workDate?: ModelStringInput | null;
  startTime?: ModelStringInput | null;
  endTime?: ModelStringInput | null;
  goDirectlyFlag?: ModelBooleanInput | null;
  returnDirectlyFlag?: ModelBooleanInput | null;
  absentFlag?: ModelBooleanInput | null;
  remarks?: ModelStringInput | null;
  paidHolidayFlag?: ModelBooleanInput | null;
  specialHolidayFlag?: ModelBooleanInput | null;
  isDeemedHoliday?: ModelBooleanInput | null;
  hourlyPaidHolidayHours?: ModelIntInput | null;
  substituteHolidayDate?: ModelStringInput | null;
  revision?: ModelIntInput | null;
  and?: Array<ModelAttendanceConditionInput | null> | null;
  or?: Array<ModelAttendanceConditionInput | null> | null;
  not?: ModelAttendanceConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelIntInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export type Attendance = {
  __typename: "Attendance";
  id: string;
  staffId: string;
  workDate: string;
  startTime?: string | null;
  endTime?: string | null;
  goDirectlyFlag?: boolean | null;
  returnDirectlyFlag?: boolean | null;
  absentFlag?: boolean | null;
  rests?: Array<Rest | null> | null;
  hourlyPaidHolidayTimes?: Array<HourlyPaidHolidayTime | null> | null;
  remarks?: string | null;
  paidHolidayFlag?: boolean | null;
  specialHolidayFlag?: boolean | null;
  isDeemedHoliday?: boolean | null;
  hourlyPaidHolidayHours?: number | null;
  substituteHolidayDate?: string | null;
  histories?: Array<AttendanceHistory | null> | null;
  changeRequests?: Array<AttendanceChangeRequest | null> | null;
  systemComments?: Array<SystemComment | null> | null;
  revision?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Rest = {
  __typename: "Rest";
  startTime?: string | null;
  endTime?: string | null;
};

export type HourlyPaidHolidayTime = {
  __typename: "HourlyPaidHolidayTime";
  startTime: string;
  endTime: string;
};

export type AttendanceHistory = {
  __typename: "AttendanceHistory";
  staffId: string;
  workDate: string;
  startTime?: string | null;
  endTime?: string | null;
  goDirectlyFlag?: boolean | null;
  absentFlag?: boolean | null;
  returnDirectlyFlag?: boolean | null;
  rests?: Array<Rest | null> | null;
  hourlyPaidHolidayTimes?: Array<HourlyPaidHolidayTime | null> | null;
  remarks?: string | null;
  paidHolidayFlag?: boolean | null;
  specialHolidayFlag?: boolean | null;
  hourlyPaidHolidayHours?: number | null;
  substituteHolidayFlag?: boolean | null;
  substituteHolidayDate?: string | null;
  createdAt: string;
};

export type AttendanceChangeRequest = {
  __typename: "AttendanceChangeRequest";
  startTime?: string | null;
  endTime?: string | null;
  goDirectlyFlag?: boolean | null;
  absentFlag?: boolean | null;
  returnDirectlyFlag?: boolean | null;
  rests?: Array<Rest | null> | null;
  hourlyPaidHolidayTimes?: Array<HourlyPaidHolidayTime | null> | null;
  remarks?: string | null;
  paidHolidayFlag?: boolean | null;
  specialHolidayFlag?: boolean | null;
  hourlyPaidHolidayHours?: number | null;
  substituteHolidayFlag?: boolean | null;
  substituteHolidayDate?: string | null;
  completed?: boolean | null;
  comment?: string | null;
  staffComment?: string | null;
};

export type SystemComment = {
  __typename: "SystemComment";
  comment: string;
  confirmed: boolean;
  createdAt: string;
};

export type UpdateAttendanceInput = {
  id: string;
  staffId?: string | null;
  workDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  goDirectlyFlag?: boolean | null;
  returnDirectlyFlag?: boolean | null;
  absentFlag?: boolean | null;
  rests?: Array<RestInput | null> | null;
  hourlyPaidHolidayTimes?: Array<HourlyPaidHolidayTimeInput | null> | null;
  remarks?: string | null;
  paidHolidayFlag?: boolean | null;
  specialHolidayFlag?: boolean | null;
  isDeemedHoliday?: boolean | null;
  hourlyPaidHolidayHours?: number | null;
  substituteHolidayDate?: string | null;
  histories?: Array<AttendanceHistoryInput | null> | null;
  changeRequests?: Array<AttendanceChangeRequestInput | null> | null;
  systemComments?: Array<SystemCommentInput | null> | null;
  revision?: number | null;
};

export type DeleteAttendanceInput = {
  id: string;
};

export type CreateDocumentInput = {
  id?: string | null;
  title: string;
  content: string;
  tag?: Array<string | null> | null;
  targetRole?: Array<string | null> | null;
  revision?: number | null;
};

export type ModelDocumentConditionInput = {
  title?: ModelStringInput | null;
  content?: ModelStringInput | null;
  tag?: ModelStringInput | null;
  targetRole?: ModelStringInput | null;
  revision?: ModelIntInput | null;
  and?: Array<ModelDocumentConditionInput | null> | null;
  or?: Array<ModelDocumentConditionInput | null> | null;
  not?: ModelDocumentConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type Document = {
  __typename: "Document";
  id: string;
  title: string;
  content: string;
  tag?: Array<string | null> | null;
  targetRole?: Array<string | null> | null;
  revision?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateDocumentInput = {
  id: string;
  title?: string | null;
  content?: string | null;
  tag?: Array<string | null> | null;
  targetRole?: Array<string | null> | null;
  revision?: number | null;
};

export type DeleteDocumentInput = {
  id: string;
};

export type CreateShiftRequestInput = {
  id?: string | null;
  staffId: string;
  targetMonth: string;
  note?: string | null;
  entries?: Array<ShiftRequestDayPreferenceInput | null> | null;
  summary?: ShiftRequestSummaryInput | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version?: number | null;
  histories?: Array<ShiftRequestHistoryInput | null> | null;
};

export type ShiftRequestDayPreferenceInput = {
  date: string;
  status: ShiftRequestStatus;
  isLocked?: boolean | null;
};

export enum ShiftRequestStatus {
  WORK = "WORK",
  FIXED_OFF = "FIXED_OFF",
  REQUESTED_OFF = "REQUESTED_OFF",
  AUTO = "AUTO",
}

export type ShiftRequestSummaryInput = {
  workDays?: number | null;
  fixedOffDays?: number | null;
  requestedOffDays?: number | null;
};

export type ShiftRequestHistoryInput = {
  version: number;
  note?: string | null;
  entries?: Array<ShiftRequestDayPreferenceInput | null> | null;
  summary?: ShiftRequestSummaryInput | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  recordedAt: string;
  recordedByStaffId?: string | null;
  changeReason?: string | null;
};

export type ModelShiftRequestConditionInput = {
  staffId?: ModelStringInput | null;
  targetMonth?: ModelStringInput | null;
  note?: ModelStringInput | null;
  submittedAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  updatedBy?: ModelStringInput | null;
  version?: ModelIntInput | null;
  and?: Array<ModelShiftRequestConditionInput | null> | null;
  or?: Array<ModelShiftRequestConditionInput | null> | null;
  not?: ModelShiftRequestConditionInput | null;
  createdAt?: ModelStringInput | null;
};

export type ShiftRequest = {
  __typename: "ShiftRequest";
  id: string;
  staffId: string;
  targetMonth: string;
  note?: string | null;
  entries?: Array<ShiftRequestDayPreference | null> | null;
  summary?: ShiftRequestSummary | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version?: number | null;
  histories?: Array<ShiftRequestHistory | null> | null;
  createdAt: string;
};

export type ShiftRequestDayPreference = {
  __typename: "ShiftRequestDayPreference";
  date: string;
  status: ShiftRequestStatus;
  isLocked?: boolean | null;
};

export type ShiftRequestSummary = {
  __typename: "ShiftRequestSummary";
  workDays?: number | null;
  fixedOffDays?: number | null;
  requestedOffDays?: number | null;
};

export type ShiftRequestHistory = {
  __typename: "ShiftRequestHistory";
  version: number;
  note?: string | null;
  entries?: Array<ShiftRequestDayPreference | null> | null;
  summary?: ShiftRequestSummary | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  recordedAt: string;
  recordedByStaffId?: string | null;
  changeReason?: string | null;
};

export type UpdateShiftRequestInput = {
  id: string;
  staffId?: string | null;
  targetMonth?: string | null;
  note?: string | null;
  entries?: Array<ShiftRequestDayPreferenceInput | null> | null;
  summary?: ShiftRequestSummaryInput | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version?: number | null;
  histories?: Array<ShiftRequestHistoryInput | null> | null;
};

export type DeleteShiftRequestInput = {
  id: string;
};

export type CreateShiftPlanYearInput = {
  id?: string | null;
  targetYear: number;
  plans?: Array<ShiftPlanMonthSettingInput | null> | null;
  notes?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type ShiftPlanMonthSettingInput = {
  month: number;
  editStart?: string | null;
  editEnd?: string | null;
  enabled?: boolean | null;
  dailyCapacities?: Array<number | null> | null;
};

export type ModelShiftPlanYearConditionInput = {
  targetYear?: ModelIntInput | null;
  notes?: ModelStringInput | null;
  createdBy?: ModelStringInput | null;
  updatedBy?: ModelStringInput | null;
  and?: Array<ModelShiftPlanYearConditionInput | null> | null;
  or?: Array<ModelShiftPlanYearConditionInput | null> | null;
  not?: ModelShiftPlanYearConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ShiftPlanYear = {
  __typename: "ShiftPlanYear";
  id: string;
  targetYear: number;
  plans?: Array<ShiftPlanMonthSetting | null> | null;
  notes?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShiftPlanMonthSetting = {
  __typename: "ShiftPlanMonthSetting";
  month: number;
  editStart?: string | null;
  editEnd?: string | null;
  enabled?: boolean | null;
  dailyCapacities?: Array<number | null> | null;
};

export type UpdateShiftPlanYearInput = {
  id: string;
  targetYear?: number | null;
  plans?: Array<ShiftPlanMonthSettingInput | null> | null;
  notes?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type DeleteShiftPlanYearInput = {
  id: string;
};

export type CreateWorkflowInput = {
  id?: string | null;
  approvedStaffIds?: Array<string | null> | null;
  rejectedStaffIds?: Array<string | null> | null;
  finalDecisionTimestamp?: string | null;
  category?: WorkflowCategory | null;
  staffId: string;
  status: WorkflowStatus;
  assignedApproverStaffIds?: Array<string | null> | null;
  approvalSteps?: Array<ApprovalStepInput | null> | null;
  nextApprovalStepIndex?: number | null;
  submitterApproverSetting?: ApproverSettingMode | null;
  submitterApproverId?: string | null;
  submitterApproverIds?: Array<string | null> | null;
  submitterApproverMultipleMode?: ApproverMultipleMode | null;
  overTimeDetails?: OverTimeWorkflowInput | null;
  comments?: Array<WorkflowCommentInput | null> | null;
};

export enum WorkflowCategory {
  PAID_LEAVE = "PAID_LEAVE",
  ABSENCE = "ABSENCE",
  OVERTIME = "OVERTIME",
  CLOCK_CORRECTION = "CLOCK_CORRECTION",
  CUSTOM = "CUSTOM",
}

export enum WorkflowStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export type ApprovalStepInput = {
  id: string;
  approverStaffId: string;
  decisionStatus: ApprovalStatus;
  approverComment?: string | null;
  decisionTimestamp?: string | null;
  stepOrder?: number | null;
};

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SKIPPED = "SKIPPED",
}

export type OverTimeWorkflowInput = {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export type WorkflowCommentInput = {
  id: string;
  staffId: string;
  text: string;
  createdAt: string;
};

export type ModelWorkflowConditionInput = {
  approvedStaffIds?: ModelStringInput | null;
  rejectedStaffIds?: ModelStringInput | null;
  finalDecisionTimestamp?: ModelStringInput | null;
  category?: ModelWorkflowCategoryInput | null;
  staffId?: ModelStringInput | null;
  status?: ModelWorkflowStatusInput | null;
  assignedApproverStaffIds?: ModelStringInput | null;
  nextApprovalStepIndex?: ModelIntInput | null;
  submitterApproverSetting?: ModelApproverSettingModeInput | null;
  submitterApproverId?: ModelStringInput | null;
  submitterApproverIds?: ModelStringInput | null;
  submitterApproverMultipleMode?: ModelApproverMultipleModeInput | null;
  and?: Array<ModelWorkflowConditionInput | null> | null;
  or?: Array<ModelWorkflowConditionInput | null> | null;
  not?: ModelWorkflowConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelWorkflowCategoryInput = {
  eq?: WorkflowCategory | null;
  ne?: WorkflowCategory | null;
};

export type ModelWorkflowStatusInput = {
  eq?: WorkflowStatus | null;
  ne?: WorkflowStatus | null;
};

export type Workflow = {
  __typename: "Workflow";
  id: string;
  approvedStaffIds?: Array<string | null> | null;
  rejectedStaffIds?: Array<string | null> | null;
  finalDecisionTimestamp?: string | null;
  category?: WorkflowCategory | null;
  staffId: string;
  status: WorkflowStatus;
  assignedApproverStaffIds?: Array<string | null> | null;
  approvalSteps?: Array<ApprovalStep | null> | null;
  nextApprovalStepIndex?: number | null;
  submitterApproverSetting?: ApproverSettingMode | null;
  submitterApproverId?: string | null;
  submitterApproverIds?: Array<string | null> | null;
  submitterApproverMultipleMode?: ApproverMultipleMode | null;
  overTimeDetails?: OverTimeWorkflow | null;
  comments?: Array<WorkflowComment | null> | null;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalStep = {
  __typename: "ApprovalStep";
  id: string;
  approverStaffId: string;
  decisionStatus: ApprovalStatus;
  approverComment?: string | null;
  decisionTimestamp?: string | null;
  stepOrder?: number | null;
};

export type OverTimeWorkflow = {
  __typename: "OverTimeWorkflow";
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export type WorkflowComment = {
  __typename: "WorkflowComment";
  id: string;
  staffId: string;
  text: string;
  createdAt: string;
};

export type UpdateWorkflowInput = {
  id: string;
  approvedStaffIds?: Array<string | null> | null;
  rejectedStaffIds?: Array<string | null> | null;
  finalDecisionTimestamp?: string | null;
  category?: WorkflowCategory | null;
  staffId?: string | null;
  status?: WorkflowStatus | null;
  assignedApproverStaffIds?: Array<string | null> | null;
  approvalSteps?: Array<ApprovalStepInput | null> | null;
  nextApprovalStepIndex?: number | null;
  submitterApproverSetting?: ApproverSettingMode | null;
  submitterApproverId?: string | null;
  submitterApproverIds?: Array<string | null> | null;
  submitterApproverMultipleMode?: ApproverMultipleMode | null;
  overTimeDetails?: OverTimeWorkflowInput | null;
  comments?: Array<WorkflowCommentInput | null> | null;
};

export type DeleteWorkflowInput = {
  id: string;
};

export type CreateOperationLogInput = {
  id?: string | null;
  staffId?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  timestamp: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: string | null;
  severity?: string | null;
};

export type ModelOperationLogConditionInput = {
  staffId?: ModelStringInput | null;
  action?: ModelStringInput | null;
  resource?: ModelStringInput | null;
  resourceId?: ModelStringInput | null;
  timestamp?: ModelStringInput | null;
  details?: ModelStringInput | null;
  ipAddress?: ModelStringInput | null;
  userAgent?: ModelStringInput | null;
  metadata?: ModelStringInput | null;
  severity?: ModelStringInput | null;
  and?: Array<ModelOperationLogConditionInput | null> | null;
  or?: Array<ModelOperationLogConditionInput | null> | null;
  not?: ModelOperationLogConditionInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
};

export type OperationLog = {
  __typename: "OperationLog";
  id: string;
  staffId?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  timestamp: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: string | null;
  severity?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateOperationLogInput = {
  id: string;
  staffId?: string | null;
  action?: string | null;
  resource?: string | null;
  resourceId?: string | null;
  timestamp?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: string | null;
  severity?: string | null;
};

export type DeleteOperationLogInput = {
  id: string;
};

export type CreateAuditLogInput = {
  id?: string | null;
  resourceType: string;
  resourceId: string;
  action: string;
  actorId: string;
  actorRole?: string | null;
  requestId: string;
  ip?: string | null;
  userAgent?: string | null;
  before?: string | null;
  after?: string | null;
  diff?: string | null;
  createdAt?: string | null;
  ttl?: number | null;
  reason?: string | null;
};

export type ModelAuditLogConditionInput = {
  resourceType?: ModelStringInput | null;
  resourceId?: ModelStringInput | null;
  action?: ModelStringInput | null;
  actorId?: ModelIDInput | null;
  actorRole?: ModelStringInput | null;
  requestId?: ModelStringInput | null;
  ip?: ModelStringInput | null;
  userAgent?: ModelStringInput | null;
  before?: ModelStringInput | null;
  after?: ModelStringInput | null;
  diff?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  ttl?: ModelIntInput | null;
  reason?: ModelStringInput | null;
  and?: Array<ModelAuditLogConditionInput | null> | null;
  or?: Array<ModelAuditLogConditionInput | null> | null;
  not?: ModelAuditLogConditionInput | null;
  updatedAt?: ModelStringInput | null;
};

export type ModelIDInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export type AuditLog = {
  __typename: "AuditLog";
  id: string;
  resourceType: string;
  resourceId: string;
  action: string;
  actorId: string;
  actorRole?: string | null;
  requestId: string;
  ip?: string | null;
  userAgent?: string | null;
  before?: string | null;
  after?: string | null;
  diff?: string | null;
  createdAt: string;
  ttl?: number | null;
  reason?: string | null;
  updatedAt: string;
};

export type UpdateAuditLogInput = {
  id: string;
  resourceType?: string | null;
  resourceId?: string | null;
  action?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  before?: string | null;
  after?: string | null;
  diff?: string | null;
  createdAt?: string | null;
  ttl?: number | null;
  reason?: string | null;
};

export type DeleteAuditLogInput = {
  id: string;
};

export type CreateDailyReportInput = {
  id?: string | null;
  staffId: string;
  reportDate: string;
  title: string;
  content?: string | null;
  status: DailyReportStatus;
  updatedAt?: string | null;
  reactions?: Array<DailyReportReactionInput | null> | null;
  comments?: Array<DailyReportCommentInput | null> | null;
};

export enum DailyReportStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
}

export type DailyReportReactionInput = {
  staffId: string;
  type: DailyReportReactionType;
  createdAt: string;
};

export enum DailyReportReactionType {
  CHEER = "CHEER",
  CHECK = "CHECK",
  THANKS = "THANKS",
  LOOK = "LOOK",
}

export type DailyReportCommentInput = {
  id: string;
  staffId: string;
  authorName?: string | null;
  body: string;
  createdAt: string;
};

export type ModelDailyReportConditionInput = {
  staffId?: ModelStringInput | null;
  reportDate?: ModelStringInput | null;
  title?: ModelStringInput | null;
  content?: ModelStringInput | null;
  status?: ModelDailyReportStatusInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelDailyReportConditionInput | null> | null;
  or?: Array<ModelDailyReportConditionInput | null> | null;
  not?: ModelDailyReportConditionInput | null;
  createdAt?: ModelStringInput | null;
};

export type ModelDailyReportStatusInput = {
  eq?: DailyReportStatus | null;
  ne?: DailyReportStatus | null;
};

export type DailyReport = {
  __typename: "DailyReport";
  id: string;
  staffId: string;
  reportDate: string;
  title: string;
  content?: string | null;
  status: DailyReportStatus;
  updatedAt?: string | null;
  reactions?: Array<DailyReportReaction | null> | null;
  comments?: Array<DailyReportComment | null> | null;
  createdAt: string;
};

export type DailyReportReaction = {
  __typename: "DailyReportReaction";
  staffId: string;
  type: DailyReportReactionType;
  createdAt: string;
};

export type DailyReportComment = {
  __typename: "DailyReportComment";
  id: string;
  staffId: string;
  authorName?: string | null;
  body: string;
  createdAt: string;
};

export type UpdateDailyReportInput = {
  id: string;
  staffId?: string | null;
  reportDate?: string | null;
  title?: string | null;
  content?: string | null;
  status?: DailyReportStatus | null;
  updatedAt?: string | null;
  reactions?: Array<DailyReportReactionInput | null> | null;
  comments?: Array<DailyReportCommentInput | null> | null;
};

export type DeleteDailyReportInput = {
  id: string;
};

export type EmailData = {
  to?: Array<string | null> | null;
  subject: string;
  body: string;
};

export type EmailResult = {
  __typename: "EmailResult";
  statusCode?: number | null;
  body?: string | null;
};

export type ModelCheckForUpdateFilterInput = {
  id?: ModelIDInput | null;
  deployUuid?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelCheckForUpdateFilterInput | null> | null;
  or?: Array<ModelCheckForUpdateFilterInput | null> | null;
  not?: ModelCheckForUpdateFilterInput | null;
};

export type ModelCheckForUpdateConnection = {
  __typename: "ModelCheckForUpdateConnection";
  items: Array<CheckForUpdate | null>;
  nextToken?: string | null;
};

export type ModelAppConfigFilterInput = {
  id?: ModelIDInput | null;
  name?: ModelStringInput | null;
  workStartTime?: ModelStringInput | null;
  workEndTime?: ModelStringInput | null;
  lunchRestStartTime?: ModelStringInput | null;
  lunchRestEndTime?: ModelStringInput | null;
  standardWorkHours?: ModelFloatInput | null;
  amHolidayStartTime?: ModelStringInput | null;
  amHolidayEndTime?: ModelStringInput | null;
  pmHolidayStartTime?: ModelStringInput | null;
  pmHolidayEndTime?: ModelStringInput | null;
  specialHolidayEnabled?: ModelBooleanInput | null;
  amPmHolidayEnabled?: ModelBooleanInput | null;
  officeMode?: ModelBooleanInput | null;
  attendanceStatisticsEnabled?: ModelBooleanInput | null;
  absentEnabled?: ModelBooleanInput | null;
  hourlyPaidHolidayEnabled?: ModelBooleanInput | null;
  themeColor?: ModelStringInput | null;
  overTimeCheckEnabled?: ModelBooleanInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelAppConfigFilterInput | null> | null;
  or?: Array<ModelAppConfigFilterInput | null> | null;
  not?: ModelAppConfigFilterInput | null;
};

export type ModelAppConfigConnection = {
  __typename: "ModelAppConfigConnection";
  items: Array<AppConfig | null>;
  nextToken?: string | null;
};

export type ModelStaffFilterInput = {
  id?: ModelIDInput | null;
  cognitoUserId?: ModelStringInput | null;
  familyName?: ModelStringInput | null;
  givenName?: ModelStringInput | null;
  mailAddress?: ModelStringInput | null;
  role?: ModelStringInput | null;
  enabled?: ModelBooleanInput | null;
  status?: ModelStringInput | null;
  owner?: ModelBooleanInput | null;
  usageStartDate?: ModelStringInput | null;
  sortKey?: ModelStringInput | null;
  workType?: ModelStringInput | null;
  developer?: ModelBooleanInput | null;
  approverSetting?: ModelApproverSettingModeInput | null;
  approverSingle?: ModelStringInput | null;
  approverMultiple?: ModelStringInput | null;
  approverMultipleMode?: ModelApproverMultipleModeInput | null;
  shiftGroup?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelStaffFilterInput | null> | null;
  or?: Array<ModelStaffFilterInput | null> | null;
  not?: ModelStaffFilterInput | null;
};

export type ModelStaffConnection = {
  __typename: "ModelStaffConnection";
  items: Array<Staff | null>;
  nextToken?: string | null;
};

export type ModelIDKeyConditionInput = {
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}

export type ModelHolidayCalendarFilterInput = {
  id?: ModelIDInput | null;
  holidayDate?: ModelStringInput | null;
  name?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelHolidayCalendarFilterInput | null> | null;
  or?: Array<ModelHolidayCalendarFilterInput | null> | null;
  not?: ModelHolidayCalendarFilterInput | null;
};

export type ModelHolidayCalendarConnection = {
  __typename: "ModelHolidayCalendarConnection";
  items: Array<HolidayCalendar | null>;
  nextToken?: string | null;
};

export type ModelCompanyHolidayCalendarFilterInput = {
  id?: ModelIDInput | null;
  holidayDate?: ModelStringInput | null;
  name?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelCompanyHolidayCalendarFilterInput | null> | null;
  or?: Array<ModelCompanyHolidayCalendarFilterInput | null> | null;
  not?: ModelCompanyHolidayCalendarFilterInput | null;
};

export type ModelCompanyHolidayCalendarConnection = {
  __typename: "ModelCompanyHolidayCalendarConnection";
  items: Array<CompanyHolidayCalendar | null>;
  nextToken?: string | null;
};

export type ModelEventCalendarFilterInput = {
  id?: ModelIDInput | null;
  eventDate?: ModelStringInput | null;
  name?: ModelStringInput | null;
  description?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelEventCalendarFilterInput | null> | null;
  or?: Array<ModelEventCalendarFilterInput | null> | null;
  not?: ModelEventCalendarFilterInput | null;
};

export type ModelEventCalendarConnection = {
  __typename: "ModelEventCalendarConnection";
  items: Array<EventCalendar | null>;
  nextToken?: string | null;
};

export type ModelCloseDateFilterInput = {
  id?: ModelIDInput | null;
  closeDate?: ModelStringInput | null;
  startDate?: ModelStringInput | null;
  endDate?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelCloseDateFilterInput | null> | null;
  or?: Array<ModelCloseDateFilterInput | null> | null;
  not?: ModelCloseDateFilterInput | null;
};

export type ModelCloseDateConnection = {
  __typename: "ModelCloseDateConnection";
  items: Array<CloseDate | null>;
  nextToken?: string | null;
};

export type ModelAttendanceFilterInput = {
  id?: ModelIDInput | null;
  staffId?: ModelStringInput | null;
  workDate?: ModelStringInput | null;
  startTime?: ModelStringInput | null;
  endTime?: ModelStringInput | null;
  goDirectlyFlag?: ModelBooleanInput | null;
  returnDirectlyFlag?: ModelBooleanInput | null;
  absentFlag?: ModelBooleanInput | null;
  remarks?: ModelStringInput | null;
  paidHolidayFlag?: ModelBooleanInput | null;
  specialHolidayFlag?: ModelBooleanInput | null;
  isDeemedHoliday?: ModelBooleanInput | null;
  hourlyPaidHolidayHours?: ModelIntInput | null;
  substituteHolidayDate?: ModelStringInput | null;
  revision?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelAttendanceFilterInput | null> | null;
  or?: Array<ModelAttendanceFilterInput | null> | null;
  not?: ModelAttendanceFilterInput | null;
};

export type ModelAttendanceConnection = {
  __typename: "ModelAttendanceConnection";
  items: Array<Attendance | null>;
  nextToken?: string | null;
};

export type ModelStringKeyConditionInput = {
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
};

export type ModelDocumentFilterInput = {
  id?: ModelIDInput | null;
  title?: ModelStringInput | null;
  content?: ModelStringInput | null;
  tag?: ModelStringInput | null;
  targetRole?: ModelStringInput | null;
  revision?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelDocumentFilterInput | null> | null;
  or?: Array<ModelDocumentFilterInput | null> | null;
  not?: ModelDocumentFilterInput | null;
};

export type ModelDocumentConnection = {
  __typename: "ModelDocumentConnection";
  items: Array<Document | null>;
  nextToken?: string | null;
};

export type ModelShiftRequestFilterInput = {
  id?: ModelIDInput | null;
  staffId?: ModelStringInput | null;
  targetMonth?: ModelStringInput | null;
  note?: ModelStringInput | null;
  submittedAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  updatedBy?: ModelStringInput | null;
  version?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  and?: Array<ModelShiftRequestFilterInput | null> | null;
  or?: Array<ModelShiftRequestFilterInput | null> | null;
  not?: ModelShiftRequestFilterInput | null;
};

export type ModelShiftRequestConnection = {
  __typename: "ModelShiftRequestConnection";
  items: Array<ShiftRequest | null>;
  nextToken?: string | null;
};

export type ModelShiftPlanYearFilterInput = {
  id?: ModelIDInput | null;
  targetYear?: ModelIntInput | null;
  notes?: ModelStringInput | null;
  createdBy?: ModelStringInput | null;
  updatedBy?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelShiftPlanYearFilterInput | null> | null;
  or?: Array<ModelShiftPlanYearFilterInput | null> | null;
  not?: ModelShiftPlanYearFilterInput | null;
};

export type ModelShiftPlanYearConnection = {
  __typename: "ModelShiftPlanYearConnection";
  items: Array<ShiftPlanYear | null>;
  nextToken?: string | null;
};

export type ModelWorkflowFilterInput = {
  id?: ModelIDInput | null;
  approvedStaffIds?: ModelStringInput | null;
  rejectedStaffIds?: ModelStringInput | null;
  finalDecisionTimestamp?: ModelStringInput | null;
  category?: ModelWorkflowCategoryInput | null;
  staffId?: ModelStringInput | null;
  status?: ModelWorkflowStatusInput | null;
  assignedApproverStaffIds?: ModelStringInput | null;
  nextApprovalStepIndex?: ModelIntInput | null;
  submitterApproverSetting?: ModelApproverSettingModeInput | null;
  submitterApproverId?: ModelStringInput | null;
  submitterApproverIds?: ModelStringInput | null;
  submitterApproverMultipleMode?: ModelApproverMultipleModeInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelWorkflowFilterInput | null> | null;
  or?: Array<ModelWorkflowFilterInput | null> | null;
  not?: ModelWorkflowFilterInput | null;
};

export type ModelWorkflowConnection = {
  __typename: "ModelWorkflowConnection";
  items: Array<Workflow | null>;
  nextToken?: string | null;
};

export type ModelOperationLogFilterInput = {
  id?: ModelIDInput | null;
  staffId?: ModelStringInput | null;
  action?: ModelStringInput | null;
  resource?: ModelStringInput | null;
  resourceId?: ModelStringInput | null;
  timestamp?: ModelStringInput | null;
  details?: ModelStringInput | null;
  ipAddress?: ModelStringInput | null;
  userAgent?: ModelStringInput | null;
  metadata?: ModelStringInput | null;
  severity?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelOperationLogFilterInput | null> | null;
  or?: Array<ModelOperationLogFilterInput | null> | null;
  not?: ModelOperationLogFilterInput | null;
};

export type ModelOperationLogConnection = {
  __typename: "ModelOperationLogConnection";
  items: Array<OperationLog | null>;
  nextToken?: string | null;
};

export type ModelAuditLogFilterInput = {
  id?: ModelIDInput | null;
  resourceType?: ModelStringInput | null;
  resourceId?: ModelStringInput | null;
  action?: ModelStringInput | null;
  actorId?: ModelIDInput | null;
  actorRole?: ModelStringInput | null;
  requestId?: ModelStringInput | null;
  ip?: ModelStringInput | null;
  userAgent?: ModelStringInput | null;
  before?: ModelStringInput | null;
  after?: ModelStringInput | null;
  diff?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  ttl?: ModelIntInput | null;
  reason?: ModelStringInput | null;
  updatedAt?: ModelStringInput | null;
  and?: Array<ModelAuditLogFilterInput | null> | null;
  or?: Array<ModelAuditLogFilterInput | null> | null;
  not?: ModelAuditLogFilterInput | null;
};

export type ModelAuditLogConnection = {
  __typename: "ModelAuditLogConnection";
  items: Array<AuditLog | null>;
  nextToken?: string | null;
};

export type ModelDailyReportFilterInput = {
  id?: ModelIDInput | null;
  staffId?: ModelStringInput | null;
  reportDate?: ModelStringInput | null;
  title?: ModelStringInput | null;
  content?: ModelStringInput | null;
  status?: ModelDailyReportStatusInput | null;
  updatedAt?: ModelStringInput | null;
  createdAt?: ModelStringInput | null;
  and?: Array<ModelDailyReportFilterInput | null> | null;
  or?: Array<ModelDailyReportFilterInput | null> | null;
  not?: ModelDailyReportFilterInput | null;
};

export type ModelDailyReportConnection = {
  __typename: "ModelDailyReportConnection";
  items: Array<DailyReport | null>;
  nextToken?: string | null;
};

export type ModelSubscriptionCheckForUpdateFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  deployUuid?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionCheckForUpdateFilterInput | null> | null;
  or?: Array<ModelSubscriptionCheckForUpdateFilterInput | null> | null;
};

export type ModelSubscriptionIDInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  in?: Array<string | null> | null;
  notIn?: Array<string | null> | null;
};

export type ModelSubscriptionStringInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  in?: Array<string | null> | null;
  notIn?: Array<string | null> | null;
};

export type ModelSubscriptionAppConfigFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  name?: ModelSubscriptionStringInput | null;
  workStartTime?: ModelSubscriptionStringInput | null;
  workEndTime?: ModelSubscriptionStringInput | null;
  lunchRestStartTime?: ModelSubscriptionStringInput | null;
  lunchRestEndTime?: ModelSubscriptionStringInput | null;
  standardWorkHours?: ModelSubscriptionFloatInput | null;
  amHolidayStartTime?: ModelSubscriptionStringInput | null;
  amHolidayEndTime?: ModelSubscriptionStringInput | null;
  pmHolidayStartTime?: ModelSubscriptionStringInput | null;
  pmHolidayEndTime?: ModelSubscriptionStringInput | null;
  specialHolidayEnabled?: ModelSubscriptionBooleanInput | null;
  amPmHolidayEnabled?: ModelSubscriptionBooleanInput | null;
  officeMode?: ModelSubscriptionBooleanInput | null;
  attendanceStatisticsEnabled?: ModelSubscriptionBooleanInput | null;
  absentEnabled?: ModelSubscriptionBooleanInput | null;
  hourlyPaidHolidayEnabled?: ModelSubscriptionBooleanInput | null;
  themeColor?: ModelSubscriptionStringInput | null;
  overTimeCheckEnabled?: ModelSubscriptionBooleanInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionAppConfigFilterInput | null> | null;
  or?: Array<ModelSubscriptionAppConfigFilterInput | null> | null;
};

export type ModelSubscriptionFloatInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  in?: Array<number | null> | null;
  notIn?: Array<number | null> | null;
};

export type ModelSubscriptionBooleanInput = {
  ne?: boolean | null;
  eq?: boolean | null;
};

export type ModelSubscriptionStaffFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  cognitoUserId?: ModelSubscriptionStringInput | null;
  familyName?: ModelSubscriptionStringInput | null;
  givenName?: ModelSubscriptionStringInput | null;
  mailAddress?: ModelSubscriptionStringInput | null;
  role?: ModelSubscriptionStringInput | null;
  enabled?: ModelSubscriptionBooleanInput | null;
  status?: ModelSubscriptionStringInput | null;
  owner?: ModelSubscriptionBooleanInput | null;
  usageStartDate?: ModelSubscriptionStringInput | null;
  sortKey?: ModelSubscriptionStringInput | null;
  workType?: ModelSubscriptionStringInput | null;
  developer?: ModelSubscriptionBooleanInput | null;
  approverSetting?: ModelSubscriptionStringInput | null;
  approverSingle?: ModelSubscriptionStringInput | null;
  approverMultiple?: ModelSubscriptionStringInput | null;
  approverMultipleMode?: ModelSubscriptionStringInput | null;
  shiftGroup?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionStaffFilterInput | null> | null;
  or?: Array<ModelSubscriptionStaffFilterInput | null> | null;
};

export type ModelSubscriptionHolidayCalendarFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  holidayDate?: ModelSubscriptionStringInput | null;
  name?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionHolidayCalendarFilterInput | null> | null;
  or?: Array<ModelSubscriptionHolidayCalendarFilterInput | null> | null;
};

export type ModelSubscriptionCompanyHolidayCalendarFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  holidayDate?: ModelSubscriptionStringInput | null;
  name?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionCompanyHolidayCalendarFilterInput | null> | null;
  or?: Array<ModelSubscriptionCompanyHolidayCalendarFilterInput | null> | null;
};

export type ModelSubscriptionEventCalendarFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  eventDate?: ModelSubscriptionStringInput | null;
  name?: ModelSubscriptionStringInput | null;
  description?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionEventCalendarFilterInput | null> | null;
  or?: Array<ModelSubscriptionEventCalendarFilterInput | null> | null;
};

export type ModelSubscriptionCloseDateFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  closeDate?: ModelSubscriptionStringInput | null;
  startDate?: ModelSubscriptionStringInput | null;
  endDate?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionCloseDateFilterInput | null> | null;
  or?: Array<ModelSubscriptionCloseDateFilterInput | null> | null;
};

export type ModelSubscriptionAttendanceFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  staffId?: ModelSubscriptionStringInput | null;
  workDate?: ModelSubscriptionStringInput | null;
  startTime?: ModelSubscriptionStringInput | null;
  endTime?: ModelSubscriptionStringInput | null;
  goDirectlyFlag?: ModelSubscriptionBooleanInput | null;
  returnDirectlyFlag?: ModelSubscriptionBooleanInput | null;
  absentFlag?: ModelSubscriptionBooleanInput | null;
  remarks?: ModelSubscriptionStringInput | null;
  paidHolidayFlag?: ModelSubscriptionBooleanInput | null;
  specialHolidayFlag?: ModelSubscriptionBooleanInput | null;
  isDeemedHoliday?: ModelSubscriptionBooleanInput | null;
  hourlyPaidHolidayHours?: ModelSubscriptionIntInput | null;
  substituteHolidayDate?: ModelSubscriptionStringInput | null;
  revision?: ModelSubscriptionIntInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionAttendanceFilterInput | null> | null;
  or?: Array<ModelSubscriptionAttendanceFilterInput | null> | null;
};

export type ModelSubscriptionIntInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  in?: Array<number | null> | null;
  notIn?: Array<number | null> | null;
};

export type ModelSubscriptionDocumentFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  title?: ModelSubscriptionStringInput | null;
  content?: ModelSubscriptionStringInput | null;
  tag?: ModelSubscriptionStringInput | null;
  targetRole?: ModelSubscriptionStringInput | null;
  revision?: ModelSubscriptionIntInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionDocumentFilterInput | null> | null;
  or?: Array<ModelSubscriptionDocumentFilterInput | null> | null;
};

export type ModelSubscriptionShiftRequestFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  staffId?: ModelSubscriptionStringInput | null;
  targetMonth?: ModelSubscriptionStringInput | null;
  note?: ModelSubscriptionStringInput | null;
  submittedAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  updatedBy?: ModelSubscriptionStringInput | null;
  version?: ModelSubscriptionIntInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionShiftRequestFilterInput | null> | null;
  or?: Array<ModelSubscriptionShiftRequestFilterInput | null> | null;
};

export type ModelSubscriptionShiftPlanYearFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  targetYear?: ModelSubscriptionIntInput | null;
  notes?: ModelSubscriptionStringInput | null;
  createdBy?: ModelSubscriptionStringInput | null;
  updatedBy?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionShiftPlanYearFilterInput | null> | null;
  or?: Array<ModelSubscriptionShiftPlanYearFilterInput | null> | null;
};

export type ModelSubscriptionWorkflowFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  approvedStaffIds?: ModelSubscriptionStringInput | null;
  rejectedStaffIds?: ModelSubscriptionStringInput | null;
  finalDecisionTimestamp?: ModelSubscriptionStringInput | null;
  category?: ModelSubscriptionStringInput | null;
  staffId?: ModelSubscriptionStringInput | null;
  status?: ModelSubscriptionStringInput | null;
  assignedApproverStaffIds?: ModelSubscriptionStringInput | null;
  nextApprovalStepIndex?: ModelSubscriptionIntInput | null;
  submitterApproverSetting?: ModelSubscriptionStringInput | null;
  submitterApproverId?: ModelSubscriptionStringInput | null;
  submitterApproverIds?: ModelSubscriptionStringInput | null;
  submitterApproverMultipleMode?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionWorkflowFilterInput | null> | null;
  or?: Array<ModelSubscriptionWorkflowFilterInput | null> | null;
};

export type ModelSubscriptionOperationLogFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  staffId?: ModelSubscriptionStringInput | null;
  action?: ModelSubscriptionStringInput | null;
  resource?: ModelSubscriptionStringInput | null;
  resourceId?: ModelSubscriptionStringInput | null;
  timestamp?: ModelSubscriptionStringInput | null;
  details?: ModelSubscriptionStringInput | null;
  ipAddress?: ModelSubscriptionStringInput | null;
  userAgent?: ModelSubscriptionStringInput | null;
  metadata?: ModelSubscriptionStringInput | null;
  severity?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionOperationLogFilterInput | null> | null;
  or?: Array<ModelSubscriptionOperationLogFilterInput | null> | null;
};

export type ModelSubscriptionAuditLogFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  resourceType?: ModelSubscriptionStringInput | null;
  resourceId?: ModelSubscriptionStringInput | null;
  action?: ModelSubscriptionStringInput | null;
  actorId?: ModelSubscriptionIDInput | null;
  actorRole?: ModelSubscriptionStringInput | null;
  requestId?: ModelSubscriptionStringInput | null;
  ip?: ModelSubscriptionStringInput | null;
  userAgent?: ModelSubscriptionStringInput | null;
  before?: ModelSubscriptionStringInput | null;
  after?: ModelSubscriptionStringInput | null;
  diff?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  ttl?: ModelSubscriptionIntInput | null;
  reason?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionAuditLogFilterInput | null> | null;
  or?: Array<ModelSubscriptionAuditLogFilterInput | null> | null;
};

export type ModelSubscriptionDailyReportFilterInput = {
  id?: ModelSubscriptionIDInput | null;
  staffId?: ModelSubscriptionStringInput | null;
  reportDate?: ModelSubscriptionStringInput | null;
  title?: ModelSubscriptionStringInput | null;
  content?: ModelSubscriptionStringInput | null;
  status?: ModelSubscriptionStringInput | null;
  updatedAt?: ModelSubscriptionStringInput | null;
  createdAt?: ModelSubscriptionStringInput | null;
  and?: Array<ModelSubscriptionDailyReportFilterInput | null> | null;
  or?: Array<ModelSubscriptionDailyReportFilterInput | null> | null;
};

export type CreateCheckForUpdateMutationVariables = {
  input: CreateCheckForUpdateInput;
  condition?: ModelCheckForUpdateConditionInput | null;
};

export type CreateCheckForUpdateMutation = {
  createCheckForUpdate?: {
    __typename: "CheckForUpdate";
    id: string;
    deployUuid: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateCheckForUpdateMutationVariables = {
  input: UpdateCheckForUpdateInput;
  condition?: ModelCheckForUpdateConditionInput | null;
};

export type UpdateCheckForUpdateMutation = {
  updateCheckForUpdate?: {
    __typename: "CheckForUpdate";
    id: string;
    deployUuid: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteCheckForUpdateMutationVariables = {
  input: DeleteCheckForUpdateInput;
  condition?: ModelCheckForUpdateConditionInput | null;
};

export type DeleteCheckForUpdateMutation = {
  deleteCheckForUpdate?: {
    __typename: "CheckForUpdate";
    id: string;
    deployUuid: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateAppConfigMutationVariables = {
  input: CreateAppConfigInput;
  condition?: ModelAppConfigConditionInput | null;
};

export type CreateAppConfigMutation = {
  createAppConfig?: {
    __typename: "AppConfig";
    id: string;
    name: string;
    workStartTime?: string | null;
    workEndTime?: string | null;
    lunchRestStartTime?: string | null;
    lunchRestEndTime?: string | null;
    standardWorkHours?: number | null;
    amHolidayStartTime?: string | null;
    amHolidayEndTime?: string | null;
    pmHolidayStartTime?: string | null;
    pmHolidayEndTime?: string | null;
    specialHolidayEnabled?: boolean | null;
    amPmHolidayEnabled?: boolean | null;
    officeMode?: boolean | null;
    attendanceStatisticsEnabled?: boolean | null;
    absentEnabled?: boolean | null;
    hourlyPaidHolidayEnabled?: boolean | null;
    links?: Array<{
      __typename: "Link";
      label: string;
      url: string;
      enabled: boolean;
      icon?: string | null;
    } | null> | null;
    reasons?: Array<{
      __typename: "Reason";
      reason: string;
      enabled: boolean;
    } | null> | null;
    quickInputStartTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    quickInputEndTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    themeColor?: string | null;
    shiftGroups?: Array<{
      __typename: "ShiftGroup";
      label: string;
      description?: string | null;
      min?: number | null;
      max?: number | null;
      fixed?: number | null;
    } | null> | null;
    overTimeCheckEnabled?: boolean | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateAppConfigMutationVariables = {
  input: UpdateAppConfigInput;
  condition?: ModelAppConfigConditionInput | null;
};

export type UpdateAppConfigMutation = {
  updateAppConfig?: {
    __typename: "AppConfig";
    id: string;
    name: string;
    workStartTime?: string | null;
    workEndTime?: string | null;
    lunchRestStartTime?: string | null;
    lunchRestEndTime?: string | null;
    standardWorkHours?: number | null;
    amHolidayStartTime?: string | null;
    amHolidayEndTime?: string | null;
    pmHolidayStartTime?: string | null;
    pmHolidayEndTime?: string | null;
    specialHolidayEnabled?: boolean | null;
    amPmHolidayEnabled?: boolean | null;
    officeMode?: boolean | null;
    attendanceStatisticsEnabled?: boolean | null;
    absentEnabled?: boolean | null;
    hourlyPaidHolidayEnabled?: boolean | null;
    links?: Array<{
      __typename: "Link";
      label: string;
      url: string;
      enabled: boolean;
      icon?: string | null;
    } | null> | null;
    reasons?: Array<{
      __typename: "Reason";
      reason: string;
      enabled: boolean;
    } | null> | null;
    quickInputStartTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    quickInputEndTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    themeColor?: string | null;
    shiftGroups?: Array<{
      __typename: "ShiftGroup";
      label: string;
      description?: string | null;
      min?: number | null;
      max?: number | null;
      fixed?: number | null;
    } | null> | null;
    overTimeCheckEnabled?: boolean | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteAppConfigMutationVariables = {
  input: DeleteAppConfigInput;
  condition?: ModelAppConfigConditionInput | null;
};

export type DeleteAppConfigMutation = {
  deleteAppConfig?: {
    __typename: "AppConfig";
    id: string;
    name: string;
    workStartTime?: string | null;
    workEndTime?: string | null;
    lunchRestStartTime?: string | null;
    lunchRestEndTime?: string | null;
    standardWorkHours?: number | null;
    amHolidayStartTime?: string | null;
    amHolidayEndTime?: string | null;
    pmHolidayStartTime?: string | null;
    pmHolidayEndTime?: string | null;
    specialHolidayEnabled?: boolean | null;
    amPmHolidayEnabled?: boolean | null;
    officeMode?: boolean | null;
    attendanceStatisticsEnabled?: boolean | null;
    absentEnabled?: boolean | null;
    hourlyPaidHolidayEnabled?: boolean | null;
    links?: Array<{
      __typename: "Link";
      label: string;
      url: string;
      enabled: boolean;
      icon?: string | null;
    } | null> | null;
    reasons?: Array<{
      __typename: "Reason";
      reason: string;
      enabled: boolean;
    } | null> | null;
    quickInputStartTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    quickInputEndTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    themeColor?: string | null;
    shiftGroups?: Array<{
      __typename: "ShiftGroup";
      label: string;
      description?: string | null;
      min?: number | null;
      max?: number | null;
      fixed?: number | null;
    } | null> | null;
    overTimeCheckEnabled?: boolean | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateStaffMutationVariables = {
  input: CreateStaffInput;
  condition?: ModelStaffConditionInput | null;
};

export type CreateStaffMutation = {
  createStaff?: {
    __typename: "Staff";
    id: string;
    cognitoUserId: string;
    familyName?: string | null;
    givenName?: string | null;
    mailAddress: string;
    role: string;
    enabled: boolean;
    status: string;
    owner?: boolean | null;
    usageStartDate?: string | null;
    notifications?: {
      __typename: "Notification";
      workStart?: boolean | null;
      workEnd?: boolean | null;
    } | null;
    externalLinks?: Array<{
      __typename: "StaffExternalLink";
      label: string;
      url: string;
      enabled: boolean;
      icon: string;
    } | null> | null;
    sortKey?: string | null;
    workType?: string | null;
    developer?: boolean | null;
    approverSetting?: ApproverSettingMode | null;
    approverSingle?: string | null;
    approverMultiple?: Array<string | null> | null;
    approverMultipleMode?: ApproverMultipleMode | null;
    shiftGroup?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateStaffMutationVariables = {
  input: UpdateStaffInput;
  condition?: ModelStaffConditionInput | null;
};

export type UpdateStaffMutation = {
  updateStaff?: {
    __typename: "Staff";
    id: string;
    cognitoUserId: string;
    familyName?: string | null;
    givenName?: string | null;
    mailAddress: string;
    role: string;
    enabled: boolean;
    status: string;
    owner?: boolean | null;
    usageStartDate?: string | null;
    notifications?: {
      __typename: "Notification";
      workStart?: boolean | null;
      workEnd?: boolean | null;
    } | null;
    externalLinks?: Array<{
      __typename: "StaffExternalLink";
      label: string;
      url: string;
      enabled: boolean;
      icon: string;
    } | null> | null;
    sortKey?: string | null;
    workType?: string | null;
    developer?: boolean | null;
    approverSetting?: ApproverSettingMode | null;
    approverSingle?: string | null;
    approverMultiple?: Array<string | null> | null;
    approverMultipleMode?: ApproverMultipleMode | null;
    shiftGroup?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteStaffMutationVariables = {
  input: DeleteStaffInput;
  condition?: ModelStaffConditionInput | null;
};

export type DeleteStaffMutation = {
  deleteStaff?: {
    __typename: "Staff";
    id: string;
    cognitoUserId: string;
    familyName?: string | null;
    givenName?: string | null;
    mailAddress: string;
    role: string;
    enabled: boolean;
    status: string;
    owner?: boolean | null;
    usageStartDate?: string | null;
    notifications?: {
      __typename: "Notification";
      workStart?: boolean | null;
      workEnd?: boolean | null;
    } | null;
    externalLinks?: Array<{
      __typename: "StaffExternalLink";
      label: string;
      url: string;
      enabled: boolean;
      icon: string;
    } | null> | null;
    sortKey?: string | null;
    workType?: string | null;
    developer?: boolean | null;
    approverSetting?: ApproverSettingMode | null;
    approverSingle?: string | null;
    approverMultiple?: Array<string | null> | null;
    approverMultipleMode?: ApproverMultipleMode | null;
    shiftGroup?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateHolidayCalendarMutationVariables = {
  input: CreateHolidayCalendarInput;
  condition?: ModelHolidayCalendarConditionInput | null;
};

export type CreateHolidayCalendarMutation = {
  createHolidayCalendar?: {
    __typename: "HolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateHolidayCalendarMutationVariables = {
  input: UpdateHolidayCalendarInput;
  condition?: ModelHolidayCalendarConditionInput | null;
};

export type UpdateHolidayCalendarMutation = {
  updateHolidayCalendar?: {
    __typename: "HolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteHolidayCalendarMutationVariables = {
  input: DeleteHolidayCalendarInput;
  condition?: ModelHolidayCalendarConditionInput | null;
};

export type DeleteHolidayCalendarMutation = {
  deleteHolidayCalendar?: {
    __typename: "HolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateCompanyHolidayCalendarMutationVariables = {
  input: CreateCompanyHolidayCalendarInput;
  condition?: ModelCompanyHolidayCalendarConditionInput | null;
};

export type CreateCompanyHolidayCalendarMutation = {
  createCompanyHolidayCalendar?: {
    __typename: "CompanyHolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateCompanyHolidayCalendarMutationVariables = {
  input: UpdateCompanyHolidayCalendarInput;
  condition?: ModelCompanyHolidayCalendarConditionInput | null;
};

export type UpdateCompanyHolidayCalendarMutation = {
  updateCompanyHolidayCalendar?: {
    __typename: "CompanyHolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteCompanyHolidayCalendarMutationVariables = {
  input: DeleteCompanyHolidayCalendarInput;
  condition?: ModelCompanyHolidayCalendarConditionInput | null;
};

export type DeleteCompanyHolidayCalendarMutation = {
  deleteCompanyHolidayCalendar?: {
    __typename: "CompanyHolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateEventCalendarMutationVariables = {
  input: CreateEventCalendarInput;
  condition?: ModelEventCalendarConditionInput | null;
};

export type CreateEventCalendarMutation = {
  createEventCalendar?: {
    __typename: "EventCalendar";
    id: string;
    eventDate: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateEventCalendarMutationVariables = {
  input: UpdateEventCalendarInput;
  condition?: ModelEventCalendarConditionInput | null;
};

export type UpdateEventCalendarMutation = {
  updateEventCalendar?: {
    __typename: "EventCalendar";
    id: string;
    eventDate: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteEventCalendarMutationVariables = {
  input: DeleteEventCalendarInput;
  condition?: ModelEventCalendarConditionInput | null;
};

export type DeleteEventCalendarMutation = {
  deleteEventCalendar?: {
    __typename: "EventCalendar";
    id: string;
    eventDate: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateCloseDateMutationVariables = {
  input: CreateCloseDateInput;
  condition?: ModelCloseDateConditionInput | null;
};

export type CreateCloseDateMutation = {
  createCloseDate?: {
    __typename: "CloseDate";
    id: string;
    closeDate: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateCloseDateMutationVariables = {
  input: UpdateCloseDateInput;
  condition?: ModelCloseDateConditionInput | null;
};

export type UpdateCloseDateMutation = {
  updateCloseDate?: {
    __typename: "CloseDate";
    id: string;
    closeDate: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteCloseDateMutationVariables = {
  input: DeleteCloseDateInput;
  condition?: ModelCloseDateConditionInput | null;
};

export type DeleteCloseDateMutation = {
  deleteCloseDate?: {
    __typename: "CloseDate";
    id: string;
    closeDate: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateAttendanceMutationVariables = {
  input: CreateAttendanceInput;
  condition?: ModelAttendanceConditionInput | null;
};

export type CreateAttendanceMutation = {
  createAttendance?: {
    __typename: "Attendance";
    id: string;
    staffId: string;
    workDate: string;
    startTime?: string | null;
    endTime?: string | null;
    goDirectlyFlag?: boolean | null;
    returnDirectlyFlag?: boolean | null;
    absentFlag?: boolean | null;
    rests?: Array<{
      __typename: "Rest";
      startTime?: string | null;
      endTime?: string | null;
    } | null> | null;
    hourlyPaidHolidayTimes?: Array<{
      __typename: "HourlyPaidHolidayTime";
      startTime: string;
      endTime: string;
    } | null> | null;
    remarks?: string | null;
    paidHolidayFlag?: boolean | null;
    specialHolidayFlag?: boolean | null;
    isDeemedHoliday?: boolean | null;
    hourlyPaidHolidayHours?: number | null;
    substituteHolidayDate?: string | null;
    histories?: Array<{
      __typename: "AttendanceHistory";
      staffId: string;
      workDate: string;
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      createdAt: string;
    } | null> | null;
    changeRequests?: Array<{
      __typename: "AttendanceChangeRequest";
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      completed?: boolean | null;
      comment?: string | null;
      staffComment?: string | null;
    } | null> | null;
    systemComments?: Array<{
      __typename: "SystemComment";
      comment: string;
      confirmed: boolean;
      createdAt: string;
    } | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateAttendanceMutationVariables = {
  input: UpdateAttendanceInput;
  condition?: ModelAttendanceConditionInput | null;
};

export type UpdateAttendanceMutation = {
  updateAttendance?: {
    __typename: "Attendance";
    id: string;
    staffId: string;
    workDate: string;
    startTime?: string | null;
    endTime?: string | null;
    goDirectlyFlag?: boolean | null;
    returnDirectlyFlag?: boolean | null;
    absentFlag?: boolean | null;
    rests?: Array<{
      __typename: "Rest";
      startTime?: string | null;
      endTime?: string | null;
    } | null> | null;
    hourlyPaidHolidayTimes?: Array<{
      __typename: "HourlyPaidHolidayTime";
      startTime: string;
      endTime: string;
    } | null> | null;
    remarks?: string | null;
    paidHolidayFlag?: boolean | null;
    specialHolidayFlag?: boolean | null;
    isDeemedHoliday?: boolean | null;
    hourlyPaidHolidayHours?: number | null;
    substituteHolidayDate?: string | null;
    histories?: Array<{
      __typename: "AttendanceHistory";
      staffId: string;
      workDate: string;
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      createdAt: string;
    } | null> | null;
    changeRequests?: Array<{
      __typename: "AttendanceChangeRequest";
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      completed?: boolean | null;
      comment?: string | null;
      staffComment?: string | null;
    } | null> | null;
    systemComments?: Array<{
      __typename: "SystemComment";
      comment: string;
      confirmed: boolean;
      createdAt: string;
    } | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteAttendanceMutationVariables = {
  input: DeleteAttendanceInput;
  condition?: ModelAttendanceConditionInput | null;
};

export type DeleteAttendanceMutation = {
  deleteAttendance?: {
    __typename: "Attendance";
    id: string;
    staffId: string;
    workDate: string;
    startTime?: string | null;
    endTime?: string | null;
    goDirectlyFlag?: boolean | null;
    returnDirectlyFlag?: boolean | null;
    absentFlag?: boolean | null;
    rests?: Array<{
      __typename: "Rest";
      startTime?: string | null;
      endTime?: string | null;
    } | null> | null;
    hourlyPaidHolidayTimes?: Array<{
      __typename: "HourlyPaidHolidayTime";
      startTime: string;
      endTime: string;
    } | null> | null;
    remarks?: string | null;
    paidHolidayFlag?: boolean | null;
    specialHolidayFlag?: boolean | null;
    isDeemedHoliday?: boolean | null;
    hourlyPaidHolidayHours?: number | null;
    substituteHolidayDate?: string | null;
    histories?: Array<{
      __typename: "AttendanceHistory";
      staffId: string;
      workDate: string;
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      createdAt: string;
    } | null> | null;
    changeRequests?: Array<{
      __typename: "AttendanceChangeRequest";
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      completed?: boolean | null;
      comment?: string | null;
      staffComment?: string | null;
    } | null> | null;
    systemComments?: Array<{
      __typename: "SystemComment";
      comment: string;
      confirmed: boolean;
      createdAt: string;
    } | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateDocumentMutationVariables = {
  input: CreateDocumentInput;
  condition?: ModelDocumentConditionInput | null;
};

export type CreateDocumentMutation = {
  createDocument?: {
    __typename: "Document";
    id: string;
    title: string;
    content: string;
    tag?: Array<string | null> | null;
    targetRole?: Array<string | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateDocumentMutationVariables = {
  input: UpdateDocumentInput;
  condition?: ModelDocumentConditionInput | null;
};

export type UpdateDocumentMutation = {
  updateDocument?: {
    __typename: "Document";
    id: string;
    title: string;
    content: string;
    tag?: Array<string | null> | null;
    targetRole?: Array<string | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteDocumentMutationVariables = {
  input: DeleteDocumentInput;
  condition?: ModelDocumentConditionInput | null;
};

export type DeleteDocumentMutation = {
  deleteDocument?: {
    __typename: "Document";
    id: string;
    title: string;
    content: string;
    tag?: Array<string | null> | null;
    targetRole?: Array<string | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateShiftRequestMutationVariables = {
  input: CreateShiftRequestInput;
  condition?: ModelShiftRequestConditionInput | null;
};

export type CreateShiftRequestMutation = {
  createShiftRequest?: {
    __typename: "ShiftRequest";
    id: string;
    staffId: string;
    targetMonth: string;
    note?: string | null;
    entries?: Array<{
      __typename: "ShiftRequestDayPreference";
      date: string;
      status: ShiftRequestStatus;
      isLocked?: boolean | null;
    } | null> | null;
    summary?: {
      __typename: "ShiftRequestSummary";
      workDays?: number | null;
      fixedOffDays?: number | null;
      requestedOffDays?: number | null;
    } | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
    version?: number | null;
    histories?: Array<{
      __typename: "ShiftRequestHistory";
      version: number;
      note?: string | null;
      entries?: Array<{
        __typename: "ShiftRequestDayPreference";
        date: string;
        status: ShiftRequestStatus;
        isLocked?: boolean | null;
      } | null> | null;
      summary?: {
        __typename: "ShiftRequestSummary";
        workDays?: number | null;
        fixedOffDays?: number | null;
        requestedOffDays?: number | null;
      } | null;
      submittedAt?: string | null;
      updatedAt?: string | null;
      recordedAt: string;
      recordedByStaffId?: string | null;
      changeReason?: string | null;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type UpdateShiftRequestMutationVariables = {
  input: UpdateShiftRequestInput;
  condition?: ModelShiftRequestConditionInput | null;
};

export type UpdateShiftRequestMutation = {
  updateShiftRequest?: {
    __typename: "ShiftRequest";
    id: string;
    staffId: string;
    targetMonth: string;
    note?: string | null;
    entries?: Array<{
      __typename: "ShiftRequestDayPreference";
      date: string;
      status: ShiftRequestStatus;
      isLocked?: boolean | null;
    } | null> | null;
    summary?: {
      __typename: "ShiftRequestSummary";
      workDays?: number | null;
      fixedOffDays?: number | null;
      requestedOffDays?: number | null;
    } | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
    version?: number | null;
    histories?: Array<{
      __typename: "ShiftRequestHistory";
      version: number;
      note?: string | null;
      entries?: Array<{
        __typename: "ShiftRequestDayPreference";
        date: string;
        status: ShiftRequestStatus;
        isLocked?: boolean | null;
      } | null> | null;
      summary?: {
        __typename: "ShiftRequestSummary";
        workDays?: number | null;
        fixedOffDays?: number | null;
        requestedOffDays?: number | null;
      } | null;
      submittedAt?: string | null;
      updatedAt?: string | null;
      recordedAt: string;
      recordedByStaffId?: string | null;
      changeReason?: string | null;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type DeleteShiftRequestMutationVariables = {
  input: DeleteShiftRequestInput;
  condition?: ModelShiftRequestConditionInput | null;
};

export type DeleteShiftRequestMutation = {
  deleteShiftRequest?: {
    __typename: "ShiftRequest";
    id: string;
    staffId: string;
    targetMonth: string;
    note?: string | null;
    entries?: Array<{
      __typename: "ShiftRequestDayPreference";
      date: string;
      status: ShiftRequestStatus;
      isLocked?: boolean | null;
    } | null> | null;
    summary?: {
      __typename: "ShiftRequestSummary";
      workDays?: number | null;
      fixedOffDays?: number | null;
      requestedOffDays?: number | null;
    } | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
    version?: number | null;
    histories?: Array<{
      __typename: "ShiftRequestHistory";
      version: number;
      note?: string | null;
      entries?: Array<{
        __typename: "ShiftRequestDayPreference";
        date: string;
        status: ShiftRequestStatus;
        isLocked?: boolean | null;
      } | null> | null;
      summary?: {
        __typename: "ShiftRequestSummary";
        workDays?: number | null;
        fixedOffDays?: number | null;
        requestedOffDays?: number | null;
      } | null;
      submittedAt?: string | null;
      updatedAt?: string | null;
      recordedAt: string;
      recordedByStaffId?: string | null;
      changeReason?: string | null;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type CreateShiftPlanYearMutationVariables = {
  input: CreateShiftPlanYearInput;
  condition?: ModelShiftPlanYearConditionInput | null;
};

export type CreateShiftPlanYearMutation = {
  createShiftPlanYear?: {
    __typename: "ShiftPlanYear";
    id: string;
    targetYear: number;
    plans?: Array<{
      __typename: "ShiftPlanMonthSetting";
      month: number;
      editStart?: string | null;
      editEnd?: string | null;
      enabled?: boolean | null;
      dailyCapacities?: Array<number | null> | null;
    } | null> | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateShiftPlanYearMutationVariables = {
  input: UpdateShiftPlanYearInput;
  condition?: ModelShiftPlanYearConditionInput | null;
};

export type UpdateShiftPlanYearMutation = {
  updateShiftPlanYear?: {
    __typename: "ShiftPlanYear";
    id: string;
    targetYear: number;
    plans?: Array<{
      __typename: "ShiftPlanMonthSetting";
      month: number;
      editStart?: string | null;
      editEnd?: string | null;
      enabled?: boolean | null;
      dailyCapacities?: Array<number | null> | null;
    } | null> | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteShiftPlanYearMutationVariables = {
  input: DeleteShiftPlanYearInput;
  condition?: ModelShiftPlanYearConditionInput | null;
};

export type DeleteShiftPlanYearMutation = {
  deleteShiftPlanYear?: {
    __typename: "ShiftPlanYear";
    id: string;
    targetYear: number;
    plans?: Array<{
      __typename: "ShiftPlanMonthSetting";
      month: number;
      editStart?: string | null;
      editEnd?: string | null;
      enabled?: boolean | null;
      dailyCapacities?: Array<number | null> | null;
    } | null> | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateWorkflowMutationVariables = {
  input: CreateWorkflowInput;
  condition?: ModelWorkflowConditionInput | null;
};

export type CreateWorkflowMutation = {
  createWorkflow?: {
    __typename: "Workflow";
    id: string;
    approvedStaffIds?: Array<string | null> | null;
    rejectedStaffIds?: Array<string | null> | null;
    finalDecisionTimestamp?: string | null;
    category?: WorkflowCategory | null;
    staffId: string;
    status: WorkflowStatus;
    assignedApproverStaffIds?: Array<string | null> | null;
    approvalSteps?: Array<{
      __typename: "ApprovalStep";
      id: string;
      approverStaffId: string;
      decisionStatus: ApprovalStatus;
      approverComment?: string | null;
      decisionTimestamp?: string | null;
      stepOrder?: number | null;
    } | null> | null;
    nextApprovalStepIndex?: number | null;
    submitterApproverSetting?: ApproverSettingMode | null;
    submitterApproverId?: string | null;
    submitterApproverIds?: Array<string | null> | null;
    submitterApproverMultipleMode?: ApproverMultipleMode | null;
    overTimeDetails?: {
      __typename: "OverTimeWorkflow";
      date: string;
      startTime: string;
      endTime: string;
      reason: string;
    } | null;
    comments?: Array<{
      __typename: "WorkflowComment";
      id: string;
      staffId: string;
      text: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateWorkflowMutationVariables = {
  input: UpdateWorkflowInput;
  condition?: ModelWorkflowConditionInput | null;
};

export type UpdateWorkflowMutation = {
  updateWorkflow?: {
    __typename: "Workflow";
    id: string;
    approvedStaffIds?: Array<string | null> | null;
    rejectedStaffIds?: Array<string | null> | null;
    finalDecisionTimestamp?: string | null;
    category?: WorkflowCategory | null;
    staffId: string;
    status: WorkflowStatus;
    assignedApproverStaffIds?: Array<string | null> | null;
    approvalSteps?: Array<{
      __typename: "ApprovalStep";
      id: string;
      approverStaffId: string;
      decisionStatus: ApprovalStatus;
      approverComment?: string | null;
      decisionTimestamp?: string | null;
      stepOrder?: number | null;
    } | null> | null;
    nextApprovalStepIndex?: number | null;
    submitterApproverSetting?: ApproverSettingMode | null;
    submitterApproverId?: string | null;
    submitterApproverIds?: Array<string | null> | null;
    submitterApproverMultipleMode?: ApproverMultipleMode | null;
    overTimeDetails?: {
      __typename: "OverTimeWorkflow";
      date: string;
      startTime: string;
      endTime: string;
      reason: string;
    } | null;
    comments?: Array<{
      __typename: "WorkflowComment";
      id: string;
      staffId: string;
      text: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteWorkflowMutationVariables = {
  input: DeleteWorkflowInput;
  condition?: ModelWorkflowConditionInput | null;
};

export type DeleteWorkflowMutation = {
  deleteWorkflow?: {
    __typename: "Workflow";
    id: string;
    approvedStaffIds?: Array<string | null> | null;
    rejectedStaffIds?: Array<string | null> | null;
    finalDecisionTimestamp?: string | null;
    category?: WorkflowCategory | null;
    staffId: string;
    status: WorkflowStatus;
    assignedApproverStaffIds?: Array<string | null> | null;
    approvalSteps?: Array<{
      __typename: "ApprovalStep";
      id: string;
      approverStaffId: string;
      decisionStatus: ApprovalStatus;
      approverComment?: string | null;
      decisionTimestamp?: string | null;
      stepOrder?: number | null;
    } | null> | null;
    nextApprovalStepIndex?: number | null;
    submitterApproverSetting?: ApproverSettingMode | null;
    submitterApproverId?: string | null;
    submitterApproverIds?: Array<string | null> | null;
    submitterApproverMultipleMode?: ApproverMultipleMode | null;
    overTimeDetails?: {
      __typename: "OverTimeWorkflow";
      date: string;
      startTime: string;
      endTime: string;
      reason: string;
    } | null;
    comments?: Array<{
      __typename: "WorkflowComment";
      id: string;
      staffId: string;
      text: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateOperationLogMutationVariables = {
  input: CreateOperationLogInput;
  condition?: ModelOperationLogConditionInput | null;
};

export type CreateOperationLogMutation = {
  createOperationLog?: {
    __typename: "OperationLog";
    id: string;
    staffId?: string | null;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    timestamp: string;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: string | null;
    severity?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type UpdateOperationLogMutationVariables = {
  input: UpdateOperationLogInput;
  condition?: ModelOperationLogConditionInput | null;
};

export type UpdateOperationLogMutation = {
  updateOperationLog?: {
    __typename: "OperationLog";
    id: string;
    staffId?: string | null;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    timestamp: string;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: string | null;
    severity?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type DeleteOperationLogMutationVariables = {
  input: DeleteOperationLogInput;
  condition?: ModelOperationLogConditionInput | null;
};

export type DeleteOperationLogMutation = {
  deleteOperationLog?: {
    __typename: "OperationLog";
    id: string;
    staffId?: string | null;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    timestamp: string;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: string | null;
    severity?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type CreateAuditLogMutationVariables = {
  input: CreateAuditLogInput;
  condition?: ModelAuditLogConditionInput | null;
};

export type CreateAuditLogMutation = {
  createAuditLog?: {
    __typename: "AuditLog";
    id: string;
    resourceType: string;
    resourceId: string;
    action: string;
    actorId: string;
    actorRole?: string | null;
    requestId: string;
    ip?: string | null;
    userAgent?: string | null;
    before?: string | null;
    after?: string | null;
    diff?: string | null;
    createdAt: string;
    ttl?: number | null;
    reason?: string | null;
    updatedAt: string;
  } | null;
};

export type UpdateAuditLogMutationVariables = {
  input: UpdateAuditLogInput;
  condition?: ModelAuditLogConditionInput | null;
};

export type UpdateAuditLogMutation = {
  updateAuditLog?: {
    __typename: "AuditLog";
    id: string;
    resourceType: string;
    resourceId: string;
    action: string;
    actorId: string;
    actorRole?: string | null;
    requestId: string;
    ip?: string | null;
    userAgent?: string | null;
    before?: string | null;
    after?: string | null;
    diff?: string | null;
    createdAt: string;
    ttl?: number | null;
    reason?: string | null;
    updatedAt: string;
  } | null;
};

export type DeleteAuditLogMutationVariables = {
  input: DeleteAuditLogInput;
  condition?: ModelAuditLogConditionInput | null;
};

export type DeleteAuditLogMutation = {
  deleteAuditLog?: {
    __typename: "AuditLog";
    id: string;
    resourceType: string;
    resourceId: string;
    action: string;
    actorId: string;
    actorRole?: string | null;
    requestId: string;
    ip?: string | null;
    userAgent?: string | null;
    before?: string | null;
    after?: string | null;
    diff?: string | null;
    createdAt: string;
    ttl?: number | null;
    reason?: string | null;
    updatedAt: string;
  } | null;
};

export type CreateDailyReportMutationVariables = {
  input: CreateDailyReportInput;
  condition?: ModelDailyReportConditionInput | null;
};

export type CreateDailyReportMutation = {
  createDailyReport?: {
    __typename: "DailyReport";
    id: string;
    staffId: string;
    reportDate: string;
    title: string;
    content?: string | null;
    status: DailyReportStatus;
    updatedAt?: string | null;
    reactions?: Array<{
      __typename: "DailyReportReaction";
      staffId: string;
      type: DailyReportReactionType;
      createdAt: string;
    } | null> | null;
    comments?: Array<{
      __typename: "DailyReportComment";
      id: string;
      staffId: string;
      authorName?: string | null;
      body: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type UpdateDailyReportMutationVariables = {
  input: UpdateDailyReportInput;
  condition?: ModelDailyReportConditionInput | null;
};

export type UpdateDailyReportMutation = {
  updateDailyReport?: {
    __typename: "DailyReport";
    id: string;
    staffId: string;
    reportDate: string;
    title: string;
    content?: string | null;
    status: DailyReportStatus;
    updatedAt?: string | null;
    reactions?: Array<{
      __typename: "DailyReportReaction";
      staffId: string;
      type: DailyReportReactionType;
      createdAt: string;
    } | null> | null;
    comments?: Array<{
      __typename: "DailyReportComment";
      id: string;
      staffId: string;
      authorName?: string | null;
      body: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type DeleteDailyReportMutationVariables = {
  input: DeleteDailyReportInput;
  condition?: ModelDailyReportConditionInput | null;
};

export type DeleteDailyReportMutation = {
  deleteDailyReport?: {
    __typename: "DailyReport";
    id: string;
    staffId: string;
    reportDate: string;
    title: string;
    content?: string | null;
    status: DailyReportStatus;
    updatedAt?: string | null;
    reactions?: Array<{
      __typename: "DailyReportReaction";
      staffId: string;
      type: DailyReportReactionType;
      createdAt: string;
    } | null> | null;
    comments?: Array<{
      __typename: "DailyReportComment";
      id: string;
      staffId: string;
      authorName?: string | null;
      body: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type SendMailQueryVariables = {
  data: EmailData;
};

export type SendMailQuery = {
  sendMail?: {
    __typename: "EmailResult";
    statusCode?: number | null;
    body?: string | null;
  } | null;
};

export type GetCheckForUpdateQueryVariables = {
  id: string;
};

export type GetCheckForUpdateQuery = {
  getCheckForUpdate?: {
    __typename: "CheckForUpdate";
    id: string;
    deployUuid: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListCheckForUpdatesQueryVariables = {
  filter?: ModelCheckForUpdateFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListCheckForUpdatesQuery = {
  listCheckForUpdates?: {
    __typename: "ModelCheckForUpdateConnection";
    items: Array<{
      __typename: "CheckForUpdate";
      id: string;
      deployUuid: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetAppConfigQueryVariables = {
  id: string;
};

export type GetAppConfigQuery = {
  getAppConfig?: {
    __typename: "AppConfig";
    id: string;
    name: string;
    workStartTime?: string | null;
    workEndTime?: string | null;
    lunchRestStartTime?: string | null;
    lunchRestEndTime?: string | null;
    standardWorkHours?: number | null;
    amHolidayStartTime?: string | null;
    amHolidayEndTime?: string | null;
    pmHolidayStartTime?: string | null;
    pmHolidayEndTime?: string | null;
    specialHolidayEnabled?: boolean | null;
    amPmHolidayEnabled?: boolean | null;
    officeMode?: boolean | null;
    attendanceStatisticsEnabled?: boolean | null;
    absentEnabled?: boolean | null;
    hourlyPaidHolidayEnabled?: boolean | null;
    links?: Array<{
      __typename: "Link";
      label: string;
      url: string;
      enabled: boolean;
      icon?: string | null;
    } | null> | null;
    reasons?: Array<{
      __typename: "Reason";
      reason: string;
      enabled: boolean;
    } | null> | null;
    quickInputStartTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    quickInputEndTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    themeColor?: string | null;
    shiftGroups?: Array<{
      __typename: "ShiftGroup";
      label: string;
      description?: string | null;
      min?: number | null;
      max?: number | null;
      fixed?: number | null;
    } | null> | null;
    overTimeCheckEnabled?: boolean | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListAppConfigsQueryVariables = {
  filter?: ModelAppConfigFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListAppConfigsQuery = {
  listAppConfigs?: {
    __typename: "ModelAppConfigConnection";
    items: Array<{
      __typename: "AppConfig";
      id: string;
      name: string;
      workStartTime?: string | null;
      workEndTime?: string | null;
      lunchRestStartTime?: string | null;
      lunchRestEndTime?: string | null;
      standardWorkHours?: number | null;
      amHolidayStartTime?: string | null;
      amHolidayEndTime?: string | null;
      pmHolidayStartTime?: string | null;
      pmHolidayEndTime?: string | null;
      specialHolidayEnabled?: boolean | null;
      amPmHolidayEnabled?: boolean | null;
      officeMode?: boolean | null;
      attendanceStatisticsEnabled?: boolean | null;
      absentEnabled?: boolean | null;
      hourlyPaidHolidayEnabled?: boolean | null;
      links?: Array<{
        __typename: "Link";
        label: string;
        url: string;
        enabled: boolean;
        icon?: string | null;
      } | null> | null;
      reasons?: Array<{
        __typename: "Reason";
        reason: string;
        enabled: boolean;
      } | null> | null;
      quickInputStartTimes?: Array<{
        __typename: "QuickInputTime";
        time: string;
        enabled: boolean;
      } | null> | null;
      quickInputEndTimes?: Array<{
        __typename: "QuickInputTime";
        time: string;
        enabled: boolean;
      } | null> | null;
      themeColor?: string | null;
      shiftGroups?: Array<{
        __typename: "ShiftGroup";
        label: string;
        description?: string | null;
        min?: number | null;
        max?: number | null;
        fixed?: number | null;
      } | null> | null;
      overTimeCheckEnabled?: boolean | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetStaffQueryVariables = {
  id: string;
};

export type GetStaffQuery = {
  getStaff?: {
    __typename: "Staff";
    id: string;
    cognitoUserId: string;
    familyName?: string | null;
    givenName?: string | null;
    mailAddress: string;
    role: string;
    enabled: boolean;
    status: string;
    owner?: boolean | null;
    usageStartDate?: string | null;
    notifications?: {
      __typename: "Notification";
      workStart?: boolean | null;
      workEnd?: boolean | null;
    } | null;
    externalLinks?: Array<{
      __typename: "StaffExternalLink";
      label: string;
      url: string;
      enabled: boolean;
      icon: string;
    } | null> | null;
    sortKey?: string | null;
    workType?: string | null;
    developer?: boolean | null;
    approverSetting?: ApproverSettingMode | null;
    approverSingle?: string | null;
    approverMultiple?: Array<string | null> | null;
    approverMultipleMode?: ApproverMultipleMode | null;
    shiftGroup?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListStaffQueryVariables = {
  filter?: ModelStaffFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListStaffQuery = {
  listStaff?: {
    __typename: "ModelStaffConnection";
    items: Array<{
      __typename: "Staff";
      id: string;
      cognitoUserId: string;
      familyName?: string | null;
      givenName?: string | null;
      mailAddress: string;
      role: string;
      enabled: boolean;
      status: string;
      owner?: boolean | null;
      usageStartDate?: string | null;
      notifications?: {
        __typename: "Notification";
        workStart?: boolean | null;
        workEnd?: boolean | null;
      } | null;
      externalLinks?: Array<{
        __typename: "StaffExternalLink";
        label: string;
        url: string;
        enabled: boolean;
        icon: string;
      } | null> | null;
      sortKey?: string | null;
      workType?: string | null;
      developer?: boolean | null;
      approverSetting?: ApproverSettingMode | null;
      approverSingle?: string | null;
      approverMultiple?: Array<string | null> | null;
      approverMultipleMode?: ApproverMultipleMode | null;
      shiftGroup?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type StaffByCognitoUserIdQueryVariables = {
  cognitoUserId: string;
  id?: ModelIDKeyConditionInput | null;
  sortDirection?: ModelSortDirection | null;
  filter?: ModelStaffFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type StaffByCognitoUserIdQuery = {
  staffByCognitoUserId?: {
    __typename: "ModelStaffConnection";
    items: Array<{
      __typename: "Staff";
      id: string;
      cognitoUserId: string;
      familyName?: string | null;
      givenName?: string | null;
      mailAddress: string;
      role: string;
      enabled: boolean;
      status: string;
      owner?: boolean | null;
      usageStartDate?: string | null;
      notifications?: {
        __typename: "Notification";
        workStart?: boolean | null;
        workEnd?: boolean | null;
      } | null;
      externalLinks?: Array<{
        __typename: "StaffExternalLink";
        label: string;
        url: string;
        enabled: boolean;
        icon: string;
      } | null> | null;
      sortKey?: string | null;
      workType?: string | null;
      developer?: boolean | null;
      approverSetting?: ApproverSettingMode | null;
      approverSingle?: string | null;
      approverMultiple?: Array<string | null> | null;
      approverMultipleMode?: ApproverMultipleMode | null;
      shiftGroup?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetHolidayCalendarQueryVariables = {
  id: string;
};

export type GetHolidayCalendarQuery = {
  getHolidayCalendar?: {
    __typename: "HolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListHolidayCalendarsQueryVariables = {
  filter?: ModelHolidayCalendarFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListHolidayCalendarsQuery = {
  listHolidayCalendars?: {
    __typename: "ModelHolidayCalendarConnection";
    items: Array<{
      __typename: "HolidayCalendar";
      id: string;
      holidayDate: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetCompanyHolidayCalendarQueryVariables = {
  id: string;
};

export type GetCompanyHolidayCalendarQuery = {
  getCompanyHolidayCalendar?: {
    __typename: "CompanyHolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListCompanyHolidayCalendarsQueryVariables = {
  filter?: ModelCompanyHolidayCalendarFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListCompanyHolidayCalendarsQuery = {
  listCompanyHolidayCalendars?: {
    __typename: "ModelCompanyHolidayCalendarConnection";
    items: Array<{
      __typename: "CompanyHolidayCalendar";
      id: string;
      holidayDate: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetEventCalendarQueryVariables = {
  id: string;
};

export type GetEventCalendarQuery = {
  getEventCalendar?: {
    __typename: "EventCalendar";
    id: string;
    eventDate: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListEventCalendarsQueryVariables = {
  filter?: ModelEventCalendarFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListEventCalendarsQuery = {
  listEventCalendars?: {
    __typename: "ModelEventCalendarConnection";
    items: Array<{
      __typename: "EventCalendar";
      id: string;
      eventDate: string;
      name: string;
      description?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetCloseDateQueryVariables = {
  id: string;
};

export type GetCloseDateQuery = {
  getCloseDate?: {
    __typename: "CloseDate";
    id: string;
    closeDate: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListCloseDatesQueryVariables = {
  filter?: ModelCloseDateFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListCloseDatesQuery = {
  listCloseDates?: {
    __typename: "ModelCloseDateConnection";
    items: Array<{
      __typename: "CloseDate";
      id: string;
      closeDate: string;
      startDate: string;
      endDate: string;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetAttendanceQueryVariables = {
  id: string;
};

export type GetAttendanceQuery = {
  getAttendance?: {
    __typename: "Attendance";
    id: string;
    staffId: string;
    workDate: string;
    startTime?: string | null;
    endTime?: string | null;
    goDirectlyFlag?: boolean | null;
    returnDirectlyFlag?: boolean | null;
    absentFlag?: boolean | null;
    rests?: Array<{
      __typename: "Rest";
      startTime?: string | null;
      endTime?: string | null;
    } | null> | null;
    hourlyPaidHolidayTimes?: Array<{
      __typename: "HourlyPaidHolidayTime";
      startTime: string;
      endTime: string;
    } | null> | null;
    remarks?: string | null;
    paidHolidayFlag?: boolean | null;
    specialHolidayFlag?: boolean | null;
    isDeemedHoliday?: boolean | null;
    hourlyPaidHolidayHours?: number | null;
    substituteHolidayDate?: string | null;
    histories?: Array<{
      __typename: "AttendanceHistory";
      staffId: string;
      workDate: string;
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      createdAt: string;
    } | null> | null;
    changeRequests?: Array<{
      __typename: "AttendanceChangeRequest";
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      completed?: boolean | null;
      comment?: string | null;
      staffComment?: string | null;
    } | null> | null;
    systemComments?: Array<{
      __typename: "SystemComment";
      comment: string;
      confirmed: boolean;
      createdAt: string;
    } | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListAttendancesQueryVariables = {
  filter?: ModelAttendanceFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListAttendancesQuery = {
  listAttendances?: {
    __typename: "ModelAttendanceConnection";
    items: Array<{
      __typename: "Attendance";
      id: string;
      staffId: string;
      workDate: string;
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      isDeemedHoliday?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayDate?: string | null;
      histories?: Array<{
        __typename: "AttendanceHistory";
        staffId: string;
        workDate: string;
        startTime?: string | null;
        endTime?: string | null;
        goDirectlyFlag?: boolean | null;
        absentFlag?: boolean | null;
        returnDirectlyFlag?: boolean | null;
        rests?: Array<{
          __typename: "Rest";
          startTime?: string | null;
          endTime?: string | null;
        } | null> | null;
        hourlyPaidHolidayTimes?: Array<{
          __typename: "HourlyPaidHolidayTime";
          startTime: string;
          endTime: string;
        } | null> | null;
        remarks?: string | null;
        paidHolidayFlag?: boolean | null;
        specialHolidayFlag?: boolean | null;
        hourlyPaidHolidayHours?: number | null;
        substituteHolidayFlag?: boolean | null;
        substituteHolidayDate?: string | null;
        createdAt: string;
      } | null> | null;
      changeRequests?: Array<{
        __typename: "AttendanceChangeRequest";
        startTime?: string | null;
        endTime?: string | null;
        goDirectlyFlag?: boolean | null;
        absentFlag?: boolean | null;
        returnDirectlyFlag?: boolean | null;
        rests?: Array<{
          __typename: "Rest";
          startTime?: string | null;
          endTime?: string | null;
        } | null> | null;
        hourlyPaidHolidayTimes?: Array<{
          __typename: "HourlyPaidHolidayTime";
          startTime: string;
          endTime: string;
        } | null> | null;
        remarks?: string | null;
        paidHolidayFlag?: boolean | null;
        specialHolidayFlag?: boolean | null;
        hourlyPaidHolidayHours?: number | null;
        substituteHolidayFlag?: boolean | null;
        substituteHolidayDate?: string | null;
        completed?: boolean | null;
        comment?: string | null;
        staffComment?: string | null;
      } | null> | null;
      systemComments?: Array<{
        __typename: "SystemComment";
        comment: string;
        confirmed: boolean;
        createdAt: string;
      } | null> | null;
      revision?: number | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type AttendancesByStaffIdQueryVariables = {
  staffId: string;
  workDate?: ModelStringKeyConditionInput | null;
  sortDirection?: ModelSortDirection | null;
  filter?: ModelAttendanceFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type AttendancesByStaffIdQuery = {
  attendancesByStaffId?: {
    __typename: "ModelAttendanceConnection";
    items: Array<{
      __typename: "Attendance";
      id: string;
      staffId: string;
      workDate: string;
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      isDeemedHoliday?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayDate?: string | null;
      histories?: Array<{
        __typename: "AttendanceHistory";
        staffId: string;
        workDate: string;
        startTime?: string | null;
        endTime?: string | null;
        goDirectlyFlag?: boolean | null;
        absentFlag?: boolean | null;
        returnDirectlyFlag?: boolean | null;
        rests?: Array<{
          __typename: "Rest";
          startTime?: string | null;
          endTime?: string | null;
        } | null> | null;
        hourlyPaidHolidayTimes?: Array<{
          __typename: "HourlyPaidHolidayTime";
          startTime: string;
          endTime: string;
        } | null> | null;
        remarks?: string | null;
        paidHolidayFlag?: boolean | null;
        specialHolidayFlag?: boolean | null;
        hourlyPaidHolidayHours?: number | null;
        substituteHolidayFlag?: boolean | null;
        substituteHolidayDate?: string | null;
        createdAt: string;
      } | null> | null;
      changeRequests?: Array<{
        __typename: "AttendanceChangeRequest";
        startTime?: string | null;
        endTime?: string | null;
        goDirectlyFlag?: boolean | null;
        absentFlag?: boolean | null;
        returnDirectlyFlag?: boolean | null;
        rests?: Array<{
          __typename: "Rest";
          startTime?: string | null;
          endTime?: string | null;
        } | null> | null;
        hourlyPaidHolidayTimes?: Array<{
          __typename: "HourlyPaidHolidayTime";
          startTime: string;
          endTime: string;
        } | null> | null;
        remarks?: string | null;
        paidHolidayFlag?: boolean | null;
        specialHolidayFlag?: boolean | null;
        hourlyPaidHolidayHours?: number | null;
        substituteHolidayFlag?: boolean | null;
        substituteHolidayDate?: string | null;
        completed?: boolean | null;
        comment?: string | null;
        staffComment?: string | null;
      } | null> | null;
      systemComments?: Array<{
        __typename: "SystemComment";
        comment: string;
        confirmed: boolean;
        createdAt: string;
      } | null> | null;
      revision?: number | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetDocumentQueryVariables = {
  id: string;
};

export type GetDocumentQuery = {
  getDocument?: {
    __typename: "Document";
    id: string;
    title: string;
    content: string;
    tag?: Array<string | null> | null;
    targetRole?: Array<string | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListDocumentsQueryVariables = {
  filter?: ModelDocumentFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListDocumentsQuery = {
  listDocuments?: {
    __typename: "ModelDocumentConnection";
    items: Array<{
      __typename: "Document";
      id: string;
      title: string;
      content: string;
      tag?: Array<string | null> | null;
      targetRole?: Array<string | null> | null;
      revision?: number | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetShiftRequestQueryVariables = {
  id: string;
};

export type GetShiftRequestQuery = {
  getShiftRequest?: {
    __typename: "ShiftRequest";
    id: string;
    staffId: string;
    targetMonth: string;
    note?: string | null;
    entries?: Array<{
      __typename: "ShiftRequestDayPreference";
      date: string;
      status: ShiftRequestStatus;
      isLocked?: boolean | null;
    } | null> | null;
    summary?: {
      __typename: "ShiftRequestSummary";
      workDays?: number | null;
      fixedOffDays?: number | null;
      requestedOffDays?: number | null;
    } | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
    version?: number | null;
    histories?: Array<{
      __typename: "ShiftRequestHistory";
      version: number;
      note?: string | null;
      entries?: Array<{
        __typename: "ShiftRequestDayPreference";
        date: string;
        status: ShiftRequestStatus;
        isLocked?: boolean | null;
      } | null> | null;
      summary?: {
        __typename: "ShiftRequestSummary";
        workDays?: number | null;
        fixedOffDays?: number | null;
        requestedOffDays?: number | null;
      } | null;
      submittedAt?: string | null;
      updatedAt?: string | null;
      recordedAt: string;
      recordedByStaffId?: string | null;
      changeReason?: string | null;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type ListShiftRequestsQueryVariables = {
  filter?: ModelShiftRequestFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListShiftRequestsQuery = {
  listShiftRequests?: {
    __typename: "ModelShiftRequestConnection";
    items: Array<{
      __typename: "ShiftRequest";
      id: string;
      staffId: string;
      targetMonth: string;
      note?: string | null;
      entries?: Array<{
        __typename: "ShiftRequestDayPreference";
        date: string;
        status: ShiftRequestStatus;
        isLocked?: boolean | null;
      } | null> | null;
      summary?: {
        __typename: "ShiftRequestSummary";
        workDays?: number | null;
        fixedOffDays?: number | null;
        requestedOffDays?: number | null;
      } | null;
      submittedAt?: string | null;
      updatedAt?: string | null;
      updatedBy?: string | null;
      version?: number | null;
      histories?: Array<{
        __typename: "ShiftRequestHistory";
        version: number;
        note?: string | null;
        entries?: Array<{
          __typename: "ShiftRequestDayPreference";
          date: string;
          status: ShiftRequestStatus;
          isLocked?: boolean | null;
        } | null> | null;
        summary?: {
          __typename: "ShiftRequestSummary";
          workDays?: number | null;
          fixedOffDays?: number | null;
          requestedOffDays?: number | null;
        } | null;
        submittedAt?: string | null;
        updatedAt?: string | null;
        recordedAt: string;
        recordedByStaffId?: string | null;
        changeReason?: string | null;
      } | null> | null;
      createdAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type ShiftRequestsByStaffIdQueryVariables = {
  staffId: string;
  targetMonth?: ModelStringKeyConditionInput | null;
  sortDirection?: ModelSortDirection | null;
  filter?: ModelShiftRequestFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ShiftRequestsByStaffIdQuery = {
  shiftRequestsByStaffId?: {
    __typename: "ModelShiftRequestConnection";
    items: Array<{
      __typename: "ShiftRequest";
      id: string;
      staffId: string;
      targetMonth: string;
      note?: string | null;
      entries?: Array<{
        __typename: "ShiftRequestDayPreference";
        date: string;
        status: ShiftRequestStatus;
        isLocked?: boolean | null;
      } | null> | null;
      summary?: {
        __typename: "ShiftRequestSummary";
        workDays?: number | null;
        fixedOffDays?: number | null;
        requestedOffDays?: number | null;
      } | null;
      submittedAt?: string | null;
      updatedAt?: string | null;
      updatedBy?: string | null;
      version?: number | null;
      histories?: Array<{
        __typename: "ShiftRequestHistory";
        version: number;
        note?: string | null;
        entries?: Array<{
          __typename: "ShiftRequestDayPreference";
          date: string;
          status: ShiftRequestStatus;
          isLocked?: boolean | null;
        } | null> | null;
        summary?: {
          __typename: "ShiftRequestSummary";
          workDays?: number | null;
          fixedOffDays?: number | null;
          requestedOffDays?: number | null;
        } | null;
        submittedAt?: string | null;
        updatedAt?: string | null;
        recordedAt: string;
        recordedByStaffId?: string | null;
        changeReason?: string | null;
      } | null> | null;
      createdAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetShiftPlanYearQueryVariables = {
  id: string;
};

export type GetShiftPlanYearQuery = {
  getShiftPlanYear?: {
    __typename: "ShiftPlanYear";
    id: string;
    targetYear: number;
    plans?: Array<{
      __typename: "ShiftPlanMonthSetting";
      month: number;
      editStart?: string | null;
      editEnd?: string | null;
      enabled?: boolean | null;
      dailyCapacities?: Array<number | null> | null;
    } | null> | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListShiftPlanYearsQueryVariables = {
  filter?: ModelShiftPlanYearFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListShiftPlanYearsQuery = {
  listShiftPlanYears?: {
    __typename: "ModelShiftPlanYearConnection";
    items: Array<{
      __typename: "ShiftPlanYear";
      id: string;
      targetYear: number;
      plans?: Array<{
        __typename: "ShiftPlanMonthSetting";
        month: number;
        editStart?: string | null;
        editEnd?: string | null;
        enabled?: boolean | null;
        dailyCapacities?: Array<number | null> | null;
      } | null> | null;
      notes?: string | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type ShiftPlanYearByTargetYearQueryVariables = {
  targetYear: number;
  id?: ModelIDKeyConditionInput | null;
  sortDirection?: ModelSortDirection | null;
  filter?: ModelShiftPlanYearFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ShiftPlanYearByTargetYearQuery = {
  shiftPlanYearByTargetYear?: {
    __typename: "ModelShiftPlanYearConnection";
    items: Array<{
      __typename: "ShiftPlanYear";
      id: string;
      targetYear: number;
      plans?: Array<{
        __typename: "ShiftPlanMonthSetting";
        month: number;
        editStart?: string | null;
        editEnd?: string | null;
        enabled?: boolean | null;
        dailyCapacities?: Array<number | null> | null;
      } | null> | null;
      notes?: string | null;
      createdBy?: string | null;
      updatedBy?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetWorkflowQueryVariables = {
  id: string;
};

export type GetWorkflowQuery = {
  getWorkflow?: {
    __typename: "Workflow";
    id: string;
    approvedStaffIds?: Array<string | null> | null;
    rejectedStaffIds?: Array<string | null> | null;
    finalDecisionTimestamp?: string | null;
    category?: WorkflowCategory | null;
    staffId: string;
    status: WorkflowStatus;
    assignedApproverStaffIds?: Array<string | null> | null;
    approvalSteps?: Array<{
      __typename: "ApprovalStep";
      id: string;
      approverStaffId: string;
      decisionStatus: ApprovalStatus;
      approverComment?: string | null;
      decisionTimestamp?: string | null;
      stepOrder?: number | null;
    } | null> | null;
    nextApprovalStepIndex?: number | null;
    submitterApproverSetting?: ApproverSettingMode | null;
    submitterApproverId?: string | null;
    submitterApproverIds?: Array<string | null> | null;
    submitterApproverMultipleMode?: ApproverMultipleMode | null;
    overTimeDetails?: {
      __typename: "OverTimeWorkflow";
      date: string;
      startTime: string;
      endTime: string;
      reason: string;
    } | null;
    comments?: Array<{
      __typename: "WorkflowComment";
      id: string;
      staffId: string;
      text: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListWorkflowsQueryVariables = {
  filter?: ModelWorkflowFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListWorkflowsQuery = {
  listWorkflows?: {
    __typename: "ModelWorkflowConnection";
    items: Array<{
      __typename: "Workflow";
      id: string;
      approvedStaffIds?: Array<string | null> | null;
      rejectedStaffIds?: Array<string | null> | null;
      finalDecisionTimestamp?: string | null;
      category?: WorkflowCategory | null;
      staffId: string;
      status: WorkflowStatus;
      assignedApproverStaffIds?: Array<string | null> | null;
      approvalSteps?: Array<{
        __typename: "ApprovalStep";
        id: string;
        approverStaffId: string;
        decisionStatus: ApprovalStatus;
        approverComment?: string | null;
        decisionTimestamp?: string | null;
        stepOrder?: number | null;
      } | null> | null;
      nextApprovalStepIndex?: number | null;
      submitterApproverSetting?: ApproverSettingMode | null;
      submitterApproverId?: string | null;
      submitterApproverIds?: Array<string | null> | null;
      submitterApproverMultipleMode?: ApproverMultipleMode | null;
      overTimeDetails?: {
        __typename: "OverTimeWorkflow";
        date: string;
        startTime: string;
        endTime: string;
        reason: string;
      } | null;
      comments?: Array<{
        __typename: "WorkflowComment";
        id: string;
        staffId: string;
        text: string;
        createdAt: string;
      } | null> | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type WorkflowsByStaffIdQueryVariables = {
  staffId: string;
  sortDirection?: ModelSortDirection | null;
  filter?: ModelWorkflowFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type WorkflowsByStaffIdQuery = {
  workflowsByStaffId?: {
    __typename: "ModelWorkflowConnection";
    items: Array<{
      __typename: "Workflow";
      id: string;
      approvedStaffIds?: Array<string | null> | null;
      rejectedStaffIds?: Array<string | null> | null;
      finalDecisionTimestamp?: string | null;
      category?: WorkflowCategory | null;
      staffId: string;
      status: WorkflowStatus;
      assignedApproverStaffIds?: Array<string | null> | null;
      approvalSteps?: Array<{
        __typename: "ApprovalStep";
        id: string;
        approverStaffId: string;
        decisionStatus: ApprovalStatus;
        approverComment?: string | null;
        decisionTimestamp?: string | null;
        stepOrder?: number | null;
      } | null> | null;
      nextApprovalStepIndex?: number | null;
      submitterApproverSetting?: ApproverSettingMode | null;
      submitterApproverId?: string | null;
      submitterApproverIds?: Array<string | null> | null;
      submitterApproverMultipleMode?: ApproverMultipleMode | null;
      overTimeDetails?: {
        __typename: "OverTimeWorkflow";
        date: string;
        startTime: string;
        endTime: string;
        reason: string;
      } | null;
      comments?: Array<{
        __typename: "WorkflowComment";
        id: string;
        staffId: string;
        text: string;
        createdAt: string;
      } | null> | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetOperationLogQueryVariables = {
  id: string;
};

export type GetOperationLogQuery = {
  getOperationLog?: {
    __typename: "OperationLog";
    id: string;
    staffId?: string | null;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    timestamp: string;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: string | null;
    severity?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type ListOperationLogsQueryVariables = {
  filter?: ModelOperationLogFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListOperationLogsQuery = {
  listOperationLogs?: {
    __typename: "ModelOperationLogConnection";
    items: Array<{
      __typename: "OperationLog";
      id: string;
      staffId?: string | null;
      action: string;
      resource?: string | null;
      resourceId?: string | null;
      timestamp: string;
      details?: string | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      metadata?: string | null;
      severity?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type OperationLogsByStaffIdQueryVariables = {
  staffId: string;
  timestamp?: ModelStringKeyConditionInput | null;
  sortDirection?: ModelSortDirection | null;
  filter?: ModelOperationLogFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type OperationLogsByStaffIdQuery = {
  operationLogsByStaffId?: {
    __typename: "ModelOperationLogConnection";
    items: Array<{
      __typename: "OperationLog";
      id: string;
      staffId?: string | null;
      action: string;
      resource?: string | null;
      resourceId?: string | null;
      timestamp: string;
      details?: string | null;
      ipAddress?: string | null;
      userAgent?: string | null;
      metadata?: string | null;
      severity?: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetAuditLogQueryVariables = {
  id: string;
};

export type GetAuditLogQuery = {
  getAuditLog?: {
    __typename: "AuditLog";
    id: string;
    resourceType: string;
    resourceId: string;
    action: string;
    actorId: string;
    actorRole?: string | null;
    requestId: string;
    ip?: string | null;
    userAgent?: string | null;
    before?: string | null;
    after?: string | null;
    diff?: string | null;
    createdAt: string;
    ttl?: number | null;
    reason?: string | null;
    updatedAt: string;
  } | null;
};

export type ListAuditLogsQueryVariables = {
  filter?: ModelAuditLogFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListAuditLogsQuery = {
  listAuditLogs?: {
    __typename: "ModelAuditLogConnection";
    items: Array<{
      __typename: "AuditLog";
      id: string;
      resourceType: string;
      resourceId: string;
      action: string;
      actorId: string;
      actorRole?: string | null;
      requestId: string;
      ip?: string | null;
      userAgent?: string | null;
      before?: string | null;
      after?: string | null;
      diff?: string | null;
      createdAt: string;
      ttl?: number | null;
      reason?: string | null;
      updatedAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type GetDailyReportQueryVariables = {
  id: string;
};

export type GetDailyReportQuery = {
  getDailyReport?: {
    __typename: "DailyReport";
    id: string;
    staffId: string;
    reportDate: string;
    title: string;
    content?: string | null;
    status: DailyReportStatus;
    updatedAt?: string | null;
    reactions?: Array<{
      __typename: "DailyReportReaction";
      staffId: string;
      type: DailyReportReactionType;
      createdAt: string;
    } | null> | null;
    comments?: Array<{
      __typename: "DailyReportComment";
      id: string;
      staffId: string;
      authorName?: string | null;
      body: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type ListDailyReportsQueryVariables = {
  filter?: ModelDailyReportFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type ListDailyReportsQuery = {
  listDailyReports?: {
    __typename: "ModelDailyReportConnection";
    items: Array<{
      __typename: "DailyReport";
      id: string;
      staffId: string;
      reportDate: string;
      title: string;
      content?: string | null;
      status: DailyReportStatus;
      updatedAt?: string | null;
      reactions?: Array<{
        __typename: "DailyReportReaction";
        staffId: string;
        type: DailyReportReactionType;
        createdAt: string;
      } | null> | null;
      comments?: Array<{
        __typename: "DailyReportComment";
        id: string;
        staffId: string;
        authorName?: string | null;
        body: string;
        createdAt: string;
      } | null> | null;
      createdAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type DailyReportsByStaffIdQueryVariables = {
  staffId: string;
  reportDate?: ModelStringKeyConditionInput | null;
  sortDirection?: ModelSortDirection | null;
  filter?: ModelDailyReportFilterInput | null;
  limit?: number | null;
  nextToken?: string | null;
};

export type DailyReportsByStaffIdQuery = {
  dailyReportsByStaffId?: {
    __typename: "ModelDailyReportConnection";
    items: Array<{
      __typename: "DailyReport";
      id: string;
      staffId: string;
      reportDate: string;
      title: string;
      content?: string | null;
      status: DailyReportStatus;
      updatedAt?: string | null;
      reactions?: Array<{
        __typename: "DailyReportReaction";
        staffId: string;
        type: DailyReportReactionType;
        createdAt: string;
      } | null> | null;
      comments?: Array<{
        __typename: "DailyReportComment";
        id: string;
        staffId: string;
        authorName?: string | null;
        body: string;
        createdAt: string;
      } | null> | null;
      createdAt: string;
    } | null>;
    nextToken?: string | null;
  } | null;
};

export type OnCreateCheckForUpdateSubscriptionVariables = {
  filter?: ModelSubscriptionCheckForUpdateFilterInput | null;
};

export type OnCreateCheckForUpdateSubscription = {
  onCreateCheckForUpdate?: {
    __typename: "CheckForUpdate";
    id: string;
    deployUuid: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateCheckForUpdateSubscriptionVariables = {
  filter?: ModelSubscriptionCheckForUpdateFilterInput | null;
};

export type OnUpdateCheckForUpdateSubscription = {
  onUpdateCheckForUpdate?: {
    __typename: "CheckForUpdate";
    id: string;
    deployUuid: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteCheckForUpdateSubscriptionVariables = {
  filter?: ModelSubscriptionCheckForUpdateFilterInput | null;
};

export type OnDeleteCheckForUpdateSubscription = {
  onDeleteCheckForUpdate?: {
    __typename: "CheckForUpdate";
    id: string;
    deployUuid: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateAppConfigSubscriptionVariables = {
  filter?: ModelSubscriptionAppConfigFilterInput | null;
};

export type OnCreateAppConfigSubscription = {
  onCreateAppConfig?: {
    __typename: "AppConfig";
    id: string;
    name: string;
    workStartTime?: string | null;
    workEndTime?: string | null;
    lunchRestStartTime?: string | null;
    lunchRestEndTime?: string | null;
    standardWorkHours?: number | null;
    amHolidayStartTime?: string | null;
    amHolidayEndTime?: string | null;
    pmHolidayStartTime?: string | null;
    pmHolidayEndTime?: string | null;
    specialHolidayEnabled?: boolean | null;
    amPmHolidayEnabled?: boolean | null;
    officeMode?: boolean | null;
    attendanceStatisticsEnabled?: boolean | null;
    absentEnabled?: boolean | null;
    hourlyPaidHolidayEnabled?: boolean | null;
    links?: Array<{
      __typename: "Link";
      label: string;
      url: string;
      enabled: boolean;
      icon?: string | null;
    } | null> | null;
    reasons?: Array<{
      __typename: "Reason";
      reason: string;
      enabled: boolean;
    } | null> | null;
    quickInputStartTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    quickInputEndTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    themeColor?: string | null;
    shiftGroups?: Array<{
      __typename: "ShiftGroup";
      label: string;
      description?: string | null;
      min?: number | null;
      max?: number | null;
      fixed?: number | null;
    } | null> | null;
    overTimeCheckEnabled?: boolean | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateAppConfigSubscriptionVariables = {
  filter?: ModelSubscriptionAppConfigFilterInput | null;
};

export type OnUpdateAppConfigSubscription = {
  onUpdateAppConfig?: {
    __typename: "AppConfig";
    id: string;
    name: string;
    workStartTime?: string | null;
    workEndTime?: string | null;
    lunchRestStartTime?: string | null;
    lunchRestEndTime?: string | null;
    standardWorkHours?: number | null;
    amHolidayStartTime?: string | null;
    amHolidayEndTime?: string | null;
    pmHolidayStartTime?: string | null;
    pmHolidayEndTime?: string | null;
    specialHolidayEnabled?: boolean | null;
    amPmHolidayEnabled?: boolean | null;
    officeMode?: boolean | null;
    attendanceStatisticsEnabled?: boolean | null;
    absentEnabled?: boolean | null;
    hourlyPaidHolidayEnabled?: boolean | null;
    links?: Array<{
      __typename: "Link";
      label: string;
      url: string;
      enabled: boolean;
      icon?: string | null;
    } | null> | null;
    reasons?: Array<{
      __typename: "Reason";
      reason: string;
      enabled: boolean;
    } | null> | null;
    quickInputStartTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    quickInputEndTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    themeColor?: string | null;
    shiftGroups?: Array<{
      __typename: "ShiftGroup";
      label: string;
      description?: string | null;
      min?: number | null;
      max?: number | null;
      fixed?: number | null;
    } | null> | null;
    overTimeCheckEnabled?: boolean | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteAppConfigSubscriptionVariables = {
  filter?: ModelSubscriptionAppConfigFilterInput | null;
};

export type OnDeleteAppConfigSubscription = {
  onDeleteAppConfig?: {
    __typename: "AppConfig";
    id: string;
    name: string;
    workStartTime?: string | null;
    workEndTime?: string | null;
    lunchRestStartTime?: string | null;
    lunchRestEndTime?: string | null;
    standardWorkHours?: number | null;
    amHolidayStartTime?: string | null;
    amHolidayEndTime?: string | null;
    pmHolidayStartTime?: string | null;
    pmHolidayEndTime?: string | null;
    specialHolidayEnabled?: boolean | null;
    amPmHolidayEnabled?: boolean | null;
    officeMode?: boolean | null;
    attendanceStatisticsEnabled?: boolean | null;
    absentEnabled?: boolean | null;
    hourlyPaidHolidayEnabled?: boolean | null;
    links?: Array<{
      __typename: "Link";
      label: string;
      url: string;
      enabled: boolean;
      icon?: string | null;
    } | null> | null;
    reasons?: Array<{
      __typename: "Reason";
      reason: string;
      enabled: boolean;
    } | null> | null;
    quickInputStartTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    quickInputEndTimes?: Array<{
      __typename: "QuickInputTime";
      time: string;
      enabled: boolean;
    } | null> | null;
    themeColor?: string | null;
    shiftGroups?: Array<{
      __typename: "ShiftGroup";
      label: string;
      description?: string | null;
      min?: number | null;
      max?: number | null;
      fixed?: number | null;
    } | null> | null;
    overTimeCheckEnabled?: boolean | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateStaffSubscriptionVariables = {
  filter?: ModelSubscriptionStaffFilterInput | null;
};

export type OnCreateStaffSubscription = {
  onCreateStaff?: {
    __typename: "Staff";
    id: string;
    cognitoUserId: string;
    familyName?: string | null;
    givenName?: string | null;
    mailAddress: string;
    role: string;
    enabled: boolean;
    status: string;
    owner?: boolean | null;
    usageStartDate?: string | null;
    notifications?: {
      __typename: "Notification";
      workStart?: boolean | null;
      workEnd?: boolean | null;
    } | null;
    externalLinks?: Array<{
      __typename: "StaffExternalLink";
      label: string;
      url: string;
      enabled: boolean;
      icon: string;
    } | null> | null;
    sortKey?: string | null;
    workType?: string | null;
    developer?: boolean | null;
    approverSetting?: ApproverSettingMode | null;
    approverSingle?: string | null;
    approverMultiple?: Array<string | null> | null;
    approverMultipleMode?: ApproverMultipleMode | null;
    shiftGroup?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateStaffSubscriptionVariables = {
  filter?: ModelSubscriptionStaffFilterInput | null;
};

export type OnUpdateStaffSubscription = {
  onUpdateStaff?: {
    __typename: "Staff";
    id: string;
    cognitoUserId: string;
    familyName?: string | null;
    givenName?: string | null;
    mailAddress: string;
    role: string;
    enabled: boolean;
    status: string;
    owner?: boolean | null;
    usageStartDate?: string | null;
    notifications?: {
      __typename: "Notification";
      workStart?: boolean | null;
      workEnd?: boolean | null;
    } | null;
    externalLinks?: Array<{
      __typename: "StaffExternalLink";
      label: string;
      url: string;
      enabled: boolean;
      icon: string;
    } | null> | null;
    sortKey?: string | null;
    workType?: string | null;
    developer?: boolean | null;
    approverSetting?: ApproverSettingMode | null;
    approverSingle?: string | null;
    approverMultiple?: Array<string | null> | null;
    approverMultipleMode?: ApproverMultipleMode | null;
    shiftGroup?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteStaffSubscriptionVariables = {
  filter?: ModelSubscriptionStaffFilterInput | null;
};

export type OnDeleteStaffSubscription = {
  onDeleteStaff?: {
    __typename: "Staff";
    id: string;
    cognitoUserId: string;
    familyName?: string | null;
    givenName?: string | null;
    mailAddress: string;
    role: string;
    enabled: boolean;
    status: string;
    owner?: boolean | null;
    usageStartDate?: string | null;
    notifications?: {
      __typename: "Notification";
      workStart?: boolean | null;
      workEnd?: boolean | null;
    } | null;
    externalLinks?: Array<{
      __typename: "StaffExternalLink";
      label: string;
      url: string;
      enabled: boolean;
      icon: string;
    } | null> | null;
    sortKey?: string | null;
    workType?: string | null;
    developer?: boolean | null;
    approverSetting?: ApproverSettingMode | null;
    approverSingle?: string | null;
    approverMultiple?: Array<string | null> | null;
    approverMultipleMode?: ApproverMultipleMode | null;
    shiftGroup?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateHolidayCalendarSubscriptionVariables = {
  filter?: ModelSubscriptionHolidayCalendarFilterInput | null;
};

export type OnCreateHolidayCalendarSubscription = {
  onCreateHolidayCalendar?: {
    __typename: "HolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateHolidayCalendarSubscriptionVariables = {
  filter?: ModelSubscriptionHolidayCalendarFilterInput | null;
};

export type OnUpdateHolidayCalendarSubscription = {
  onUpdateHolidayCalendar?: {
    __typename: "HolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteHolidayCalendarSubscriptionVariables = {
  filter?: ModelSubscriptionHolidayCalendarFilterInput | null;
};

export type OnDeleteHolidayCalendarSubscription = {
  onDeleteHolidayCalendar?: {
    __typename: "HolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateCompanyHolidayCalendarSubscriptionVariables = {
  filter?: ModelSubscriptionCompanyHolidayCalendarFilterInput | null;
};

export type OnCreateCompanyHolidayCalendarSubscription = {
  onCreateCompanyHolidayCalendar?: {
    __typename: "CompanyHolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateCompanyHolidayCalendarSubscriptionVariables = {
  filter?: ModelSubscriptionCompanyHolidayCalendarFilterInput | null;
};

export type OnUpdateCompanyHolidayCalendarSubscription = {
  onUpdateCompanyHolidayCalendar?: {
    __typename: "CompanyHolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteCompanyHolidayCalendarSubscriptionVariables = {
  filter?: ModelSubscriptionCompanyHolidayCalendarFilterInput | null;
};

export type OnDeleteCompanyHolidayCalendarSubscription = {
  onDeleteCompanyHolidayCalendar?: {
    __typename: "CompanyHolidayCalendar";
    id: string;
    holidayDate: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateEventCalendarSubscriptionVariables = {
  filter?: ModelSubscriptionEventCalendarFilterInput | null;
};

export type OnCreateEventCalendarSubscription = {
  onCreateEventCalendar?: {
    __typename: "EventCalendar";
    id: string;
    eventDate: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateEventCalendarSubscriptionVariables = {
  filter?: ModelSubscriptionEventCalendarFilterInput | null;
};

export type OnUpdateEventCalendarSubscription = {
  onUpdateEventCalendar?: {
    __typename: "EventCalendar";
    id: string;
    eventDate: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteEventCalendarSubscriptionVariables = {
  filter?: ModelSubscriptionEventCalendarFilterInput | null;
};

export type OnDeleteEventCalendarSubscription = {
  onDeleteEventCalendar?: {
    __typename: "EventCalendar";
    id: string;
    eventDate: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateCloseDateSubscriptionVariables = {
  filter?: ModelSubscriptionCloseDateFilterInput | null;
};

export type OnCreateCloseDateSubscription = {
  onCreateCloseDate?: {
    __typename: "CloseDate";
    id: string;
    closeDate: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateCloseDateSubscriptionVariables = {
  filter?: ModelSubscriptionCloseDateFilterInput | null;
};

export type OnUpdateCloseDateSubscription = {
  onUpdateCloseDate?: {
    __typename: "CloseDate";
    id: string;
    closeDate: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteCloseDateSubscriptionVariables = {
  filter?: ModelSubscriptionCloseDateFilterInput | null;
};

export type OnDeleteCloseDateSubscription = {
  onDeleteCloseDate?: {
    __typename: "CloseDate";
    id: string;
    closeDate: string;
    startDate: string;
    endDate: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateAttendanceSubscriptionVariables = {
  filter?: ModelSubscriptionAttendanceFilterInput | null;
};

export type OnCreateAttendanceSubscription = {
  onCreateAttendance?: {
    __typename: "Attendance";
    id: string;
    staffId: string;
    workDate: string;
    startTime?: string | null;
    endTime?: string | null;
    goDirectlyFlag?: boolean | null;
    returnDirectlyFlag?: boolean | null;
    absentFlag?: boolean | null;
    rests?: Array<{
      __typename: "Rest";
      startTime?: string | null;
      endTime?: string | null;
    } | null> | null;
    hourlyPaidHolidayTimes?: Array<{
      __typename: "HourlyPaidHolidayTime";
      startTime: string;
      endTime: string;
    } | null> | null;
    remarks?: string | null;
    paidHolidayFlag?: boolean | null;
    specialHolidayFlag?: boolean | null;
    isDeemedHoliday?: boolean | null;
    hourlyPaidHolidayHours?: number | null;
    substituteHolidayDate?: string | null;
    histories?: Array<{
      __typename: "AttendanceHistory";
      staffId: string;
      workDate: string;
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      createdAt: string;
    } | null> | null;
    changeRequests?: Array<{
      __typename: "AttendanceChangeRequest";
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      completed?: boolean | null;
      comment?: string | null;
      staffComment?: string | null;
    } | null> | null;
    systemComments?: Array<{
      __typename: "SystemComment";
      comment: string;
      confirmed: boolean;
      createdAt: string;
    } | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateAttendanceSubscriptionVariables = {
  filter?: ModelSubscriptionAttendanceFilterInput | null;
};

export type OnUpdateAttendanceSubscription = {
  onUpdateAttendance?: {
    __typename: "Attendance";
    id: string;
    staffId: string;
    workDate: string;
    startTime?: string | null;
    endTime?: string | null;
    goDirectlyFlag?: boolean | null;
    returnDirectlyFlag?: boolean | null;
    absentFlag?: boolean | null;
    rests?: Array<{
      __typename: "Rest";
      startTime?: string | null;
      endTime?: string | null;
    } | null> | null;
    hourlyPaidHolidayTimes?: Array<{
      __typename: "HourlyPaidHolidayTime";
      startTime: string;
      endTime: string;
    } | null> | null;
    remarks?: string | null;
    paidHolidayFlag?: boolean | null;
    specialHolidayFlag?: boolean | null;
    isDeemedHoliday?: boolean | null;
    hourlyPaidHolidayHours?: number | null;
    substituteHolidayDate?: string | null;
    histories?: Array<{
      __typename: "AttendanceHistory";
      staffId: string;
      workDate: string;
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      createdAt: string;
    } | null> | null;
    changeRequests?: Array<{
      __typename: "AttendanceChangeRequest";
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      completed?: boolean | null;
      comment?: string | null;
      staffComment?: string | null;
    } | null> | null;
    systemComments?: Array<{
      __typename: "SystemComment";
      comment: string;
      confirmed: boolean;
      createdAt: string;
    } | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteAttendanceSubscriptionVariables = {
  filter?: ModelSubscriptionAttendanceFilterInput | null;
};

export type OnDeleteAttendanceSubscription = {
  onDeleteAttendance?: {
    __typename: "Attendance";
    id: string;
    staffId: string;
    workDate: string;
    startTime?: string | null;
    endTime?: string | null;
    goDirectlyFlag?: boolean | null;
    returnDirectlyFlag?: boolean | null;
    absentFlag?: boolean | null;
    rests?: Array<{
      __typename: "Rest";
      startTime?: string | null;
      endTime?: string | null;
    } | null> | null;
    hourlyPaidHolidayTimes?: Array<{
      __typename: "HourlyPaidHolidayTime";
      startTime: string;
      endTime: string;
    } | null> | null;
    remarks?: string | null;
    paidHolidayFlag?: boolean | null;
    specialHolidayFlag?: boolean | null;
    isDeemedHoliday?: boolean | null;
    hourlyPaidHolidayHours?: number | null;
    substituteHolidayDate?: string | null;
    histories?: Array<{
      __typename: "AttendanceHistory";
      staffId: string;
      workDate: string;
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      createdAt: string;
    } | null> | null;
    changeRequests?: Array<{
      __typename: "AttendanceChangeRequest";
      startTime?: string | null;
      endTime?: string | null;
      goDirectlyFlag?: boolean | null;
      absentFlag?: boolean | null;
      returnDirectlyFlag?: boolean | null;
      rests?: Array<{
        __typename: "Rest";
        startTime?: string | null;
        endTime?: string | null;
      } | null> | null;
      hourlyPaidHolidayTimes?: Array<{
        __typename: "HourlyPaidHolidayTime";
        startTime: string;
        endTime: string;
      } | null> | null;
      remarks?: string | null;
      paidHolidayFlag?: boolean | null;
      specialHolidayFlag?: boolean | null;
      hourlyPaidHolidayHours?: number | null;
      substituteHolidayFlag?: boolean | null;
      substituteHolidayDate?: string | null;
      completed?: boolean | null;
      comment?: string | null;
      staffComment?: string | null;
    } | null> | null;
    systemComments?: Array<{
      __typename: "SystemComment";
      comment: string;
      confirmed: boolean;
      createdAt: string;
    } | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateDocumentSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentFilterInput | null;
};

export type OnCreateDocumentSubscription = {
  onCreateDocument?: {
    __typename: "Document";
    id: string;
    title: string;
    content: string;
    tag?: Array<string | null> | null;
    targetRole?: Array<string | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateDocumentSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentFilterInput | null;
};

export type OnUpdateDocumentSubscription = {
  onUpdateDocument?: {
    __typename: "Document";
    id: string;
    title: string;
    content: string;
    tag?: Array<string | null> | null;
    targetRole?: Array<string | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteDocumentSubscriptionVariables = {
  filter?: ModelSubscriptionDocumentFilterInput | null;
};

export type OnDeleteDocumentSubscription = {
  onDeleteDocument?: {
    __typename: "Document";
    id: string;
    title: string;
    content: string;
    tag?: Array<string | null> | null;
    targetRole?: Array<string | null> | null;
    revision?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateShiftRequestSubscriptionVariables = {
  filter?: ModelSubscriptionShiftRequestFilterInput | null;
};

export type OnCreateShiftRequestSubscription = {
  onCreateShiftRequest?: {
    __typename: "ShiftRequest";
    id: string;
    staffId: string;
    targetMonth: string;
    note?: string | null;
    entries?: Array<{
      __typename: "ShiftRequestDayPreference";
      date: string;
      status: ShiftRequestStatus;
      isLocked?: boolean | null;
    } | null> | null;
    summary?: {
      __typename: "ShiftRequestSummary";
      workDays?: number | null;
      fixedOffDays?: number | null;
      requestedOffDays?: number | null;
    } | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
    version?: number | null;
    histories?: Array<{
      __typename: "ShiftRequestHistory";
      version: number;
      note?: string | null;
      entries?: Array<{
        __typename: "ShiftRequestDayPreference";
        date: string;
        status: ShiftRequestStatus;
        isLocked?: boolean | null;
      } | null> | null;
      summary?: {
        __typename: "ShiftRequestSummary";
        workDays?: number | null;
        fixedOffDays?: number | null;
        requestedOffDays?: number | null;
      } | null;
      submittedAt?: string | null;
      updatedAt?: string | null;
      recordedAt: string;
      recordedByStaffId?: string | null;
      changeReason?: string | null;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type OnUpdateShiftRequestSubscriptionVariables = {
  filter?: ModelSubscriptionShiftRequestFilterInput | null;
};

export type OnUpdateShiftRequestSubscription = {
  onUpdateShiftRequest?: {
    __typename: "ShiftRequest";
    id: string;
    staffId: string;
    targetMonth: string;
    note?: string | null;
    entries?: Array<{
      __typename: "ShiftRequestDayPreference";
      date: string;
      status: ShiftRequestStatus;
      isLocked?: boolean | null;
    } | null> | null;
    summary?: {
      __typename: "ShiftRequestSummary";
      workDays?: number | null;
      fixedOffDays?: number | null;
      requestedOffDays?: number | null;
    } | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
    version?: number | null;
    histories?: Array<{
      __typename: "ShiftRequestHistory";
      version: number;
      note?: string | null;
      entries?: Array<{
        __typename: "ShiftRequestDayPreference";
        date: string;
        status: ShiftRequestStatus;
        isLocked?: boolean | null;
      } | null> | null;
      summary?: {
        __typename: "ShiftRequestSummary";
        workDays?: number | null;
        fixedOffDays?: number | null;
        requestedOffDays?: number | null;
      } | null;
      submittedAt?: string | null;
      updatedAt?: string | null;
      recordedAt: string;
      recordedByStaffId?: string | null;
      changeReason?: string | null;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type OnDeleteShiftRequestSubscriptionVariables = {
  filter?: ModelSubscriptionShiftRequestFilterInput | null;
};

export type OnDeleteShiftRequestSubscription = {
  onDeleteShiftRequest?: {
    __typename: "ShiftRequest";
    id: string;
    staffId: string;
    targetMonth: string;
    note?: string | null;
    entries?: Array<{
      __typename: "ShiftRequestDayPreference";
      date: string;
      status: ShiftRequestStatus;
      isLocked?: boolean | null;
    } | null> | null;
    summary?: {
      __typename: "ShiftRequestSummary";
      workDays?: number | null;
      fixedOffDays?: number | null;
      requestedOffDays?: number | null;
    } | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
    version?: number | null;
    histories?: Array<{
      __typename: "ShiftRequestHistory";
      version: number;
      note?: string | null;
      entries?: Array<{
        __typename: "ShiftRequestDayPreference";
        date: string;
        status: ShiftRequestStatus;
        isLocked?: boolean | null;
      } | null> | null;
      summary?: {
        __typename: "ShiftRequestSummary";
        workDays?: number | null;
        fixedOffDays?: number | null;
        requestedOffDays?: number | null;
      } | null;
      submittedAt?: string | null;
      updatedAt?: string | null;
      recordedAt: string;
      recordedByStaffId?: string | null;
      changeReason?: string | null;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type OnCreateShiftPlanYearSubscriptionVariables = {
  filter?: ModelSubscriptionShiftPlanYearFilterInput | null;
};

export type OnCreateShiftPlanYearSubscription = {
  onCreateShiftPlanYear?: {
    __typename: "ShiftPlanYear";
    id: string;
    targetYear: number;
    plans?: Array<{
      __typename: "ShiftPlanMonthSetting";
      month: number;
      editStart?: string | null;
      editEnd?: string | null;
      enabled?: boolean | null;
      dailyCapacities?: Array<number | null> | null;
    } | null> | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateShiftPlanYearSubscriptionVariables = {
  filter?: ModelSubscriptionShiftPlanYearFilterInput | null;
};

export type OnUpdateShiftPlanYearSubscription = {
  onUpdateShiftPlanYear?: {
    __typename: "ShiftPlanYear";
    id: string;
    targetYear: number;
    plans?: Array<{
      __typename: "ShiftPlanMonthSetting";
      month: number;
      editStart?: string | null;
      editEnd?: string | null;
      enabled?: boolean | null;
      dailyCapacities?: Array<number | null> | null;
    } | null> | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteShiftPlanYearSubscriptionVariables = {
  filter?: ModelSubscriptionShiftPlanYearFilterInput | null;
};

export type OnDeleteShiftPlanYearSubscription = {
  onDeleteShiftPlanYear?: {
    __typename: "ShiftPlanYear";
    id: string;
    targetYear: number;
    plans?: Array<{
      __typename: "ShiftPlanMonthSetting";
      month: number;
      editStart?: string | null;
      editEnd?: string | null;
      enabled?: boolean | null;
      dailyCapacities?: Array<number | null> | null;
    } | null> | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateWorkflowSubscriptionVariables = {
  filter?: ModelSubscriptionWorkflowFilterInput | null;
};

export type OnCreateWorkflowSubscription = {
  onCreateWorkflow?: {
    __typename: "Workflow";
    id: string;
    approvedStaffIds?: Array<string | null> | null;
    rejectedStaffIds?: Array<string | null> | null;
    finalDecisionTimestamp?: string | null;
    category?: WorkflowCategory | null;
    staffId: string;
    status: WorkflowStatus;
    assignedApproverStaffIds?: Array<string | null> | null;
    approvalSteps?: Array<{
      __typename: "ApprovalStep";
      id: string;
      approverStaffId: string;
      decisionStatus: ApprovalStatus;
      approverComment?: string | null;
      decisionTimestamp?: string | null;
      stepOrder?: number | null;
    } | null> | null;
    nextApprovalStepIndex?: number | null;
    submitterApproverSetting?: ApproverSettingMode | null;
    submitterApproverId?: string | null;
    submitterApproverIds?: Array<string | null> | null;
    submitterApproverMultipleMode?: ApproverMultipleMode | null;
    overTimeDetails?: {
      __typename: "OverTimeWorkflow";
      date: string;
      startTime: string;
      endTime: string;
      reason: string;
    } | null;
    comments?: Array<{
      __typename: "WorkflowComment";
      id: string;
      staffId: string;
      text: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateWorkflowSubscriptionVariables = {
  filter?: ModelSubscriptionWorkflowFilterInput | null;
};

export type OnUpdateWorkflowSubscription = {
  onUpdateWorkflow?: {
    __typename: "Workflow";
    id: string;
    approvedStaffIds?: Array<string | null> | null;
    rejectedStaffIds?: Array<string | null> | null;
    finalDecisionTimestamp?: string | null;
    category?: WorkflowCategory | null;
    staffId: string;
    status: WorkflowStatus;
    assignedApproverStaffIds?: Array<string | null> | null;
    approvalSteps?: Array<{
      __typename: "ApprovalStep";
      id: string;
      approverStaffId: string;
      decisionStatus: ApprovalStatus;
      approverComment?: string | null;
      decisionTimestamp?: string | null;
      stepOrder?: number | null;
    } | null> | null;
    nextApprovalStepIndex?: number | null;
    submitterApproverSetting?: ApproverSettingMode | null;
    submitterApproverId?: string | null;
    submitterApproverIds?: Array<string | null> | null;
    submitterApproverMultipleMode?: ApproverMultipleMode | null;
    overTimeDetails?: {
      __typename: "OverTimeWorkflow";
      date: string;
      startTime: string;
      endTime: string;
      reason: string;
    } | null;
    comments?: Array<{
      __typename: "WorkflowComment";
      id: string;
      staffId: string;
      text: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteWorkflowSubscriptionVariables = {
  filter?: ModelSubscriptionWorkflowFilterInput | null;
};

export type OnDeleteWorkflowSubscription = {
  onDeleteWorkflow?: {
    __typename: "Workflow";
    id: string;
    approvedStaffIds?: Array<string | null> | null;
    rejectedStaffIds?: Array<string | null> | null;
    finalDecisionTimestamp?: string | null;
    category?: WorkflowCategory | null;
    staffId: string;
    status: WorkflowStatus;
    assignedApproverStaffIds?: Array<string | null> | null;
    approvalSteps?: Array<{
      __typename: "ApprovalStep";
      id: string;
      approverStaffId: string;
      decisionStatus: ApprovalStatus;
      approverComment?: string | null;
      decisionTimestamp?: string | null;
      stepOrder?: number | null;
    } | null> | null;
    nextApprovalStepIndex?: number | null;
    submitterApproverSetting?: ApproverSettingMode | null;
    submitterApproverId?: string | null;
    submitterApproverIds?: Array<string | null> | null;
    submitterApproverMultipleMode?: ApproverMultipleMode | null;
    overTimeDetails?: {
      __typename: "OverTimeWorkflow";
      date: string;
      startTime: string;
      endTime: string;
      reason: string;
    } | null;
    comments?: Array<{
      __typename: "WorkflowComment";
      id: string;
      staffId: string;
      text: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateOperationLogSubscriptionVariables = {
  filter?: ModelSubscriptionOperationLogFilterInput | null;
};

export type OnCreateOperationLogSubscription = {
  onCreateOperationLog?: {
    __typename: "OperationLog";
    id: string;
    staffId?: string | null;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    timestamp: string;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: string | null;
    severity?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnUpdateOperationLogSubscriptionVariables = {
  filter?: ModelSubscriptionOperationLogFilterInput | null;
};

export type OnUpdateOperationLogSubscription = {
  onUpdateOperationLog?: {
    __typename: "OperationLog";
    id: string;
    staffId?: string | null;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    timestamp: string;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: string | null;
    severity?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnDeleteOperationLogSubscriptionVariables = {
  filter?: ModelSubscriptionOperationLogFilterInput | null;
};

export type OnDeleteOperationLogSubscription = {
  onDeleteOperationLog?: {
    __typename: "OperationLog";
    id: string;
    staffId?: string | null;
    action: string;
    resource?: string | null;
    resourceId?: string | null;
    timestamp: string;
    details?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: string | null;
    severity?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export type OnCreateAuditLogSubscriptionVariables = {
  filter?: ModelSubscriptionAuditLogFilterInput | null;
};

export type OnCreateAuditLogSubscription = {
  onCreateAuditLog?: {
    __typename: "AuditLog";
    id: string;
    resourceType: string;
    resourceId: string;
    action: string;
    actorId: string;
    actorRole?: string | null;
    requestId: string;
    ip?: string | null;
    userAgent?: string | null;
    before?: string | null;
    after?: string | null;
    diff?: string | null;
    createdAt: string;
    ttl?: number | null;
    reason?: string | null;
    updatedAt: string;
  } | null;
};

export type OnUpdateAuditLogSubscriptionVariables = {
  filter?: ModelSubscriptionAuditLogFilterInput | null;
};

export type OnUpdateAuditLogSubscription = {
  onUpdateAuditLog?: {
    __typename: "AuditLog";
    id: string;
    resourceType: string;
    resourceId: string;
    action: string;
    actorId: string;
    actorRole?: string | null;
    requestId: string;
    ip?: string | null;
    userAgent?: string | null;
    before?: string | null;
    after?: string | null;
    diff?: string | null;
    createdAt: string;
    ttl?: number | null;
    reason?: string | null;
    updatedAt: string;
  } | null;
};

export type OnDeleteAuditLogSubscriptionVariables = {
  filter?: ModelSubscriptionAuditLogFilterInput | null;
};

export type OnDeleteAuditLogSubscription = {
  onDeleteAuditLog?: {
    __typename: "AuditLog";
    id: string;
    resourceType: string;
    resourceId: string;
    action: string;
    actorId: string;
    actorRole?: string | null;
    requestId: string;
    ip?: string | null;
    userAgent?: string | null;
    before?: string | null;
    after?: string | null;
    diff?: string | null;
    createdAt: string;
    ttl?: number | null;
    reason?: string | null;
    updatedAt: string;
  } | null;
};

export type OnCreateDailyReportSubscriptionVariables = {
  filter?: ModelSubscriptionDailyReportFilterInput | null;
};

export type OnCreateDailyReportSubscription = {
  onCreateDailyReport?: {
    __typename: "DailyReport";
    id: string;
    staffId: string;
    reportDate: string;
    title: string;
    content?: string | null;
    status: DailyReportStatus;
    updatedAt?: string | null;
    reactions?: Array<{
      __typename: "DailyReportReaction";
      staffId: string;
      type: DailyReportReactionType;
      createdAt: string;
    } | null> | null;
    comments?: Array<{
      __typename: "DailyReportComment";
      id: string;
      staffId: string;
      authorName?: string | null;
      body: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type OnUpdateDailyReportSubscriptionVariables = {
  filter?: ModelSubscriptionDailyReportFilterInput | null;
};

export type OnUpdateDailyReportSubscription = {
  onUpdateDailyReport?: {
    __typename: "DailyReport";
    id: string;
    staffId: string;
    reportDate: string;
    title: string;
    content?: string | null;
    status: DailyReportStatus;
    updatedAt?: string | null;
    reactions?: Array<{
      __typename: "DailyReportReaction";
      staffId: string;
      type: DailyReportReactionType;
      createdAt: string;
    } | null> | null;
    comments?: Array<{
      __typename: "DailyReportComment";
      id: string;
      staffId: string;
      authorName?: string | null;
      body: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
  } | null;
};

export type OnDeleteDailyReportSubscriptionVariables = {
  filter?: ModelSubscriptionDailyReportFilterInput | null;
};

export type OnDeleteDailyReportSubscription = {
  onDeleteDailyReport?: {
    __typename: "DailyReport";
    id: string;
    staffId: string;
    reportDate: string;
    title: string;
    content?: string | null;
    status: DailyReportStatus;
    updatedAt?: string | null;
    reactions?: Array<{
      __typename: "DailyReportReaction";
      staffId: string;
      type: DailyReportReactionType;
      createdAt: string;
    } | null> | null;
    comments?: Array<{
      __typename: "DailyReportComment";
      id: string;
      staffId: string;
      authorName?: string | null;
      body: string;
      createdAt: string;
    } | null> | null;
    createdAt: string;
  } | null;
};
