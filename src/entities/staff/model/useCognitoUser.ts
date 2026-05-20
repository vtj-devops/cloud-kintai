import { useAuthenticator } from "@aws-amplify/ui-react";
import {
  mapCognitoGroupsToStaffRoles,
  StaffRole,
} from "@entities/staff/lib/staffRoleMapping";
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";

export interface CognitoUser {
  id: string;
  givenName: string;
  familyName: string;
  mailAddress: string;
  owner: boolean;
  roles: StaffRole[];
  emailVerified: boolean;
}

export function mapTokenCognitoGroupsToRoles(groups: readonly string[]): StaffRole[] {
  return mapCognitoGroupsToStaffRoles(groups, {
    unknownGroupFallback: StaffRole.GUEST,
    emptyGroupsFallback: [StaffRole.GUEST],
  });
}

export default function useCognitoUser() {
  const { user, authStatus } = useAuthenticator();
  const [loading, setLoading] = useState(true);
  const [cognitoUser, setCognitoUser] = useState<
    CognitoUser | null | undefined
  >(undefined);

  useEffect(() => {
    if (authStatus === "configuring") return;

    let isMounted = true;

    const resolveCognitoUser = async () => {
      setLoading(true);

      if (authStatus !== "authenticated" || !user) {
        if (isMounted) {
          setCognitoUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken;
        const payload = idToken?.payload;

        if (!payload) {
          throw new Error("Missing ID token payload");
        }

        const sub = typeof payload.sub === "string" ? payload.sub : undefined;
        if (!sub) {
          throw new Error("Missing user sub");
        }

        const userGroups = Array.isArray(payload["cognito:groups"])
          ? ([...payload["cognito:groups"]] as string[])
          : [];

        const ownerRaw = payload["custom:owner"];
        const owner = ownerRaw === "1" || ownerRaw === 1 || ownerRaw === true;

        const emailVerifiedRaw = payload.email_verified;
        const emailVerified =
          typeof emailVerifiedRaw === "string"
            ? emailVerifiedRaw === "true"
            : Boolean(emailVerifiedRaw);

        const mappedRoles = mapTokenCognitoGroupsToRoles(userGroups);

        if (isMounted) {
          setCognitoUser({
            id: sub,
            givenName:
              typeof payload.given_name === "string" ? payload.given_name : "",
            familyName:
              typeof payload.family_name === "string"
                ? payload.family_name
                : "",
            mailAddress: typeof payload.email === "string" ? payload.email : "",
            owner,
            roles: mappedRoles,
            emailVerified,
          });
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setCognitoUser(null);
          setLoading(false);
        }
      }
    };

    void resolveCognitoUser();

    return () => {
      isMounted = false;
    };
  }, [user, authStatus]);

  const isCognitoUserRole = (role: StaffRole) => {
    if (!cognitoUser) {
      return false;
    }

    return cognitoUser.roles.includes(role);
  };

  return { loading, cognitoUser, isCognitoUserRole };
}
