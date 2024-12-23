/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { API, Auth } from "aws-amplify";

export default async function updateCognitoUser(
  username: string,
  familyName: string,
  givenName: string,
  mailAddress: string,
  owner: boolean
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
      userAttributes: [
        { Name: "family_name", Value: familyName },
        { Name: "given_name", Value: givenName },
        { Name: "email", Value: mailAddress },
        { Name: "custom:owner", Value: owner ? "1" : "0" },
      ],
    },
  };

  await API.post("AdminQueries", "/updateUser", params).catch((e) => {
    throw e;
  });
}
