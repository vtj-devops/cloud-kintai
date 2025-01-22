import { GraphQLResult } from "@aws-amplify/api";
import { API } from "aws-amplify";

import { Document as APIDocument, ListDocumentsQuery } from "../../API";
import { listDocuments } from "../../graphql/queries";

export default async function fetchDocuments() {
  const documents: APIDocument[] = [];
  let nextToken: string | null = null;
  const isLooping = true;
  while (isLooping) {
    const response = (await API.graphql({
      query: listDocuments,
      authMode: "AMAZON_COGNITO_USER_POOLS",
      variables: { nextToken },
    })) as GraphQLResult<ListDocumentsQuery>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.listDocuments) {
      throw new Error("Document not found");
    }

    documents.push(
      ...response.data.listDocuments.items.filter(
        (item): item is NonNullable<typeof item> => Boolean(item)
      )
    );

    if (response.data.listDocuments.nextToken) {
      nextToken = response.data.listDocuments.nextToken;
      continue;
    }

    break;
  }

  return documents;
}
