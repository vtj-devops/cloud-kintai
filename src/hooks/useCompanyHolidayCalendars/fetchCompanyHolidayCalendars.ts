import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  CompanyHolidayCalendar,
  ListCompanyHolidayCalendarsQuery,
} from "../../API";
import { listCompanyHolidayCalendars } from "../../graphql/queries";

export default async function fetchCompanyHolidayCalendars() {
  const companyHolidayCalendars: CompanyHolidayCalendar[] = [];
  const nextToken: string | null = null;
  const isLooping = true;
  while (isLooping) {
    const response = (await API.graphql({
      query: listCompanyHolidayCalendars,
      variables: { nextToken },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    })) as GraphQLResult<ListCompanyHolidayCalendarsQuery>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.listCompanyHolidayCalendars) {
      return [];
    }

    companyHolidayCalendars.push(
      ...response.data.listCompanyHolidayCalendars.items.filter(
        (item): item is NonNullable<typeof item> => item !== null
      )
    );

    if (response.data.listCompanyHolidayCalendars.nextToken) {
      continue;
    }

    break;
  }

  return companyHolidayCalendars;
}
