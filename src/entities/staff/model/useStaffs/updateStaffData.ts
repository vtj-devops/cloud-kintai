import { type UpdateStaffPayload } from "@entities/staff/api/staffApi";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { updateStaff } from "@shared/api/graphql/documents/mutations";
import {
  Staff,
  UpdateStaffMutation,
} from "@shared/api/graphql/types";
import { GraphQLResult } from "aws-amplify/api";

export default async function updateStaffData({
  input,
  condition,
}: UpdateStaffPayload) {
  const response = (await graphqlClient.graphql({
    query: updateStaff,
    variables: {
      input,
      condition: condition ?? undefined,
    },
    authMode: "userPool",
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
