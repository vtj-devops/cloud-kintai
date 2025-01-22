import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  CompanyHolidayCalendar,
  DeleteCompanyHolidayCalendarInput,
  DeleteCompanyHolidayCalendarMutation,
} from "../../API";
import { deleteCompanyHolidayCalendar } from "../../graphql/mutations";

export default async function deleteCompanyHolidayCalendarData(
  input: DeleteCompanyHolidayCalendarInput
) {
  const response = (await API.graphql({
    query: deleteCompanyHolidayCalendar,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<DeleteCompanyHolidayCalendarMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.deleteCompanyHolidayCalendar) {
    throw new Error("Failed to delete company holiday calendar");
  }

  const companyHolidayCalendar: CompanyHolidayCalendar =
    response.data.deleteCompanyHolidayCalendar;
  return companyHolidayCalendar;
}
