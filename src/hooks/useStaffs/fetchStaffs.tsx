import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import { ListStaffQuery, Staff } from "../../API";
import { listStaff } from "../../graphql/queries";

export default async function fetchStaffs() {
  const staffs: Staff[] = [];
  let nextToken: string | null = null;
  const isLooping = true;
  while (isLooping) {
    const response = (await API.graphql({
      query: listStaff,
      authMode: "AMAZON_COGNITO_USER_POOLS",
      variables: { nextToken },
    })) as GraphQLResult<ListStaffQuery>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.listStaff) {
      throw new Error("No data returned");
    }

    staffs.push(
      ...response.data.listStaff.items.filter(
        (item): item is NonNullable<typeof item> => !!item
      )
    );

    if (response.data.listStaff.nextToken) {
      nextToken = response.data.listStaff.nextToken;
      continue;
    }

    break;
  }

  return staffs;
}
