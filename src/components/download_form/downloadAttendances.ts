import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  Attendance,
  ListAttendancesQuery,
  ModelAttendanceFilterInput,
} from "../../API";
import { listAttendances } from "../../graphql/queries";

export default async function downloadAttendances(
  $orCondition: ModelAttendanceFilterInput[]
) {
  const attendances: Attendance[] = [];
  let nextToken: string | null = null;
  const isLooping = true;
  while (isLooping) {
    const response = (await API.graphql({
      query: listAttendances,
      variables: {
        filter: {
          or: $orCondition,
        },
        nextToken,
      },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    })) as GraphQLResult<ListAttendancesQuery>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.listAttendances) {
      throw new Error("Failed to fetch attendance");
    }

    attendances.push(
      ...response.data.listAttendances.items.filter(
        (item): item is NonNullable<typeof item> => item !== null
      )
    );

    if (response.data.listAttendances.nextToken) {
      nextToken = response.data.listAttendances.nextToken;
      continue;
    }

    break;
  }

  return attendances;
}
