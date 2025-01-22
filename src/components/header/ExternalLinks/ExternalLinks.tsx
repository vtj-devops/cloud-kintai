import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import { Unstable_Popup as BasePopup } from "@mui/base/Unstable_Popup";
import AppsIcon from "@mui/icons-material/Apps";
import { Box, Grid, IconButton, Paper, useMediaQuery } from "@mui/material";
import { useContext, useState } from "react";

import { AuthContext } from "@/Layout";

import { theme } from "../../../lib/theme";
import { LinkGridItem } from "./LinkGridItem";

export function ExternalLinks({ pathName }: { pathName: string }) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const isMobileSize = useMediaQuery(theme.breakpoints.down("md"));

  if (pathName === "/login") return null;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : event.currentTarget);
  };

  const open = Boolean(anchor);
  const id = open ? "external-links-popup" : undefined;

  const handleClickAway = () => {
    setAnchor(null);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box>
        <IconButton onClick={handleClick}>
          <AppsIcon
            sx={{
              color: "white",
            }}
          />
        </IconButton>
        <BasePopup
          id={id}
          open={open}
          anchor={anchor}
          placement={(() => (isMobileSize ? "bottom-end" : "bottom"))()}
        >
          <Paper
            elevation={3}
            sx={{
              width: "300px",
              height: "400px",
              m: 2,
              p: 2,
              border: `5px solid ${theme.palette.primary.main}`,
            }}
          >
            <Grid container spacing={1}>
              {TransportationExpensesLink()}
              <LinkGridItem
                url="http://172.16.1.12:3020/"
                title="休暇申請"
                iconType="holiday"
              />
            </Grid>
          </Paper>
        </BasePopup>
      </Box>
    </ClickAwayListener>
  );
}

function TransportationExpensesLink() {
  const { cognitoUser } = useContext(AuthContext);

  if (!cognitoUser) return null;

  const { familyName, givenName } = cognitoUser;
  const staffName = [familyName, givenName].join("%20");
  const url = `http://ginjiro.office.begi.net:3021/?code=%7B%22name%22:%22${staffName}%22,%22subject%22:%22%E5%87%BA%E7%A4%BE%22,%22list%22:%5B%5B0,%22%22,%22%22,%22%22,%22%22,%22%22,%22%22,%22%22%5D%5D%7D`;
  return <LinkGridItem url={url} title="交通費申請" iconType="train" />;
}
