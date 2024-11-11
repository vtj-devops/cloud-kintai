import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import { Staff, UpdateStaffInput, UpdateStaffMutation } from "../../API";
import { updateStaff } from "../../graphql/mutations";

export default async function updateStaffData(input: UpdateStaffInput) {
  const response = (await API.graphql({
    query: updateStaff,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<UpdateStaffMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.updateStaff) {
    throw new Error("Failed to update staff");
  }

  const staff: Staff = response.data.updateStaff;
  return staff;
}
