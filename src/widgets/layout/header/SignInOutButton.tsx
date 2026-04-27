import { AuthContext } from "@app/providers/auth/AuthContext";
import SignInOutButtonView from "@shared/ui/header/SignInOutButton";
import StaffIcon from "@shared/ui/icon/StaffIcon";
import { useContext } from "react";

export function SignInOutButton() {
  const { signOut, signIn, cognitoUser, authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";

  if (authStatus === "configuring") {
    return null;
  }

  if (isAuthenticated) {
    if (!cognitoUser?.familyName) {
      return null;
    }

    return (
      <div className="block">
        <StaffIcon name={cognitoUser.familyName} />
      </div>
    );
  }

  return (
    <SignInOutButtonView
      isAuthenticated={isAuthenticated}
      isConfiguring={false}
      staffName={cognitoUser?.familyName}
      onSignIn={signIn}
      onSignOut={signOut}
    />
  );
}
