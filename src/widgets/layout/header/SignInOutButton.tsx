import { Box } from "@mui/material";
import SignInOutButtonView from "@shared/ui/header/SignInOutButton";
import StaffIcon from "@shared/ui/icon/StaffIcon";
import { useContext } from "react";

import { AuthContext } from "@/context/AuthContext";

const DESKTOP_ONLY_DISPLAY = {
  xs: "block",
  lg: "block",
} as const;

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
      <Box sx={{ display: DESKTOP_ONLY_DISPLAY }}>
        <StaffIcon name={cognitoUser.familyName} />
      </Box>
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
