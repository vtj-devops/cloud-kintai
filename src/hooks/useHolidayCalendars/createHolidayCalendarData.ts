import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  CreateHolidayCalendarInput,
  CreateHolidayCalendarMutation,
  HolidayCalendar,
} from "../../API";
import { createHolidayCalendar } from "../../graphql/mutations";

export default async function createHolidayCalendarData(
  input: CreateHolidayCalendarInput
) {
  const response = (await API.graphql({
    query: createHolidayCalendar,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<CreateHolidayCalendarMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.createHolidayCalendar) {
    throw new Error("Failed to create holiday calendar");
  }

  const holidayCalendar: HolidayCalendar = response.data.createHolidayCalendar;
  return holidayCalendar;
}
