import { AuthContext } from "@app/providers/auth/AuthContext";
import { useContext, useMemo } from "react";

export function useAuthSessionSummary() {
  const {
    authStatus,
    isAuthenticated = false,
    isLoading = false,
    roles = [],
    isCognitoUserRole,
  } = useContext(AuthContext);

  return useMemo(
    () => ({
      authStatus,
      isAuthenticated,
      isLoading,
      roles,
      isCognitoUserRole,
    }),
    [authStatus, isAuthenticated, isLoading, isCognitoUserRole, roles],
  );
}
