import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import { DeleteStaffInput, DeleteStaffMutation, Staff } from "../../API";
import { deleteStaff } from "../../graphql/mutations";

export default async function deleteStaffData(input: DeleteStaffInput) {
  const response = (await API.graphql({
    query: deleteStaff,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<DeleteStaffMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.deleteStaff) {
    throw new Error("deleteStaff failed");
  }

  const staff: Staff = response.data.deleteStaff;
  return staff;
}
