import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import { HolidayCalendar, ListHolidayCalendarsQuery } from "../../API";
import { listHolidayCalendars } from "../../graphql/queries";

export default async function fetchHolidayCalendars() {
  const holidayCalendars: HolidayCalendar[] = [];
  const nextToken: string | null = null;
  const isLooping = true;
  while (isLooping) {
    const response = (await API.graphql({
      query: listHolidayCalendars,
      variables: { nextToken },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    })) as GraphQLResult<ListHolidayCalendarsQuery>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.listHolidayCalendars) {
      return [];
    }

    holidayCalendars.push(
      ...response.data.listHolidayCalendars.items.filter(
        (item): item is NonNullable<typeof item> => item !== null
      )
    );

    if (response.data.listHolidayCalendars.nextToken) {
      continue;
    }

    break;
  }

  return holidayCalendars;
}
