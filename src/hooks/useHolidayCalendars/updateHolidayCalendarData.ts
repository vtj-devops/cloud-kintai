import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  HolidayCalendar,
  UpdateHolidayCalendarInput,
  UpdateHolidayCalendarMutation,
} from "../../API";
import { updateHolidayCalendar } from "../../graphql/mutations";

export default async function updateHolidayCalendarData(
  input: UpdateHolidayCalendarInput
) {
  const response = (await API.graphql({
    query: updateHolidayCalendar,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<UpdateHolidayCalendarMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.updateHolidayCalendar) {
    throw new Error("No data returned");
  }

  const holidayCalendar: HolidayCalendar = response.data.updateHolidayCalendar;
  return holidayCalendar;
}
