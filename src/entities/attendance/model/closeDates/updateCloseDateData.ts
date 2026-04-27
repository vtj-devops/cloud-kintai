import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { updateCloseDate } from "@shared/api/graphql/documents/mutations";
import {
  CloseDate,
  ModelCloseDateConditionInput,
  UpdateCloseDateInput,
  UpdateCloseDateMutation,
} from "@shared/api/graphql/types";
import { type UpdatePayload } from "@shared/api/graphql/updatePayload";
import { GraphQLResult } from "aws-amplify/api";

export type UpdateCloseDatePayload = UpdatePayload<UpdateCloseDateInput, ModelCloseDateConditionInput>;

export default async function updateCloseDateData({
  input,
  condition,
}: UpdateCloseDatePayload) {
  const response = (await graphqlClient.graphql({
    query: updateCloseDate,
    variables: {
      input,
      condition: condition ?? undefined,
    },
    authMode: "userPool",
  })) as GraphQLResult<UpdateCloseDateMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.updateCloseDate) {
    throw new Error("No data returned");
  }

  const closeDate: CloseDate = response.data.updateCloseDate;
  return closeDate;
}
