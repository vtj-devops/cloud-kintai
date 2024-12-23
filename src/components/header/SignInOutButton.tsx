import { Box, Stack } from "@mui/material";
import { useContext } from "react";

import { AuthContext } from "../../Layout";
import { SignInButton,SignOutButton } from "./Header";
import StaffIcon from "./StaffIcon";

export function SignInOutButton({ pathName }: { pathName: string }) {
  const { signOut, signIn, cognitoUser } = useContext(AuthContext);

  if (pathName === "/login") return null;

  return (
    <Box
      sx={{
        display: {
          xs: "none",
          md: "block",
        },
      }}
    >
      <Stack direction="row" alignItems={"center"} spacing={1}>
        <Box>
          {cognitoUser?.id ? (
            <SignOutButton onClick={signOut}>ログアウト</SignOutButton>
          ) : (
            <SignInButton onClick={signIn}>ログイン</SignInButton>
          )}
        </Box>
        {cognitoUser && (
          <Box>
            <StaffIcon name={cognitoUser.familyName} />
          </Box>
        )}
      </Stack>
    </Box>
  );
}
