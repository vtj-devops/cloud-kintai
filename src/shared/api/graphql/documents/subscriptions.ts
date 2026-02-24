/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../types";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateCheckForUpdate = /* GraphQL */ `subscription OnCreateCheckForUpdate(
  $filter: ModelSubscriptionCheckForUpdateFilterInput
) {
  onCreateCheckForUpdate(filter: $filter) {
    id
    deployUuid
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateCheckForUpdateSubscriptionVariables,
  APITypes.OnCreateCheckForUpdateSubscription
>;
export const onUpdateCheckForUpdate = /* GraphQL */ `subscription OnUpdateCheckForUpdate(
  $filter: ModelSubscriptionCheckForUpdateFilterInput
) {
  onUpdateCheckForUpdate(filter: $filter) {
    id
    deployUuid
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateCheckForUpdateSubscriptionVariables,
  APITypes.OnUpdateCheckForUpdateSubscription
>;
export const onDeleteCheckForUpdate = /* GraphQL */ `subscription OnDeleteCheckForUpdate(
  $filter: ModelSubscriptionCheckForUpdateFilterInput
) {
  onDeleteCheckForUpdate(filter: $filter) {
    id
    deployUuid
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteCheckForUpdateSubscriptionVariables,
  APITypes.OnDeleteCheckForUpdateSubscription
>;
export const onCreateAppConfig = /* GraphQL */ `subscription OnCreateAppConfig($filter: ModelSubscriptionAppConfigFilterInput) {
  onCreateAppConfig(filter: $filter) {
    id
    name
    workStartTime
    workEndTime
    lunchRestStartTime
    lunchRestEndTime
    standardWorkHours
    amHolidayStartTime
    amHolidayEndTime
    pmHolidayStartTime
    pmHolidayEndTime
    specialHolidayEnabled
    amPmHolidayEnabled
    officeMode
    attendanceStatisticsEnabled
    absentEnabled
    hourlyPaidHolidayEnabled
    links {
      label
      url
      enabled
      icon
      __typename
    }
    reasons {
      reason
      enabled
      __typename
    }
    quickInputStartTimes {
      time
      enabled
      __typename
    }
    quickInputEndTimes {
      time
      enabled
      __typename
    }
    themeColor
    shiftGroups {
      label
      description
      min
      max
      fixed
      __typename
    }
    overTimeCheckEnabled
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAppConfigSubscriptionVariables,
  APITypes.OnCreateAppConfigSubscription
>;
export const onUpdateAppConfig = /* GraphQL */ `subscription OnUpdateAppConfig($filter: ModelSubscriptionAppConfigFilterInput) {
  onUpdateAppConfig(filter: $filter) {
    id
    name
    workStartTime
    workEndTime
    lunchRestStartTime
    lunchRestEndTime
    standardWorkHours
    amHolidayStartTime
    amHolidayEndTime
    pmHolidayStartTime
    pmHolidayEndTime
    specialHolidayEnabled
    amPmHolidayEnabled
    officeMode
    attendanceStatisticsEnabled
    absentEnabled
    hourlyPaidHolidayEnabled
    links {
      label
      url
      enabled
      icon
      __typename
    }
    reasons {
      reason
      enabled
      __typename
    }
    quickInputStartTimes {
      time
      enabled
      __typename
    }
    quickInputEndTimes {
      time
      enabled
      __typename
    }
    themeColor
    shiftGroups {
      label
      description
      min
      max
      fixed
      __typename
    }
    overTimeCheckEnabled
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAppConfigSubscriptionVariables,
  APITypes.OnUpdateAppConfigSubscription
>;
export const onDeleteAppConfig = /* GraphQL */ `subscription OnDeleteAppConfig($filter: ModelSubscriptionAppConfigFilterInput) {
  onDeleteAppConfig(filter: $filter) {
    id
    name
    workStartTime
    workEndTime
    lunchRestStartTime
    lunchRestEndTime
    standardWorkHours
    amHolidayStartTime
    amHolidayEndTime
    pmHolidayStartTime
    pmHolidayEndTime
    specialHolidayEnabled
    amPmHolidayEnabled
    officeMode
    attendanceStatisticsEnabled
    absentEnabled
    hourlyPaidHolidayEnabled
    links {
      label
      url
      enabled
      icon
      __typename
    }
    reasons {
      reason
      enabled
      __typename
    }
    quickInputStartTimes {
      time
      enabled
      __typename
    }
    quickInputEndTimes {
      time
      enabled
      __typename
    }
    themeColor
    shiftGroups {
      label
      description
      min
      max
      fixed
      __typename
    }
    overTimeCheckEnabled
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAppConfigSubscriptionVariables,
  APITypes.OnDeleteAppConfigSubscription
>;
export const onCreateStaff = /* GraphQL */ `subscription OnCreateStaff($filter: ModelSubscriptionStaffFilterInput) {
  onCreateStaff(filter: $filter) {
    id
    cognitoUserId
    familyName
    givenName
    mailAddress
    role
    enabled
    status
    owner
    usageStartDate
    notifications {
      workStart
      workEnd
      __typename
    }
    externalLinks {
      label
      url
      enabled
      icon
      __typename
    }
    sortKey
    workType
    developer
    approverSetting
    approverSingle
    approverMultiple
    approverMultipleMode
    shiftGroup
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateStaffSubscriptionVariables,
  APITypes.OnCreateStaffSubscription
>;
export const onUpdateStaff = /* GraphQL */ `subscription OnUpdateStaff($filter: ModelSubscriptionStaffFilterInput) {
  onUpdateStaff(filter: $filter) {
    id
    cognitoUserId
    familyName
    givenName
    mailAddress
    role
    enabled
    status
    owner
    usageStartDate
    notifications {
      workStart
      workEnd
      __typename
    }
    externalLinks {
      label
      url
      enabled
      icon
      __typename
    }
    sortKey
    workType
    developer
    approverSetting
    approverSingle
    approverMultiple
    approverMultipleMode
    shiftGroup
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateStaffSubscriptionVariables,
  APITypes.OnUpdateStaffSubscription
>;
export const onDeleteStaff = /* GraphQL */ `subscription OnDeleteStaff($filter: ModelSubscriptionStaffFilterInput) {
  onDeleteStaff(filter: $filter) {
    id
    cognitoUserId
    familyName
    givenName
    mailAddress
    role
    enabled
    status
    owner
    usageStartDate
    notifications {
      workStart
      workEnd
      __typename
    }
    externalLinks {
      label
      url
      enabled
      icon
      __typename
    }
    sortKey
    workType
    developer
    approverSetting
    approverSingle
    approverMultiple
    approverMultipleMode
    shiftGroup
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteStaffSubscriptionVariables,
  APITypes.OnDeleteStaffSubscription
>;
export const onCreateHolidayCalendar = /* GraphQL */ `subscription OnCreateHolidayCalendar(
  $filter: ModelSubscriptionHolidayCalendarFilterInput
) {
  onCreateHolidayCalendar(filter: $filter) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateHolidayCalendarSubscriptionVariables,
  APITypes.OnCreateHolidayCalendarSubscription
>;
export const onUpdateHolidayCalendar = /* GraphQL */ `subscription OnUpdateHolidayCalendar(
  $filter: ModelSubscriptionHolidayCalendarFilterInput
) {
  onUpdateHolidayCalendar(filter: $filter) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateHolidayCalendarSubscriptionVariables,
  APITypes.OnUpdateHolidayCalendarSubscription
>;
export const onDeleteHolidayCalendar = /* GraphQL */ `subscription OnDeleteHolidayCalendar(
  $filter: ModelSubscriptionHolidayCalendarFilterInput
) {
  onDeleteHolidayCalendar(filter: $filter) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteHolidayCalendarSubscriptionVariables,
  APITypes.OnDeleteHolidayCalendarSubscription
>;
export const onCreateCompanyHolidayCalendar = /* GraphQL */ `subscription OnCreateCompanyHolidayCalendar(
  $filter: ModelSubscriptionCompanyHolidayCalendarFilterInput
) {
  onCreateCompanyHolidayCalendar(filter: $filter) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateCompanyHolidayCalendarSubscriptionVariables,
  APITypes.OnCreateCompanyHolidayCalendarSubscription
>;
export const onUpdateCompanyHolidayCalendar = /* GraphQL */ `subscription OnUpdateCompanyHolidayCalendar(
  $filter: ModelSubscriptionCompanyHolidayCalendarFilterInput
) {
  onUpdateCompanyHolidayCalendar(filter: $filter) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateCompanyHolidayCalendarSubscriptionVariables,
  APITypes.OnUpdateCompanyHolidayCalendarSubscription
>;
export const onDeleteCompanyHolidayCalendar = /* GraphQL */ `subscription OnDeleteCompanyHolidayCalendar(
  $filter: ModelSubscriptionCompanyHolidayCalendarFilterInput
) {
  onDeleteCompanyHolidayCalendar(filter: $filter) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteCompanyHolidayCalendarSubscriptionVariables,
  APITypes.OnDeleteCompanyHolidayCalendarSubscription
>;
export const onCreateEventCalendar = /* GraphQL */ `subscription OnCreateEventCalendar(
  $filter: ModelSubscriptionEventCalendarFilterInput
) {
  onCreateEventCalendar(filter: $filter) {
    id
    eventDate
    name
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateEventCalendarSubscriptionVariables,
  APITypes.OnCreateEventCalendarSubscription
>;
export const onUpdateEventCalendar = /* GraphQL */ `subscription OnUpdateEventCalendar(
  $filter: ModelSubscriptionEventCalendarFilterInput
) {
  onUpdateEventCalendar(filter: $filter) {
    id
    eventDate
    name
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateEventCalendarSubscriptionVariables,
  APITypes.OnUpdateEventCalendarSubscription
>;
export const onDeleteEventCalendar = /* GraphQL */ `subscription OnDeleteEventCalendar(
  $filter: ModelSubscriptionEventCalendarFilterInput
) {
  onDeleteEventCalendar(filter: $filter) {
    id
    eventDate
    name
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteEventCalendarSubscriptionVariables,
  APITypes.OnDeleteEventCalendarSubscription
>;
export const onCreateCloseDate = /* GraphQL */ `subscription OnCreateCloseDate($filter: ModelSubscriptionCloseDateFilterInput) {
  onCreateCloseDate(filter: $filter) {
    id
    closeDate
    startDate
    endDate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateCloseDateSubscriptionVariables,
  APITypes.OnCreateCloseDateSubscription
>;
export const onUpdateCloseDate = /* GraphQL */ `subscription OnUpdateCloseDate($filter: ModelSubscriptionCloseDateFilterInput) {
  onUpdateCloseDate(filter: $filter) {
    id
    closeDate
    startDate
    endDate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateCloseDateSubscriptionVariables,
  APITypes.OnUpdateCloseDateSubscription
>;
export const onDeleteCloseDate = /* GraphQL */ `subscription OnDeleteCloseDate($filter: ModelSubscriptionCloseDateFilterInput) {
  onDeleteCloseDate(filter: $filter) {
    id
    closeDate
    startDate
    endDate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteCloseDateSubscriptionVariables,
  APITypes.OnDeleteCloseDateSubscription
>;
export const onCreateAttendance = /* GraphQL */ `subscription OnCreateAttendance(
  $filter: ModelSubscriptionAttendanceFilterInput
) {
  onCreateAttendance(filter: $filter) {
    id
    staffId
    workDate
    startTime
    endTime
    goDirectlyFlag
    returnDirectlyFlag
    absentFlag
    rests {
      startTime
      endTime
      __typename
    }
    hourlyPaidHolidayTimes {
      startTime
      endTime
      __typename
    }
    remarks
    paidHolidayFlag
    specialHolidayFlag
    isDeemedHoliday
    hourlyPaidHolidayHours
    substituteHolidayDate
    histories {
      staffId
      workDate
      startTime
      endTime
      goDirectlyFlag
      absentFlag
      returnDirectlyFlag
      rests {
        startTime
        endTime
        __typename
      }
      hourlyPaidHolidayTimes {
        startTime
        endTime
        __typename
      }
      remarks
      paidHolidayFlag
      specialHolidayFlag
      hourlyPaidHolidayHours
      substituteHolidayFlag
      substituteHolidayDate
      createdAt
      __typename
    }
    changeRequests {
      startTime
      endTime
      goDirectlyFlag
      absentFlag
      returnDirectlyFlag
      rests {
        startTime
        endTime
        __typename
      }
      hourlyPaidHolidayTimes {
        startTime
        endTime
        __typename
      }
      remarks
      paidHolidayFlag
      specialHolidayFlag
      hourlyPaidHolidayHours
      substituteHolidayFlag
      substituteHolidayDate
      completed
      comment
      staffComment
      __typename
    }
    systemComments {
      comment
      confirmed
      createdAt
      __typename
    }
    revision
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAttendanceSubscriptionVariables,
  APITypes.OnCreateAttendanceSubscription
>;
export const onUpdateAttendance = /* GraphQL */ `subscription OnUpdateAttendance(
  $filter: ModelSubscriptionAttendanceFilterInput
) {
  onUpdateAttendance(filter: $filter) {
    id
    staffId
    workDate
    startTime
    endTime
    goDirectlyFlag
    returnDirectlyFlag
    absentFlag
    rests {
      startTime
      endTime
      __typename
    }
    hourlyPaidHolidayTimes {
      startTime
      endTime
      __typename
    }
    remarks
    paidHolidayFlag
    specialHolidayFlag
    isDeemedHoliday
    hourlyPaidHolidayHours
    substituteHolidayDate
    histories {
      staffId
      workDate
      startTime
      endTime
      goDirectlyFlag
      absentFlag
      returnDirectlyFlag
      rests {
        startTime
        endTime
        __typename
      }
      hourlyPaidHolidayTimes {
        startTime
        endTime
        __typename
      }
      remarks
      paidHolidayFlag
      specialHolidayFlag
      hourlyPaidHolidayHours
      substituteHolidayFlag
      substituteHolidayDate
      createdAt
      __typename
    }
    changeRequests {
      startTime
      endTime
      goDirectlyFlag
      absentFlag
      returnDirectlyFlag
      rests {
        startTime
        endTime
        __typename
      }
      hourlyPaidHolidayTimes {
        startTime
        endTime
        __typename
      }
      remarks
      paidHolidayFlag
      specialHolidayFlag
      hourlyPaidHolidayHours
      substituteHolidayFlag
      substituteHolidayDate
      completed
      comment
      staffComment
      __typename
    }
    systemComments {
      comment
      confirmed
      createdAt
      __typename
    }
    revision
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAttendanceSubscriptionVariables,
  APITypes.OnUpdateAttendanceSubscription
>;
export const onDeleteAttendance = /* GraphQL */ `subscription OnDeleteAttendance(
  $filter: ModelSubscriptionAttendanceFilterInput
) {
  onDeleteAttendance(filter: $filter) {
    id
    staffId
    workDate
    startTime
    endTime
    goDirectlyFlag
    returnDirectlyFlag
    absentFlag
    rests {
      startTime
      endTime
      __typename
    }
    hourlyPaidHolidayTimes {
      startTime
      endTime
      __typename
    }
    remarks
    paidHolidayFlag
    specialHolidayFlag
    isDeemedHoliday
    hourlyPaidHolidayHours
    substituteHolidayDate
    histories {
      staffId
      workDate
      startTime
      endTime
      goDirectlyFlag
      absentFlag
      returnDirectlyFlag
      rests {
        startTime
        endTime
        __typename
      }
      hourlyPaidHolidayTimes {
        startTime
        endTime
        __typename
      }
      remarks
      paidHolidayFlag
      specialHolidayFlag
      hourlyPaidHolidayHours
      substituteHolidayFlag
      substituteHolidayDate
      createdAt
      __typename
    }
    changeRequests {
      startTime
      endTime
      goDirectlyFlag
      absentFlag
      returnDirectlyFlag
      rests {
        startTime
        endTime
        __typename
      }
      hourlyPaidHolidayTimes {
        startTime
        endTime
        __typename
      }
      remarks
      paidHolidayFlag
      specialHolidayFlag
      hourlyPaidHolidayHours
      substituteHolidayFlag
      substituteHolidayDate
      completed
      comment
      staffComment
      __typename
    }
    systemComments {
      comment
      confirmed
      createdAt
      __typename
    }
    revision
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAttendanceSubscriptionVariables,
  APITypes.OnDeleteAttendanceSubscription
>;
export const onCreateDocument = /* GraphQL */ `subscription OnCreateDocument($filter: ModelSubscriptionDocumentFilterInput) {
  onCreateDocument(filter: $filter) {
    id
    title
    content
    tag
    targetRole
    revision
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateDocumentSubscriptionVariables,
  APITypes.OnCreateDocumentSubscription
>;
export const onUpdateDocument = /* GraphQL */ `subscription OnUpdateDocument($filter: ModelSubscriptionDocumentFilterInput) {
  onUpdateDocument(filter: $filter) {
    id
    title
    content
    tag
    targetRole
    revision
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateDocumentSubscriptionVariables,
  APITypes.OnUpdateDocumentSubscription
>;
export const onDeleteDocument = /* GraphQL */ `subscription OnDeleteDocument($filter: ModelSubscriptionDocumentFilterInput) {
  onDeleteDocument(filter: $filter) {
    id
    title
    content
    tag
    targetRole
    revision
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteDocumentSubscriptionVariables,
  APITypes.OnDeleteDocumentSubscription
>;
export const onCreateShiftRequest = /* GraphQL */ `subscription OnCreateShiftRequest(
  $filter: ModelSubscriptionShiftRequestFilterInput
) {
  onCreateShiftRequest(filter: $filter) {
    id
    staffId
    targetMonth
    note
    entries {
      date
      status
      isLocked
      __typename
    }
    summary {
      workDays
      fixedOffDays
      requestedOffDays
      __typename
    }
    submittedAt
    updatedAt
    updatedBy
    version
    histories {
      version
      note
      entries {
        date
        status
        isLocked
        __typename
      }
      summary {
        workDays
        fixedOffDays
        requestedOffDays
        __typename
      }
      submittedAt
      updatedAt
      recordedAt
      recordedByStaffId
      changeReason
      __typename
    }
    createdAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateShiftRequestSubscriptionVariables,
  APITypes.OnCreateShiftRequestSubscription
>;
export const onUpdateShiftRequest = /* GraphQL */ `subscription OnUpdateShiftRequest(
  $filter: ModelSubscriptionShiftRequestFilterInput
) {
  onUpdateShiftRequest(filter: $filter) {
    id
    staffId
    targetMonth
    note
    entries {
      date
      status
      isLocked
      __typename
    }
    summary {
      workDays
      fixedOffDays
      requestedOffDays
      __typename
    }
    submittedAt
    updatedAt
    updatedBy
    version
    histories {
      version
      note
      entries {
        date
        status
        isLocked
        __typename
      }
      summary {
        workDays
        fixedOffDays
        requestedOffDays
        __typename
      }
      submittedAt
      updatedAt
      recordedAt
      recordedByStaffId
      changeReason
      __typename
    }
    createdAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateShiftRequestSubscriptionVariables,
  APITypes.OnUpdateShiftRequestSubscription
>;
export const onDeleteShiftRequest = /* GraphQL */ `subscription OnDeleteShiftRequest(
  $filter: ModelSubscriptionShiftRequestFilterInput
) {
  onDeleteShiftRequest(filter: $filter) {
    id
    staffId
    targetMonth
    note
    entries {
      date
      status
      isLocked
      __typename
    }
    summary {
      workDays
      fixedOffDays
      requestedOffDays
      __typename
    }
    submittedAt
    updatedAt
    updatedBy
    version
    histories {
      version
      note
      entries {
        date
        status
        isLocked
        __typename
      }
      summary {
        workDays
        fixedOffDays
        requestedOffDays
        __typename
      }
      submittedAt
      updatedAt
      recordedAt
      recordedByStaffId
      changeReason
      __typename
    }
    createdAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteShiftRequestSubscriptionVariables,
  APITypes.OnDeleteShiftRequestSubscription
>;
export const onCreateShiftPlanYear = /* GraphQL */ `subscription OnCreateShiftPlanYear(
  $filter: ModelSubscriptionShiftPlanYearFilterInput
) {
  onCreateShiftPlanYear(filter: $filter) {
    id
    targetYear
    plans {
      month
      editStart
      editEnd
      enabled
      dailyCapacities
      __typename
    }
    notes
    createdBy
    updatedBy
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateShiftPlanYearSubscriptionVariables,
  APITypes.OnCreateShiftPlanYearSubscription
>;
export const onUpdateShiftPlanYear = /* GraphQL */ `subscription OnUpdateShiftPlanYear(
  $filter: ModelSubscriptionShiftPlanYearFilterInput
) {
  onUpdateShiftPlanYear(filter: $filter) {
    id
    targetYear
    plans {
      month
      editStart
      editEnd
      enabled
      dailyCapacities
      __typename
    }
    notes
    createdBy
    updatedBy
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateShiftPlanYearSubscriptionVariables,
  APITypes.OnUpdateShiftPlanYearSubscription
>;
export const onDeleteShiftPlanYear = /* GraphQL */ `subscription OnDeleteShiftPlanYear(
  $filter: ModelSubscriptionShiftPlanYearFilterInput
) {
  onDeleteShiftPlanYear(filter: $filter) {
    id
    targetYear
    plans {
      month
      editStart
      editEnd
      enabled
      dailyCapacities
      __typename
    }
    notes
    createdBy
    updatedBy
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteShiftPlanYearSubscriptionVariables,
  APITypes.OnDeleteShiftPlanYearSubscription
>;
export const onCreateWorkflow = /* GraphQL */ `subscription OnCreateWorkflow($filter: ModelSubscriptionWorkflowFilterInput) {
  onCreateWorkflow(filter: $filter) {
    id
    approvedStaffIds
    rejectedStaffIds
    finalDecisionTimestamp
    category
    staffId
    status
    assignedApproverStaffIds
    approvalSteps {
      id
      approverStaffId
      decisionStatus
      approverComment
      decisionTimestamp
      stepOrder
      __typename
    }
    nextApprovalStepIndex
    submitterApproverSetting
    submitterApproverId
    submitterApproverIds
    submitterApproverMultipleMode
    overTimeDetails {
      date
      startTime
      endTime
      reason
      __typename
    }
    comments {
      id
      staffId
      text
      createdAt
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateWorkflowSubscriptionVariables,
  APITypes.OnCreateWorkflowSubscription
>;
export const onUpdateWorkflow = /* GraphQL */ `subscription OnUpdateWorkflow($filter: ModelSubscriptionWorkflowFilterInput) {
  onUpdateWorkflow(filter: $filter) {
    id
    approvedStaffIds
    rejectedStaffIds
    finalDecisionTimestamp
    category
    staffId
    status
    assignedApproverStaffIds
    approvalSteps {
      id
      approverStaffId
      decisionStatus
      approverComment
      decisionTimestamp
      stepOrder
      __typename
    }
    nextApprovalStepIndex
    submitterApproverSetting
    submitterApproverId
    submitterApproverIds
    submitterApproverMultipleMode
    overTimeDetails {
      date
      startTime
      endTime
      reason
      __typename
    }
    comments {
      id
      staffId
      text
      createdAt
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateWorkflowSubscriptionVariables,
  APITypes.OnUpdateWorkflowSubscription
>;
export const onDeleteWorkflow = /* GraphQL */ `subscription OnDeleteWorkflow($filter: ModelSubscriptionWorkflowFilterInput) {
  onDeleteWorkflow(filter: $filter) {
    id
    approvedStaffIds
    rejectedStaffIds
    finalDecisionTimestamp
    category
    staffId
    status
    assignedApproverStaffIds
    approvalSteps {
      id
      approverStaffId
      decisionStatus
      approverComment
      decisionTimestamp
      stepOrder
      __typename
    }
    nextApprovalStepIndex
    submitterApproverSetting
    submitterApproverId
    submitterApproverIds
    submitterApproverMultipleMode
    overTimeDetails {
      date
      startTime
      endTime
      reason
      __typename
    }
    comments {
      id
      staffId
      text
      createdAt
      __typename
    }
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteWorkflowSubscriptionVariables,
  APITypes.OnDeleteWorkflowSubscription
>;
export const onCreateOperationLog = /* GraphQL */ `subscription OnCreateOperationLog(
  $filter: ModelSubscriptionOperationLogFilterInput
) {
  onCreateOperationLog(filter: $filter) {
    id
    staffId
    action
    resource
    resourceId
    timestamp
    details
    ipAddress
    userAgent
    metadata
    severity
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateOperationLogSubscriptionVariables,
  APITypes.OnCreateOperationLogSubscription
>;
export const onUpdateOperationLog = /* GraphQL */ `subscription OnUpdateOperationLog(
  $filter: ModelSubscriptionOperationLogFilterInput
) {
  onUpdateOperationLog(filter: $filter) {
    id
    staffId
    action
    resource
    resourceId
    timestamp
    details
    ipAddress
    userAgent
    metadata
    severity
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateOperationLogSubscriptionVariables,
  APITypes.OnUpdateOperationLogSubscription
>;
export const onDeleteOperationLog = /* GraphQL */ `subscription OnDeleteOperationLog(
  $filter: ModelSubscriptionOperationLogFilterInput
) {
  onDeleteOperationLog(filter: $filter) {
    id
    staffId
    action
    resource
    resourceId
    timestamp
    details
    ipAddress
    userAgent
    metadata
    severity
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteOperationLogSubscriptionVariables,
  APITypes.OnDeleteOperationLogSubscription
>;
export const onCreateAuditLog = /* GraphQL */ `subscription OnCreateAuditLog($filter: ModelSubscriptionAuditLogFilterInput) {
  onCreateAuditLog(filter: $filter) {
    id
    resourceType
    resourceId
    action
    actorId
    actorRole
    requestId
    ip
    userAgent
    before
    after
    diff
    createdAt
    ttl
    reason
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateAuditLogSubscriptionVariables,
  APITypes.OnCreateAuditLogSubscription
>;
export const onUpdateAuditLog = /* GraphQL */ `subscription OnUpdateAuditLog($filter: ModelSubscriptionAuditLogFilterInput) {
  onUpdateAuditLog(filter: $filter) {
    id
    resourceType
    resourceId
    action
    actorId
    actorRole
    requestId
    ip
    userAgent
    before
    after
    diff
    createdAt
    ttl
    reason
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateAuditLogSubscriptionVariables,
  APITypes.OnUpdateAuditLogSubscription
>;
export const onDeleteAuditLog = /* GraphQL */ `subscription OnDeleteAuditLog($filter: ModelSubscriptionAuditLogFilterInput) {
  onDeleteAuditLog(filter: $filter) {
    id
    resourceType
    resourceId
    action
    actorId
    actorRole
    requestId
    ip
    userAgent
    before
    after
    diff
    createdAt
    ttl
    reason
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteAuditLogSubscriptionVariables,
  APITypes.OnDeleteAuditLogSubscription
>;
export const onCreateDailyReport = /* GraphQL */ `subscription OnCreateDailyReport(
  $filter: ModelSubscriptionDailyReportFilterInput
) {
  onCreateDailyReport(filter: $filter) {
    id
    staffId
    reportDate
    title
    content
    status
    updatedAt
    reactions {
      staffId
      type
      createdAt
      __typename
    }
    comments {
      id
      staffId
      authorName
      body
      createdAt
      __typename
    }
    createdAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateDailyReportSubscriptionVariables,
  APITypes.OnCreateDailyReportSubscription
>;
export const onUpdateDailyReport = /* GraphQL */ `subscription OnUpdateDailyReport(
  $filter: ModelSubscriptionDailyReportFilterInput
) {
  onUpdateDailyReport(filter: $filter) {
    id
    staffId
    reportDate
    title
    content
    status
    updatedAt
    reactions {
      staffId
      type
      createdAt
      __typename
    }
    comments {
      id
      staffId
      authorName
      body
      createdAt
      __typename
    }
    createdAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateDailyReportSubscriptionVariables,
  APITypes.OnUpdateDailyReportSubscription
>;
export const onDeleteDailyReport = /* GraphQL */ `subscription OnDeleteDailyReport(
  $filter: ModelSubscriptionDailyReportFilterInput
) {
  onDeleteDailyReport(filter: $filter) {
    id
    staffId
    reportDate
    title
    content
    status
    updatedAt
    reactions {
      staffId
      type
      createdAt
      __typename
    }
    comments {
      id
      staffId
      authorName
      body
      createdAt
      __typename
    }
    createdAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteDailyReportSubscriptionVariables,
  APITypes.OnDeleteDailyReportSubscription
>;
