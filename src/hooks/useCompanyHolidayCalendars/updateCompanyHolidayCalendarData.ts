import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  CompanyHolidayCalendar,
  UpdateCompanyHolidayCalendarInput,
  UpdateCompanyHolidayCalendarMutation,
} from "../../API";
import { updateCompanyHolidayCalendar } from "../../graphql/mutations";

export default async function updateCompanyHolidayCalendarData(
  input: UpdateCompanyHolidayCalendarInput
) {
  const response = (await API.graphql({
    query: updateCompanyHolidayCalendar,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<UpdateCompanyHolidayCalendarMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.updateCompanyHolidayCalendar) {
    throw new Error("Company holiday calendar not updated");
  }

  const companyHolidayCalendar: CompanyHolidayCalendar =
    response.data.updateCompanyHolidayCalendar;
  return companyHolidayCalendar;
}
