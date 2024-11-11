import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  CloseDate,
  UpdateCloseDateInput,
  UpdateCloseDateMutation,
} from "../../API";
import { updateCloseDate } from "../../graphql/mutations";

export default async function updateCloseDateData(input: UpdateCloseDateInput) {
  const response = (await API.graphql({
    query: updateCloseDate,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
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
