import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  CompanyHolidayCalendar,
  CreateCompanyHolidayCalendarInput,
  CreateCompanyHolidayCalendarMutation,
} from "../../API";
import { createCompanyHolidayCalendar } from "../../graphql/mutations";

export default async function createCompanyHolidayCalendarsData(
  input: CreateCompanyHolidayCalendarInput
) {
  const response = (await API.graphql({
    query: createCompanyHolidayCalendar,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<CreateCompanyHolidayCalendarMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.createCompanyHolidayCalendar) {
    throw new Error("No data returned");
  }

  const companyHolidayCalendar: CompanyHolidayCalendar =
    response.data.createCompanyHolidayCalendar;
  return companyHolidayCalendar;
}
