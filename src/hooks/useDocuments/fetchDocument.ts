import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import { Document as APIDocument, GetDocumentQuery } from "../../API";
import { getDocument } from "../../graphql/queries";

export default async function fetchDocument(id: APIDocument["id"]) {
  const response = (await API.graphql({
    query: getDocument,
    variables: { id },
    authMode: "AMAZON_COGNITO_USER_POOLS",
  })) as GraphQLResult<GetDocumentQuery>;

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data?.getDocument) {
    throw new Error("Document not found");
  }

  const document: APIDocument = response.data.getDocument;
  return document;
}
