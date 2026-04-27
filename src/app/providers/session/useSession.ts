import { AuthContext } from "@app/providers/auth/AuthContext";
import { useContext } from "react";

export function useSession() {
  const context = useContext(AuthContext);
  const hasRole = context.hasRole ?? context.isCognitoUserRole;

  return {
    ...context,
    session: context.session ?? { roles: context.roles ?? [] },
    hasRole,
    isAuthenticated: context.isAuthenticated ?? false,
    isLoading: context.isLoading ?? false,
    roles: context.roles ?? context.session?.roles ?? [],
  };
}
