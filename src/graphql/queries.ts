/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
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
    sortKey
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
      sortKey
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListStaffQueryVariables, APITypes.ListStaffQuery>;
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
    rests {
      startTime
      endTime
      __typename
    }
    remarks
    paidHolidayFlag
    substituteHolidayDate
    histories {
      staffId
      workDate
      startTime
      endTime
      goDirectlyFlag
      returnDirectlyFlag
      rests {
        startTime
        endTime
        __typename
      }
      remarks
      paidHolidayFlag
      substituteHolidayFlag
      substituteHolidayDate
      createdAt
      __typename
    }
    changeRequests {
      startTime
      endTime
      goDirectlyFlag
      returnDirectlyFlag
      rests {
        startTime
        endTime
        __typename
      }
      remarks
      paidHolidayFlag
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
      rests {
        startTime
        endTime
        __typename
      }
      remarks
      paidHolidayFlag
      substituteHolidayDate
      histories {
        staffId
        workDate
        startTime
        endTime
        goDirectlyFlag
        returnDirectlyFlag
        rests {
          startTime
          endTime
          __typename
        }
        remarks
        paidHolidayFlag
        substituteHolidayFlag
        substituteHolidayDate
        createdAt
        __typename
      }
      changeRequests {
        startTime
        endTime
        goDirectlyFlag
        returnDirectlyFlag
        rests {
          startTime
          endTime
          __typename
        }
        remarks
        paidHolidayFlag
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
