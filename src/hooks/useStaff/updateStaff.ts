import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import { Staff, UpdateStaffInput, UpdateStaffMutation } from "@/API";
import * as mutations from "@/graphql/mutations";

export default async function updateStaff(input: UpdateStaffInput) {
  console.log({ input });
  const response = (await API.graphql({
    query: mutations.updateStaff,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<UpdateStaffMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  const staff = response.data?.updateStaff as Staff;
  return staff;
}
