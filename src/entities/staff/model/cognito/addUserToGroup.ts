/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { adminPost } from "@shared/api/amplify/adminQueriesClient";

export default async function addUserToGroup(
  username: string,
  groupname: string
) {
  await adminPost("/addUserToGroup", {
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      username,
      groupname,
    },
  }).catch((e) => {
    throw e;
  });
}
