import "@aws-amplify/ui-react/styles.css";
import "./styles.scss";

import { Authenticator } from "@aws-amplify/ui-react";
import { Button, Stack, Typography } from "@mui/material";
import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import logo from "./logo_large.png";

export default function Login() {
  const { authStatus, cognitoUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const from = (location.state?.from as string) || "/";

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (!cognitoUser?.id) return;

    if (!cognitoUser.emailVerified) return;

    navigate(from, { replace: true });
  }, [authStatus, navigate, from, cognitoUser]);

  return (
    <Stack
      direction="column"
      spacing={2}
      justifyContent="center"
      alignItems="center"
      className="pt-0 sm:pt-10"
    >
      <div className="hidden sm:block">
        <img src={logo} height={200} />
      </div>
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
