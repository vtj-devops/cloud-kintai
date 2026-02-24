/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../types";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const sendMail = /* GraphQL */ `query SendMail($data: EmailData!) {
  sendMail(data: $data) {
    statusCode
    body
    __typename
  }
}
` as GeneratedQuery<APITypes.SendMailQueryVariables, APITypes.SendMailQuery>;
export const getCheckForUpdate = /* GraphQL */ `query GetCheckForUpdate($id: ID!) {
  getCheckForUpdate(id: $id) {
    id
    deployUuid
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetCheckForUpdateQueryVariables,
  APITypes.GetCheckForUpdateQuery
>;
export const listCheckForUpdates = /* GraphQL */ `query ListCheckForUpdates(
  $filter: ModelCheckForUpdateFilterInput
  $limit: Int
  $nextToken: String
) {
  listCheckForUpdates(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      deployUuid
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListCheckForUpdatesQueryVariables,
  APITypes.ListCheckForUpdatesQuery
>;
export const getAppConfig = /* GraphQL */ `query GetAppConfig($id: ID!) {
  getAppConfig(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAppConfigQueryVariables,
  APITypes.GetAppConfigQuery
>;
export const listAppConfigs = /* GraphQL */ `query ListAppConfigs(
  $filter: ModelAppConfigFilterInput
  $limit: Int
  $nextToken: String
) {
  listAppConfigs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAppConfigsQueryVariables,
  APITypes.ListAppConfigsQuery
>;
export const getStaff = /* GraphQL */ `query GetStaff($id: ID!) {
  getStaff(id: $id) {
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
` as GeneratedQuery<APITypes.GetStaffQueryVariables, APITypes.GetStaffQuery>;
export const listStaff = /* GraphQL */ `query ListStaff(
  $filter: ModelStaffFilterInput
  $limit: Int
  $nextToken: String
) {
  listStaff(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListStaffQueryVariables, APITypes.ListStaffQuery>;
export const staffByCognitoUserId = /* GraphQL */ `query StaffByCognitoUserId(
  $cognitoUserId: String!
  $id: ModelIDKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelStaffFilterInput
  $limit: Int
  $nextToken: String
) {
  staffByCognitoUserId(
    cognitoUserId: $cognitoUserId
    id: $id
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.StaffByCognitoUserIdQueryVariables,
  APITypes.StaffByCognitoUserIdQuery
>;
export const getHolidayCalendar = /* GraphQL */ `query GetHolidayCalendar($id: ID!) {
  getHolidayCalendar(id: $id) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetHolidayCalendarQueryVariables,
  APITypes.GetHolidayCalendarQuery
>;
export const listHolidayCalendars = /* GraphQL */ `query ListHolidayCalendars(
  $filter: ModelHolidayCalendarFilterInput
  $limit: Int
  $nextToken: String
) {
  listHolidayCalendars(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      holidayDate
      name
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListHolidayCalendarsQueryVariables,
  APITypes.ListHolidayCalendarsQuery
>;
export const getCompanyHolidayCalendar = /* GraphQL */ `query GetCompanyHolidayCalendar($id: ID!) {
  getCompanyHolidayCalendar(id: $id) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetCompanyHolidayCalendarQueryVariables,
  APITypes.GetCompanyHolidayCalendarQuery
>;
export const listCompanyHolidayCalendars = /* GraphQL */ `query ListCompanyHolidayCalendars(
  $filter: ModelCompanyHolidayCalendarFilterInput
  $limit: Int
  $nextToken: String
) {
  listCompanyHolidayCalendars(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      holidayDate
      name
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListCompanyHolidayCalendarsQueryVariables,
  APITypes.ListCompanyHolidayCalendarsQuery
>;
export const getEventCalendar = /* GraphQL */ `query GetEventCalendar($id: ID!) {
  getEventCalendar(id: $id) {
    id
    eventDate
    name
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetEventCalendarQueryVariables,
  APITypes.GetEventCalendarQuery
>;
export const listEventCalendars = /* GraphQL */ `query ListEventCalendars(
  $filter: ModelEventCalendarFilterInput
  $limit: Int
  $nextToken: String
) {
  listEventCalendars(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      eventDate
      name
      description
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListEventCalendarsQueryVariables,
  APITypes.ListEventCalendarsQuery
>;
export const getCloseDate = /* GraphQL */ `query GetCloseDate($id: ID!) {
  getCloseDate(id: $id) {
    id
    closeDate
    startDate
    endDate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetCloseDateQueryVariables,
  APITypes.GetCloseDateQuery
>;
export const listCloseDates = /* GraphQL */ `query ListCloseDates(
  $filter: ModelCloseDateFilterInput
  $limit: Int
  $nextToken: String
) {
  listCloseDates(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      closeDate
      startDate
      endDate
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListCloseDatesQueryVariables,
  APITypes.ListCloseDatesQuery
>;
export const getAttendance = /* GraphQL */ `query GetAttendance($id: ID!) {
  getAttendance(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAttendanceQueryVariables,
  APITypes.GetAttendanceQuery
>;
export const listAttendances = /* GraphQL */ `query ListAttendances(
  $filter: ModelAttendanceFilterInput
  $limit: Int
  $nextToken: String
) {
  listAttendances(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAttendancesQueryVariables,
  APITypes.ListAttendancesQuery
>;
export const attendancesByStaffId = /* GraphQL */ `query AttendancesByStaffId(
  $staffId: String!
  $workDate: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelAttendanceFilterInput
  $limit: Int
  $nextToken: String
) {
  attendancesByStaffId(
    staffId: $staffId
    workDate: $workDate
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.AttendancesByStaffIdQueryVariables,
  APITypes.AttendancesByStaffIdQuery
>;
export const getDocument = /* GraphQL */ `query GetDocument($id: ID!) {
  getDocument(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetDocumentQueryVariables,
  APITypes.GetDocumentQuery
>;
export const listDocuments = /* GraphQL */ `query ListDocuments(
  $filter: ModelDocumentFilterInput
  $limit: Int
  $nextToken: String
) {
  listDocuments(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListDocumentsQueryVariables,
  APITypes.ListDocumentsQuery
>;
export const getShiftRequest = /* GraphQL */ `query GetShiftRequest($id: ID!) {
  getShiftRequest(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetShiftRequestQueryVariables,
  APITypes.GetShiftRequestQuery
>;
export const listShiftRequests = /* GraphQL */ `query ListShiftRequests(
  $filter: ModelShiftRequestFilterInput
  $limit: Int
  $nextToken: String
) {
  listShiftRequests(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListShiftRequestsQueryVariables,
  APITypes.ListShiftRequestsQuery
>;
export const shiftRequestsByStaffId = /* GraphQL */ `query ShiftRequestsByStaffId(
  $staffId: String!
  $targetMonth: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelShiftRequestFilterInput
  $limit: Int
  $nextToken: String
) {
  shiftRequestsByStaffId(
    staffId: $staffId
    targetMonth: $targetMonth
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ShiftRequestsByStaffIdQueryVariables,
  APITypes.ShiftRequestsByStaffIdQuery
>;
export const getShiftPlanYear = /* GraphQL */ `query GetShiftPlanYear($id: ID!) {
  getShiftPlanYear(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetShiftPlanYearQueryVariables,
  APITypes.GetShiftPlanYearQuery
>;
export const listShiftPlanYears = /* GraphQL */ `query ListShiftPlanYears(
  $filter: ModelShiftPlanYearFilterInput
  $limit: Int
  $nextToken: String
) {
  listShiftPlanYears(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListShiftPlanYearsQueryVariables,
  APITypes.ListShiftPlanYearsQuery
>;
export const shiftPlanYearByTargetYear = /* GraphQL */ `query ShiftPlanYearByTargetYear(
  $targetYear: Int!
  $id: ModelIDKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelShiftPlanYearFilterInput
  $limit: Int
  $nextToken: String
) {
  shiftPlanYearByTargetYear(
    targetYear: $targetYear
    id: $id
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ShiftPlanYearByTargetYearQueryVariables,
  APITypes.ShiftPlanYearByTargetYearQuery
>;
export const getWorkflow = /* GraphQL */ `query GetWorkflow($id: ID!) {
  getWorkflow(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetWorkflowQueryVariables,
  APITypes.GetWorkflowQuery
>;
export const listWorkflows = /* GraphQL */ `query ListWorkflows(
  $filter: ModelWorkflowFilterInput
  $limit: Int
  $nextToken: String
) {
  listWorkflows(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListWorkflowsQueryVariables,
  APITypes.ListWorkflowsQuery
>;
export const workflowsByStaffId = /* GraphQL */ `query WorkflowsByStaffId(
  $staffId: String!
  $sortDirection: ModelSortDirection
  $filter: ModelWorkflowFilterInput
  $limit: Int
  $nextToken: String
) {
  workflowsByStaffId(
    staffId: $staffId
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.WorkflowsByStaffIdQueryVariables,
  APITypes.WorkflowsByStaffIdQuery
>;
export const getOperationLog = /* GraphQL */ `query GetOperationLog($id: ID!) {
  getOperationLog(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetOperationLogQueryVariables,
  APITypes.GetOperationLogQuery
>;
export const listOperationLogs = /* GraphQL */ `query ListOperationLogs(
  $filter: ModelOperationLogFilterInput
  $limit: Int
  $nextToken: String
) {
  listOperationLogs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListOperationLogsQueryVariables,
  APITypes.ListOperationLogsQuery
>;
export const operationLogsByStaffId = /* GraphQL */ `query OperationLogsByStaffId(
  $staffId: String!
  $timestamp: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelOperationLogFilterInput
  $limit: Int
  $nextToken: String
) {
  operationLogsByStaffId(
    staffId: $staffId
    timestamp: $timestamp
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.OperationLogsByStaffIdQueryVariables,
  APITypes.OperationLogsByStaffIdQuery
>;
export const getAuditLog = /* GraphQL */ `query GetAuditLog($id: ID!) {
  getAuditLog(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetAuditLogQueryVariables,
  APITypes.GetAuditLogQuery
>;
export const listAuditLogs = /* GraphQL */ `query ListAuditLogs(
  $filter: ModelAuditLogFilterInput
  $limit: Int
  $nextToken: String
) {
  listAuditLogs(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListAuditLogsQueryVariables,
  APITypes.ListAuditLogsQuery
>;
export const getDailyReport = /* GraphQL */ `query GetDailyReport($id: ID!) {
  getDailyReport(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetDailyReportQueryVariables,
  APITypes.GetDailyReportQuery
>;
export const listDailyReports = /* GraphQL */ `query ListDailyReports(
  $filter: ModelDailyReportFilterInput
  $limit: Int
  $nextToken: String
) {
  listDailyReports(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListDailyReportsQueryVariables,
  APITypes.ListDailyReportsQuery
>;
export const dailyReportsByStaffId = /* GraphQL */ `query DailyReportsByStaffId(
  $staffId: String!
  $reportDate: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelDailyReportFilterInput
  $limit: Int
  $nextToken: String
) {
  dailyReportsByStaffId(
    staffId: $staffId
    reportDate: $reportDate
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.DailyReportsByStaffIdQueryVariables,
  APITypes.DailyReportsByStaffIdQuery
>;
