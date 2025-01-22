import { AmplifyUser, AuthEventData, AuthStatus } from "@aws-amplify/ui";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Box, LinearProgress, Stack } from "@mui/material";
import { Storage } from "aws-amplify";
import { createContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import SnackbarGroup from "./components/ snackbar/SnackbarGroup";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";
import useCognitoUser, { CognitoUser } from "./hooks/useCognitoUser";
import { StaffRole } from "./hooks/useStaffs/useStaffs";

type AuthContextProps = {
  signOut: (data?: AuthEventData | undefined) => void;
  signIn: () => void;
  isCognitoUserRole: (role: StaffRole) => boolean;
  user?: AmplifyUser;
  authStatus?: AuthStatus;
  cognitoUser?: CognitoUser | null;
};

export const AuthContext = createContext<AuthContextProps>({
  signOut: () => {
    console.log("The process is not implemented.");
  },
  signIn: () => {
    console.log("The process is not implemented.");
  },
  isCognitoUserRole: () => false,
});

export default function Layout() {
  const navigate = useNavigate();
  const { user, signOut, authStatus } = useAuthenticator();
  const {
    cognitoUser,
    isCognitoUserRole,
    loading: cognitoUserLoading,
  } = useCognitoUser();

  console.log("VITE_COMMIT_HASH", import.meta.env.VITE_COMMIT_HASH);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname === "/login") return;

    if (authStatus === "unauthenticated") {
      navigate("/login");
      return;
    }

    if (authStatus !== "authenticated") return;

    const isMailVerified = user?.attributes?.email_verified ? true : false;
    if (isMailVerified) return;

    alert(
      "メール認証が完了していません。ログイン時にメール認証を行なってください。"
    );

    try {
      void signOut();
    } catch (error) {
      console.error(error);
    }
  }, [authStatus, user, window.location.href]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    void Storage.get("revision.json", { download: true })
      .then((result) => {
        if (!result.Body) return;
        result.Body.text()
          .then((text) => {
            const revision = JSON.parse(text).revision as string;
            if (revision) {
              const currentRevision = localStorage.getItem("revision");
              if (currentRevision !== revision) {
                localStorage.setItem("revision", revision);
              }
            }
          })
          .catch((e) => {
            throw e;
          });
      })
      .catch(() => {
        console.error("Version check error");
      });

    setInterval(() => {
      void Storage.get("revision.json", { download: true })
        .then((result) => {
          if (!result.Body) return;
          result.Body.text()
            .then((text) => {
              const revision = JSON.parse(text).revision as string;
              const currentRevision = localStorage.getItem("revision");
              if (currentRevision === revision) return;

              if (currentRevision) {
                // eslint-disable-next-line no-alert
                const result = window.confirm(
                  "新しいバージョンがリリースされました、すぐに反映しますか？"
                );

                if (result) {
                  window.location.reload();
                  localStorage.setItem("revision", revision);
                }
              }
            })
            .catch((e) => {
              throw e;
            });
        })
        .catch(() => {
          console.error("Version check error");
        });
    }, 1000 * 60 * 60);
  }, [authStatus]);

  if (cognitoUserLoading) {
    return <LinearProgress />;
  }

  const signIn = () => {
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        signOut,
        signIn,
        isCognitoUserRole,
        user,
        authStatus,
        cognitoUser,
      }}
    >
      <Stack sx={{ height: "100vh" }}>
        <Box>
          <Header />
        </Box>
        <Box sx={{ flexGrow: 2 }}>
          <Outlet />
        </Box>
        <Box>
          <Footer />
        </Box>
        <SnackbarGroup />
      </Stack>
    </AuthContext.Provider>
  );
}
