import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";

import { StaffRole } from "./useStaffs/useStaffs";

export interface CognitoUser {
  id: string;
  givenName: string;
  familyName: string;
  mailAddress: string;
  owner: boolean;
  roles: StaffRole[];
}

export default function useCognitoUser() {
  const { user, authStatus } = useAuthenticator();
  const [loading, setLoading] = useState(true);
  const [cognitoUser, setCognitoUser] = useState<
    CognitoUser | null | undefined
  >(undefined);

  useEffect(() => {
    if (authStatus === "configuring") return;

    if (authStatus === "unauthenticated") {
      setLoading(false);
      return;
    }

    if (!user) {
      setCognitoUser(null);
      setLoading(false);
      return;
    }

    const userAttributes = user.attributes;
    if (!userAttributes) {
      setCognitoUser(null);
      setLoading(false);
      return;
    }

    const { sub: id } = userAttributes;

    const signInUserSession = user.getSignInUserSession();
    if (!signInUserSession) {
      setCognitoUser(null);
      setLoading(false);
      return;
    }

    const idToken = signInUserSession.getIdToken();
    const userGroups: string[] = idToken.payload["cognito:groups"]
      ? idToken.payload["cognito:groups"]
      : [];

    if (!user?.attributes?.sub) {
      setCognitoUser(null);
      setLoading(false);
      return;
    }

    setCognitoUser({
      id,
      givenName: user.attributes.given_name,
      familyName: user.attributes.family_name,
      mailAddress: user.attributes.email,
      owner: !!user.attributes["custom:owner"],
      roles: (() => {
        if (userGroups.length === 0) {
          return [StaffRole.GUEST];
        }

        return userGroups.map((group) => {
          switch (group) {
            case "Admin":
              return StaffRole.ADMIN;
            case "StaffAdmin":
              return StaffRole.STAFF_ADMIN;
            case "Staff":
              return StaffRole.STAFF;
            default:
              return StaffRole.GUEST;
          }
        });
      })(),
    });
    setLoading(false);
  }, [user, authStatus]);

  const isCognitoUserRole = (role: StaffRole) => {
    if (!cognitoUser) {
      return false;
    }

    return cognitoUser.roles.includes(role);
  };

  return { loading, cognitoUser, isCognitoUserRole };
}
