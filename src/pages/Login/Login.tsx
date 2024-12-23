import "@aws-amplify/ui-react/styles.css";
import "./styles.scss";

import { Authenticator } from "@aws-amplify/ui-react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AuthContext } from "../../Layout";
import logo from "./logo_large.png";

export default function Login() {
  const { user, authStatus } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const from = (location.state?.from as string) || "/";

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (!user?.attributes?.sub) return;

    const isMailVerified = user?.attributes?.email_verified ? true : false;
    if (!isMailVerified) return;

    navigate(from, { replace: true });
  }, [authStatus, navigate, from, user]);

  return (
    <Stack
      direction="column"
      spacing={2}
      justifyContent={"center"}
      alignItems={"center"}
      sx={{
        pt: {
          xs: 0,
          sm: 10,
        },
      }}
    >
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <img src={logo} height={200} />
      </Box>
      <Authenticator hideSignUp>
        {({ signOut }) => {
          if (signOut) {
            return (
              <Stack direction="column" spacing={2}>
                <Typography variant="body1">
                  画面が切り替わらない場合は、再度、ログインしてください。
                </Typography>
                <Button variant="text" size="medium" onClick={signOut}>
                  ログアウト
                </Button>
              </Stack>
            );
          }

          return (
            <Typography variant="body1">
              画面が切り替わらない場合は、ブラウザを再読み込みしてください。
            </Typography>
          );
        }}
      </Authenticator>
    </Stack>
  );
}
