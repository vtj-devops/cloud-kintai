import { Box, Button, Stack } from "@mui/material";
import StaffIcon from "@shared/ui/icon/StaffIcon";
import { CSSProperties } from "react";

import { designTokenVar } from "@/shared/designSystem";

const SIGN_BUTTON_GAP = designTokenVar("component.headerSignButton.gap", "8px");
const SIGN_BUTTON_PADDING_X = designTokenVar(
  "component.headerSignButton.paddingX",
  "20px"
);
const SIGN_BUTTON_RADIUS = designTokenVar(
  "component.headerSignButton.borderRadius",
  "8px"
);
const SIGN_BUTTON_FONT_WEIGHT = designTokenVar(
  "component.headerSignButton.fontWeight",
  "500"
);

export interface SignInOutButtonProps {
  isAuthenticated: boolean;
  isConfiguring?: boolean;
  staffName?: string;
  onSignIn: () => void;
  onSignOut: () => void;
}

const SignInOutButton = ({
  isAuthenticated,
  isConfiguring = false,
  staffName,
  onSignIn,
  onSignOut,
}: SignInOutButtonProps) => {
  const signButtonVars: CSSProperties & Record<`--${string}`, string> = {
    "--sign-button-gap": SIGN_BUTTON_GAP,
    "--sign-button-padding-x": SIGN_BUTTON_PADDING_X,
    "--sign-button-radius": SIGN_BUTTON_RADIUS,
    "--sign-button-font-weight": SIGN_BUTTON_FONT_WEIGHT,
  };

  if (isConfiguring) {
    return null;
  }

  return (
    <Box className="block" style={signButtonVars}>
      <Stack direction="row" alignItems="center" className="gap-[var(--sign-button-gap)]">
        {isAuthenticated ? (
          <>
            <Button
              onClick={onSignOut}
              className="whitespace-nowrap rounded-[var(--sign-button-radius)] px-[var(--sign-button-padding-x)] font-[var(--sign-button-font-weight)]"
              sx={(theme) => ({
                color: theme.palette.logout.contrastText,
                backgroundColor: theme.palette.logout.main,
                border: `3px solid ${theme.palette.logout.main}`,
                "&:hover": {
                  color: theme.palette.logout.main,
                  backgroundColor: theme.palette.logout.contrastText,
                },
              })}
            >
              ログアウト
            </Button>
            {staffName && <StaffIcon name={staffName} />}
          </>
        ) : (
          <Button
            onClick={onSignIn}
            className="whitespace-nowrap rounded-[var(--sign-button-radius)] px-[var(--sign-button-padding-x)] font-[var(--sign-button-font-weight)]"
            sx={(theme) => ({
              color: theme.palette.login.contrastText,
              backgroundColor: theme.palette.login.main,
              "&:hover": {
                color: theme.palette.login.main,
                backgroundColor: theme.palette.login.contrastText,
              },
            })}
          >
            ログイン
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default SignInOutButton;
