/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { adminPost } from "@shared/api/amplify/adminQueriesClient";

export default async function deleteCognitoUser(username: string) {
  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      username,
    },
  };

  return adminPost("/deleteUser", params).catch((e) => {
    throw e;
  });
}
