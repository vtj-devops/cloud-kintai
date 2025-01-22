import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";

interface AuthenticatedUser {
  cognitoUserId: string;
}

export default function useAuthenticatedUser() {
  const { user } = useAuthenticator();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<
    AuthenticatedUser | undefined
  >(undefined);

  useEffect(() => {
    const cognitoUserId = user?.attributes?.sub;

    setLoading(true);
    setError(null);

    if (!cognitoUserId) {
      setLoading(false);
      setError(new Error("User is not authenticated"));
      setAuthenticatedUser(undefined);
      return;
    }

    setAuthenticatedUser({
      cognitoUserId,
    });
    setLoading(false);
  }, [user]);

  return {
    loading,
    error,
    authenticatedUser,
  };
}
