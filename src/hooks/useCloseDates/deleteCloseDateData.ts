import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  CloseDate,
  DeleteCloseDateInput,
  DeleteCloseDateMutation,
} from "../../API";
import { deleteCloseDate } from "../../graphql/mutations";

export default async function deleteCloseDateData(input: DeleteCloseDateInput) {
  const response = (await API.graphql({
    query: deleteCloseDate,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<DeleteCloseDateMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.deleteCloseDate) {
    throw new Error("No data returned");
  }

  const closeDate: CloseDate = response.data.deleteCloseDate;
  return closeDate;
}
