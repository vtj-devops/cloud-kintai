import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  Document as APIDocument,
  UpdateDocumentInput,
  UpdateDocumentMutation,
} from "../../API";
import { updateDocument } from "../../graphql/mutations";

export default async function updateDocumentData(input: UpdateDocumentInput) {
  const response = (await API.graphql({
    query: updateDocument,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<UpdateDocumentMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.updateDocument) {
    throw new Error("Document not found");
  }

  const document: APIDocument = response.data.updateDocument;
  return document;
}
