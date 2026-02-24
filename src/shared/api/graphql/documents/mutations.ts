/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../types";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createCheckForUpdate = /* GraphQL */ `mutation CreateCheckForUpdate(
  $input: CreateCheckForUpdateInput!
  $condition: ModelCheckForUpdateConditionInput
) {
  createCheckForUpdate(input: $input, condition: $condition) {
    id
    deployUuid
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateCheckForUpdateMutationVariables,
  APITypes.CreateCheckForUpdateMutation
>;
export const updateCheckForUpdate = /* GraphQL */ `mutation UpdateCheckForUpdate(
  $input: UpdateCheckForUpdateInput!
  $condition: ModelCheckForUpdateConditionInput
) {
  updateCheckForUpdate(input: $input, condition: $condition) {
    id
    deployUuid
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateCheckForUpdateMutationVariables,
  APITypes.UpdateCheckForUpdateMutation
>;
export const deleteCheckForUpdate = /* GraphQL */ `mutation DeleteCheckForUpdate(
  $input: DeleteCheckForUpdateInput!
  $condition: ModelCheckForUpdateConditionInput
) {
  deleteCheckForUpdate(input: $input, condition: $condition) {
    id
    deployUuid
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteCheckForUpdateMutationVariables,
  APITypes.DeleteCheckForUpdateMutation
>;
export const createAppConfig = /* GraphQL */ `mutation CreateAppConfig(
  $input: CreateAppConfigInput!
  $condition: ModelAppConfigConditionInput
) {
  createAppConfig(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateAppConfigMutationVariables,
  APITypes.CreateAppConfigMutation
>;
export const updateAppConfig = /* GraphQL */ `mutation UpdateAppConfig(
  $input: UpdateAppConfigInput!
  $condition: ModelAppConfigConditionInput
) {
  updateAppConfig(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateAppConfigMutationVariables,
  APITypes.UpdateAppConfigMutation
>;
export const deleteAppConfig = /* GraphQL */ `mutation DeleteAppConfig(
  $input: DeleteAppConfigInput!
  $condition: ModelAppConfigConditionInput
) {
  deleteAppConfig(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteAppConfigMutationVariables,
  APITypes.DeleteAppConfigMutation
>;
export const createStaff = /* GraphQL */ `mutation CreateStaff(
  $input: CreateStaffInput!
  $condition: ModelStaffConditionInput
) {
  createStaff(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateStaffMutationVariables,
  APITypes.CreateStaffMutation
>;
export const updateStaff = /* GraphQL */ `mutation UpdateStaff(
  $input: UpdateStaffInput!
  $condition: ModelStaffConditionInput
) {
  updateStaff(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateStaffMutationVariables,
  APITypes.UpdateStaffMutation
>;
export const deleteStaff = /* GraphQL */ `mutation DeleteStaff(
  $input: DeleteStaffInput!
  $condition: ModelStaffConditionInput
) {
  deleteStaff(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteStaffMutationVariables,
  APITypes.DeleteStaffMutation
>;
export const createHolidayCalendar = /* GraphQL */ `mutation CreateHolidayCalendar(
  $input: CreateHolidayCalendarInput!
  $condition: ModelHolidayCalendarConditionInput
) {
  createHolidayCalendar(input: $input, condition: $condition) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateHolidayCalendarMutationVariables,
  APITypes.CreateHolidayCalendarMutation
>;
export const updateHolidayCalendar = /* GraphQL */ `mutation UpdateHolidayCalendar(
  $input: UpdateHolidayCalendarInput!
  $condition: ModelHolidayCalendarConditionInput
) {
  updateHolidayCalendar(input: $input, condition: $condition) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateHolidayCalendarMutationVariables,
  APITypes.UpdateHolidayCalendarMutation
>;
export const deleteHolidayCalendar = /* GraphQL */ `mutation DeleteHolidayCalendar(
  $input: DeleteHolidayCalendarInput!
  $condition: ModelHolidayCalendarConditionInput
) {
  deleteHolidayCalendar(input: $input, condition: $condition) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteHolidayCalendarMutationVariables,
  APITypes.DeleteHolidayCalendarMutation
>;
export const createCompanyHolidayCalendar = /* GraphQL */ `mutation CreateCompanyHolidayCalendar(
  $input: CreateCompanyHolidayCalendarInput!
  $condition: ModelCompanyHolidayCalendarConditionInput
) {
  createCompanyHolidayCalendar(input: $input, condition: $condition) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateCompanyHolidayCalendarMutationVariables,
  APITypes.CreateCompanyHolidayCalendarMutation
>;
export const updateCompanyHolidayCalendar = /* GraphQL */ `mutation UpdateCompanyHolidayCalendar(
  $input: UpdateCompanyHolidayCalendarInput!
  $condition: ModelCompanyHolidayCalendarConditionInput
) {
  updateCompanyHolidayCalendar(input: $input, condition: $condition) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateCompanyHolidayCalendarMutationVariables,
  APITypes.UpdateCompanyHolidayCalendarMutation
>;
export const deleteCompanyHolidayCalendar = /* GraphQL */ `mutation DeleteCompanyHolidayCalendar(
  $input: DeleteCompanyHolidayCalendarInput!
  $condition: ModelCompanyHolidayCalendarConditionInput
) {
  deleteCompanyHolidayCalendar(input: $input, condition: $condition) {
    id
    holidayDate
    name
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteCompanyHolidayCalendarMutationVariables,
  APITypes.DeleteCompanyHolidayCalendarMutation
>;
export const createEventCalendar = /* GraphQL */ `mutation CreateEventCalendar(
  $input: CreateEventCalendarInput!
  $condition: ModelEventCalendarConditionInput
) {
  createEventCalendar(input: $input, condition: $condition) {
    id
    eventDate
    name
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateEventCalendarMutationVariables,
  APITypes.CreateEventCalendarMutation
>;
export const updateEventCalendar = /* GraphQL */ `mutation UpdateEventCalendar(
  $input: UpdateEventCalendarInput!
  $condition: ModelEventCalendarConditionInput
) {
  updateEventCalendar(input: $input, condition: $condition) {
    id
    eventDate
    name
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateEventCalendarMutationVariables,
  APITypes.UpdateEventCalendarMutation
>;
export const deleteEventCalendar = /* GraphQL */ `mutation DeleteEventCalendar(
  $input: DeleteEventCalendarInput!
  $condition: ModelEventCalendarConditionInput
) {
  deleteEventCalendar(input: $input, condition: $condition) {
    id
    eventDate
    name
    description
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteEventCalendarMutationVariables,
  APITypes.DeleteEventCalendarMutation
>;
export const createCloseDate = /* GraphQL */ `mutation CreateCloseDate(
  $input: CreateCloseDateInput!
  $condition: ModelCloseDateConditionInput
) {
  createCloseDate(input: $input, condition: $condition) {
    id
    closeDate
    startDate
    endDate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateCloseDateMutationVariables,
  APITypes.CreateCloseDateMutation
>;
export const updateCloseDate = /* GraphQL */ `mutation UpdateCloseDate(
  $input: UpdateCloseDateInput!
  $condition: ModelCloseDateConditionInput
) {
  updateCloseDate(input: $input, condition: $condition) {
    id
    closeDate
    startDate
    endDate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateCloseDateMutationVariables,
  APITypes.UpdateCloseDateMutation
>;
export const deleteCloseDate = /* GraphQL */ `mutation DeleteCloseDate(
  $input: DeleteCloseDateInput!
  $condition: ModelCloseDateConditionInput
) {
  deleteCloseDate(input: $input, condition: $condition) {
    id
    closeDate
    startDate
    endDate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteCloseDateMutationVariables,
  APITypes.DeleteCloseDateMutation
>;
export const createAttendance = /* GraphQL */ `mutation CreateAttendance(
  $input: CreateAttendanceInput!
  $condition: ModelAttendanceConditionInput
) {
  createAttendance(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateAttendanceMutationVariables,
  APITypes.CreateAttendanceMutation
>;
export const updateAttendance = /* GraphQL */ `mutation UpdateAttendance(
  $input: UpdateAttendanceInput!
  $condition: ModelAttendanceConditionInput
) {
  updateAttendance(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateAttendanceMutationVariables,
  APITypes.UpdateAttendanceMutation
>;
export const deleteAttendance = /* GraphQL */ `mutation DeleteAttendance(
  $input: DeleteAttendanceInput!
  $condition: ModelAttendanceConditionInput
) {
  deleteAttendance(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteAttendanceMutationVariables,
  APITypes.DeleteAttendanceMutation
>;
export const createDocument = /* GraphQL */ `mutation CreateDocument(
  $input: CreateDocumentInput!
  $condition: ModelDocumentConditionInput
) {
  createDocument(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateDocumentMutationVariables,
  APITypes.CreateDocumentMutation
>;
export const updateDocument = /* GraphQL */ `mutation UpdateDocument(
  $input: UpdateDocumentInput!
  $condition: ModelDocumentConditionInput
) {
  updateDocument(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateDocumentMutationVariables,
  APITypes.UpdateDocumentMutation
>;
export const deleteDocument = /* GraphQL */ `mutation DeleteDocument(
  $input: DeleteDocumentInput!
  $condition: ModelDocumentConditionInput
) {
  deleteDocument(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteDocumentMutationVariables,
  APITypes.DeleteDocumentMutation
>;
export const createShiftRequest = /* GraphQL */ `mutation CreateShiftRequest(
  $input: CreateShiftRequestInput!
  $condition: ModelShiftRequestConditionInput
) {
  createShiftRequest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateShiftRequestMutationVariables,
  APITypes.CreateShiftRequestMutation
>;
export const updateShiftRequest = /* GraphQL */ `mutation UpdateShiftRequest(
  $input: UpdateShiftRequestInput!
  $condition: ModelShiftRequestConditionInput
) {
  updateShiftRequest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateShiftRequestMutationVariables,
  APITypes.UpdateShiftRequestMutation
>;
export const deleteShiftRequest = /* GraphQL */ `mutation DeleteShiftRequest(
  $input: DeleteShiftRequestInput!
  $condition: ModelShiftRequestConditionInput
) {
  deleteShiftRequest(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteShiftRequestMutationVariables,
  APITypes.DeleteShiftRequestMutation
>;
export const createShiftPlanYear = /* GraphQL */ `mutation CreateShiftPlanYear(
  $input: CreateShiftPlanYearInput!
  $condition: ModelShiftPlanYearConditionInput
) {
  createShiftPlanYear(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateShiftPlanYearMutationVariables,
  APITypes.CreateShiftPlanYearMutation
>;
export const updateShiftPlanYear = /* GraphQL */ `mutation UpdateShiftPlanYear(
  $input: UpdateShiftPlanYearInput!
  $condition: ModelShiftPlanYearConditionInput
) {
  updateShiftPlanYear(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateShiftPlanYearMutationVariables,
  APITypes.UpdateShiftPlanYearMutation
>;
export const deleteShiftPlanYear = /* GraphQL */ `mutation DeleteShiftPlanYear(
  $input: DeleteShiftPlanYearInput!
  $condition: ModelShiftPlanYearConditionInput
) {
  deleteShiftPlanYear(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteShiftPlanYearMutationVariables,
  APITypes.DeleteShiftPlanYearMutation
>;
export const createWorkflow = /* GraphQL */ `mutation CreateWorkflow(
  $input: CreateWorkflowInput!
  $condition: ModelWorkflowConditionInput
) {
  createWorkflow(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateWorkflowMutationVariables,
  APITypes.CreateWorkflowMutation
>;
export const updateWorkflow = /* GraphQL */ `mutation UpdateWorkflow(
  $input: UpdateWorkflowInput!
  $condition: ModelWorkflowConditionInput
) {
  updateWorkflow(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateWorkflowMutationVariables,
  APITypes.UpdateWorkflowMutation
>;
export const deleteWorkflow = /* GraphQL */ `mutation DeleteWorkflow(
  $input: DeleteWorkflowInput!
  $condition: ModelWorkflowConditionInput
) {
  deleteWorkflow(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteWorkflowMutationVariables,
  APITypes.DeleteWorkflowMutation
>;
export const createOperationLog = /* GraphQL */ `mutation CreateOperationLog(
  $input: CreateOperationLogInput!
  $condition: ModelOperationLogConditionInput
) {
  createOperationLog(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateOperationLogMutationVariables,
  APITypes.CreateOperationLogMutation
>;
export const updateOperationLog = /* GraphQL */ `mutation UpdateOperationLog(
  $input: UpdateOperationLogInput!
  $condition: ModelOperationLogConditionInput
) {
  updateOperationLog(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateOperationLogMutationVariables,
  APITypes.UpdateOperationLogMutation
>;
export const deleteOperationLog = /* GraphQL */ `mutation DeleteOperationLog(
  $input: DeleteOperationLogInput!
  $condition: ModelOperationLogConditionInput
) {
  deleteOperationLog(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteOperationLogMutationVariables,
  APITypes.DeleteOperationLogMutation
>;
export const createAuditLog = /* GraphQL */ `mutation CreateAuditLog(
  $input: CreateAuditLogInput!
  $condition: ModelAuditLogConditionInput
) {
  createAuditLog(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateAuditLogMutationVariables,
  APITypes.CreateAuditLogMutation
>;
export const updateAuditLog = /* GraphQL */ `mutation UpdateAuditLog(
  $input: UpdateAuditLogInput!
  $condition: ModelAuditLogConditionInput
) {
  updateAuditLog(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateAuditLogMutationVariables,
  APITypes.UpdateAuditLogMutation
>;
export const deleteAuditLog = /* GraphQL */ `mutation DeleteAuditLog(
  $input: DeleteAuditLogInput!
  $condition: ModelAuditLogConditionInput
) {
  deleteAuditLog(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteAuditLogMutationVariables,
  APITypes.DeleteAuditLogMutation
>;
export const createDailyReport = /* GraphQL */ `mutation CreateDailyReport(
  $input: CreateDailyReportInput!
  $condition: ModelDailyReportConditionInput
) {
  createDailyReport(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateDailyReportMutationVariables,
  APITypes.CreateDailyReportMutation
>;
export const updateDailyReport = /* GraphQL */ `mutation UpdateDailyReport(
  $input: UpdateDailyReportInput!
  $condition: ModelDailyReportConditionInput
) {
  updateDailyReport(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateDailyReportMutationVariables,
  APITypes.UpdateDailyReportMutation
>;
export const deleteDailyReport = /* GraphQL */ `mutation DeleteDailyReport(
  $input: DeleteDailyReportInput!
  $condition: ModelDailyReportConditionInput
) {
  deleteDailyReport(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteDailyReportMutationVariables,
  APITypes.DeleteDailyReportMutation
>;
