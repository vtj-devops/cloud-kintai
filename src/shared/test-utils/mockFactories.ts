import type {
  AppConfigContextProps,
  AppConfigDerived,
} from "@entities/app-config/model/AppConfigContext";
import { FALLBACK_DERIVED } from "@entities/app-config/model/AppConfigContext";
import type { CognitoUser } from "@entities/staff/model/useCognitoUser";
import type { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import type {
  Attendance,
  AttendanceChangeRequest,
  DailyReport,
  ShiftRequest,
  Workflow,
} from "@shared/api/graphql/types";
import {
  ApprovalStatus,
  DailyReportStatus,
  ShiftRequestStatus,
  WorkflowCategory,
  WorkflowStatus,
} from "@shared/api/graphql/types";

export function createMockAppConfig(
  overrides?: Partial<AppConfigContextProps>,
): AppConfigContextProps {
  const derived: AppConfigDerived = {
    ...FALLBACK_DERIVED,
    ...overrides?.derived,
  };

  return {
    config: null,
    derived,
    loading: false,
    isLoading: false,
    isConfigLoading: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    save: jest.fn().mockResolvedValue(undefined),
    fetchConfig: jest.fn().mockResolvedValue(undefined),
    saveConfig: jest.fn().mockResolvedValue(undefined),
    getConfigId: jest.fn().mockReturnValue(derived.configId),
    getStartTime: jest.fn().mockReturnValue(derived.startTime),
    getEndTime: jest.fn().mockReturnValue(derived.endTime),
    getLunchRestStartTime: jest.fn().mockReturnValue(derived.lunchRestStartTime),
    getLunchRestEndTime: jest.fn().mockReturnValue(derived.lunchRestEndTime),
    getStandardWorkHours: jest.fn().mockReturnValue(derived.standardWorkHours),
    getLinks: jest.fn().mockReturnValue(derived.links),
    getReasons: jest.fn().mockReturnValue(derived.reasons),
    getOfficeMode: jest.fn().mockReturnValue(derived.officeMode),
    getAttendanceStatisticsEnabled: jest
      .fn()
      .mockReturnValue(derived.attendanceStatisticsEnabled),
    getWorkflowNotificationEnabled: jest
      .fn()
      .mockReturnValue(derived.workflowNotificationEnabled),
    getTimeRecorderAnnouncement: jest
      .fn()
      .mockReturnValue(derived.timeRecorderAnnouncement),
    getShiftCollaborativeEnabled: jest
      .fn()
      .mockReturnValue(derived.shiftCollaborativeEnabled),
    getShiftDefaultMode: jest.fn().mockReturnValue(derived.shiftDefaultMode),
    getQuickInputStartTimes: jest
      .fn()
      .mockReturnValue(derived.quickInputStartTimes),
    getQuickInputEndTimes: jest
      .fn()
      .mockReturnValue(derived.quickInputEndTimes),
    getShiftGroups: jest.fn().mockReturnValue(derived.shiftGroups),
    getHourlyPaidHolidayEnabled: jest
      .fn()
      .mockReturnValue(derived.hourlyPaidHolidayEnabled),
    getAmHolidayStartTime: jest
      .fn()
      .mockReturnValue(derived.amHolidayStartTime),
    getAmHolidayEndTime: jest.fn().mockReturnValue(derived.amHolidayEndTime),
    getPmHolidayStartTime: jest
      .fn()
      .mockReturnValue(derived.pmHolidayStartTime),
    getPmHolidayEndTime: jest.fn().mockReturnValue(derived.pmHolidayEndTime),
    getAmPmHolidayEnabled: jest
      .fn()
      .mockReturnValue(derived.amPmHolidayEnabled),
    getSpecialHolidayEnabled: jest
      .fn()
      .mockReturnValue(derived.specialHolidayEnabled),
    getAbsentEnabled: jest.fn().mockReturnValue(derived.absentEnabled),
    getOverTimeCheckEnabled: jest
      .fn()
      .mockReturnValue(derived.overTimeCheckEnabled),
    getWorkflowCategoryOrder: jest
      .fn()
      .mockReturnValue(derived.workflowCategoryOrder),
    getThemeColor: jest.fn().mockReturnValue(derived.themeColor),
    getThemeTokens: jest.fn().mockReturnValue(derived.themeTokens),
    ...overrides,
  };
}

export function createMockUser(overrides?: Partial<CognitoUser>): CognitoUser {
  return {
    id: "mock-user-id",
    givenName: "太郎",
    familyName: "テスト",
    mailAddress: "test.taro@example.com",
    owner: false,
    roles: [StaffRole.STAFF],
    emailVerified: true,
    ...overrides,
  };
}

export function createMockAttendance(
  overrides?: Partial<Attendance>,
): Attendance {
  return {
    __typename: "Attendance",
    id: "mock-attendance-id",
    staffId: "mock-staff-id",
    staffWorkDateKey: "mock-staff-id#20240101",
    workDate: "20240101",
    startTime: "09:00",
    endTime: "18:00",
    goDirectlyFlag: false,
    returnDirectlyFlag: false,
    absentFlag: false,
    rests: [],
    hourlyPaidHolidayTimes: [],
    remarks: null,
    paidHolidayFlag: false,
    specialHolidayFlag: false,
    isDeemedHoliday: false,
    hourlyPaidHolidayHours: null,
    substituteHolidayDate: null,
    histories: [],
    changeRequests: [],
    systemComments: [],
    revision: 1,
    createdAt: "2024-01-01T09:00:00.000Z",
    updatedAt: "2024-01-01T18:00:00.000Z",
    ...overrides,
  };
}

export function createMockStaff(overrides?: Partial<StaffType>): StaffType {
  return {
    id: "mock-staff-id",
    cognitoUserId: "mock-user-id",
    familyName: "テスト",
    givenName: "太郎",
    mailAddress: "test.taro@example.com",
    owner: false,
    role: StaffRole.STAFF,
    enabled: true,
    status: "active",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    version: 1,
    usageStartDate: null,
    notifications: null,
    externalLinks: null,
    sortKey: null,
    workType: null,
    developer: false,
    approverSetting: null,
    approverSingle: null,
    approverMultiple: null,
    approverMultipleMode: null,
    shiftGroup: null,
    attendanceManagementEnabled: true,
    ...overrides,
  };
}

export function createMockChangeRequest(
  overrides?: Partial<AttendanceChangeRequest>,
): AttendanceChangeRequest {
  return {
    __typename: "AttendanceChangeRequest",
    startTime: "09:00",
    endTime: "18:00",
    goDirectlyFlag: false,
    returnDirectlyFlag: false,
    absentFlag: false,
    rests: [],
    hourlyPaidHolidayTimes: [],
    remarks: null,
    paidHolidayFlag: false,
    specialHolidayFlag: false,
    hourlyPaidHolidayHours: null,
    substituteHolidayFlag: null,
    substituteHolidayDate: null,
    completed: false,
    comment: null,
    staffComment: null,
    ...overrides,
  };
}

export function createMockShiftRequest(
  overrides?: Partial<ShiftRequest>,
): ShiftRequest {
  return {
    __typename: "ShiftRequest",
    id: "mock-shift-request-id",
    staffId: "mock-staff-id",
    targetMonth: "2024-01",
    note: null,
    entries: [
      {
        __typename: "ShiftRequestDayPreference",
        date: "2024-01-01",
        status: ShiftRequestStatus.WORK,
        isLocked: null,
      },
    ],
    summary: null,
    submittedAt: null,
    updatedAt: "2024-01-01T00:00:00.000Z",
    updatedBy: null,
    version: 1,
    histories: [],
    comments: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function createMockWorkflow(overrides?: Partial<Workflow>): Workflow {
  return {
    __typename: "Workflow",
    id: "mock-workflow-id",
    staffId: "mock-staff-id",
    status: WorkflowStatus.SUBMITTED,
    category: WorkflowCategory.CLOCK_CORRECTION,
    customWorkflowTitle: null,
    customWorkflowContent: null,
    approvedStaffIds: [],
    rejectedStaffIds: [],
    finalDecisionTimestamp: null,
    assignedApproverStaffIds: [],
    approvalSteps: [
      {
        __typename: "ApprovalStep",
        id: "mock-step-id",
        approverStaffId: "mock-approver-id",
        decisionStatus: ApprovalStatus.PENDING,
        approverComment: null,
        decisionTimestamp: null,
        stepOrder: 0,
      },
    ],
    nextApprovalStepIndex: 0,
    submitterApproverSetting: null,
    submitterApproverId: null,
    submitterApproverIds: null,
    submitterApproverMultipleMode: null,
    overTimeDetails: null,
    comments: [],
    version: 1,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function createMockDailyReport(
  overrides?: Partial<DailyReport>,
): DailyReport {
  return {
    __typename: "DailyReport",
    id: "mock-daily-report-id",
    staffId: "mock-staff-id",
    reportDate: "2024-01-01",
    title: "テスト日報",
    content: "テスト内容",
    status: DailyReportStatus.SUBMITTED,
    updatedAt: "2024-01-01T18:00:00.000Z",
    reactions: [],
    comments: [],
    version: 1,
    createdAt: "2024-01-01T09:00:00.000Z",
    ...overrides,
  };
}
