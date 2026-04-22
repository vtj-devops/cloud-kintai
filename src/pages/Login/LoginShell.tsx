import { AuthContext } from "@app/providers/auth/AuthContext";
import { ThemeContextProvider } from "@app/providers/theme/ThemeContext";
import { useAuthenticator } from "@aws-amplify/ui-react";
import useCognitoUser from "@entities/staff/model/useCognitoUser";
import { ComponentProps, useMemo } from "react";

import Login from "./Login";

type AuthContextValue = ComponentProps<typeof AuthContext.Provider>["value"];

export default function LoginShell() {
  const { user, signOut, authStatus } = useAuthenticator();
  const { cognitoUser, isCognitoUserRole } = useCognitoUser();

  const authContextValue = useMemo<AuthContextValue>(
    () => ({
      signOut,
      signIn: () => undefined,
      isCognitoUserRole,
      user,
      authStatus,
      cognitoUser,
    }),
    [signOut, isCognitoUserRole, user, authStatus, cognitoUser],
  );
  return (
    <ThemeContextProvider>
      <AuthContext.Provider value={authContextValue}>
        <Login />
      </AuthContext.Provider>
    </ThemeContextProvider>
  );
}
