import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import {
  CreateDocumentInput,
  CreateDocumentMutation,
  Document as APIDocument,
} from "../../API";
import { createDocument } from "../../graphql/mutations";

export default async function createDocumentData(input: CreateDocumentInput) {
  const response = (await API.graphql({
    query: createDocument,
    variables: { input },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<CreateDocumentMutation>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.createDocument) {
    throw new Error("Document not found");
  }

  const document: APIDocument = response.data.createDocument;
  return document;
}
