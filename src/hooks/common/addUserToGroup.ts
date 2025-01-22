/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { API, Auth } from "aws-amplify";

export default async function addUserToGroup(
  username: string,
  groupname: string
) {
  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: (await Auth.currentSession())
        .getAccessToken()
        .getJwtToken(),
    },
    body: {
      username,
      groupname,
    },
  };

  await API.post("AdminQueries", "/addUserToGroup", params).catch((e) => {
    throw e;
  });
}
