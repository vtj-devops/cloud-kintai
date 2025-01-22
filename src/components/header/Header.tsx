import { Button, Container, Stack, styled } from "@mui/material";
import { useEffect, useState } from "react";

import DesktopMenu from "./DesktopMenu";
import { ExternalLinks } from "./ExternalLinks/ExternalLinks";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import { SignInOutButton } from "./SignInOutButton";

export const SignOutButton = styled(Button)(({ theme }) => ({
  color: theme.palette.logout.contrastText,
  backgroundColor: theme.palette.logout.main,
  border: `3px solid ${theme.palette.logout.main}`,
  whiteSpace: "nowrap",
  paddingLeft: "1rem",
  paddingRight: "1rem",
  "&:hover": {
    color: theme.palette.logout.main,
    backgroundColor: theme.palette.logout.contrastText,
  },
}));

export const SignInButton = styled(Button)(({ theme }) => ({
  color: theme.palette.login.contrastText,
  backgroundColor: theme.palette.login.main,
  whiteSpace: "nowrap",
  paddingLeft: "1rem",
  paddingRight: "1rem",
  "&:hover": {
    color: theme.palette.login.main,
    backgroundColor: theme.palette.login.contrastText,
  },
}));

export default function Header() {
  const [pathName, setPathName] = useState("/register");

  useEffect(() => {
    const url = new URL(window.location.href);
    const name = url.pathname === "/" ? "/register" : url.pathname;
    setPathName(name);
  }, [window.location.href]);

  return (
    <header
      style={{
        backgroundColor: "#0FA85E",
      }}
    >
      <Container maxWidth="xl" sx={{ p: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          color="white"
          sx={{ p: 1, height: "50px", boxSizing: "border-box" }}
          spacing={{
            xs: 0,
            md: 2,
          }}
        >
          <Logo />
          <DesktopMenu pathName={pathName} />
          <ExternalLinks pathName={pathName} />
          <MobileMenu pathName={pathName} />
          <SignInOutButton pathName={pathName} />
        </Stack>
      </Container>
    </header>
  );
}
