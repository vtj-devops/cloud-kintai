import { API, GraphQLResult } from "@aws-amplify/api";

import {
  DeleteHolidayCalendarInput,
  DeleteHolidayCalendarMutation,
  HolidayCalendar,
} from "@/API";
import { deleteHolidayCalendar } from "@/graphql/mutations";

export default async function deleteHolidayCalendarData(
  input: DeleteHolidayCalendarInput
) {
  const response = (await API.graphql({
    query: deleteHolidayCalendar,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<DeleteHolidayCalendarMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.deleteHolidayCalendar) {
    throw new Error("No data returned");
  }

  const holidayCalendar = response.data
    .deleteHolidayCalendar as HolidayCalendar;
  return holidayCalendar;
}
