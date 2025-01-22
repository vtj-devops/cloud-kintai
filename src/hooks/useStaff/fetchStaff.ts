import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import { ListStaffQuery, Staff } from "../../API";
import { listStaff } from "../../graphql/queries";

export default async function fetchStaff(
  cognitoUserId: Staff["cognitoUserId"]
) {
  const staffs: Staff[] = [];
  let nextToken: string | null = null;
  const isLooping = true;
  while (isLooping) {
    const response = (await API.graphql({
      query: listStaff,
      variables: {
        filter: { cognitoUserId: { eq: cognitoUserId } },
        nextToken,
      },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    })) as GraphQLResult<ListStaffQuery>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.listStaff?.items) {
      throw new Error("スタッフが見つかりませんでした。");
    }

    staffs.push(
      ...response.data.listStaff.items.filter(
        (item): item is NonNullable<typeof item> => item !== null
      )
    );

    if (response.data.listStaff.nextToken) {
      nextToken = response.data.listStaff.nextToken;
      continue;
    }

    break;
  }

  return staffs[0];
}
