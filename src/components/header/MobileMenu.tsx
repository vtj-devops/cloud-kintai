import HelpIcon from "@mui/icons-material/Help";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import ViewListIcon from "@mui/icons-material/ViewList";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../Layout";
import { theme } from "../../lib/theme";

export default function MobileMenu({ pathName }: { pathName: string }) {
  const { signOut } = useContext(AuthContext);
  const navigate = useNavigate();
  const [state, setState] = useState(false);

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }

      setState(open);
    };

  const MenuList = () => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              navigate("/attendance/list");
            }}
          >
            <ListItemIcon>
              <ViewListIcon />
            </ListItemIcon>
            <ListItemText primary={"勤怠一覧"} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              navigate("/docs");
            }}
          >
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary={"ドキュメント"} />
          </ListItemButton>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton
            sx={{
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
            }}
            onClick={signOut}
          >
            <ListItemIcon>
              <LogoutIcon sx={{ color: theme.palette.error.contrastText }} />
            </ListItemIcon>
            <ListItemText primary={"サインアウト"} />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
    </Box>
  );

  if (pathName === "/login") return null;

  return (
    <Box
      sx={{
        textAlign: "right",
        display: { xs: "block", md: "none" },
      }}
    >
      <IconButton onClick={toggleDrawer(true)}>
        <MenuIcon
          sx={{
            color: "white",
          }}
        />
      </IconButton>
      <Drawer anchor={"right"} open={state} onClose={toggleDrawer(false)}>
        <MenuList />
      </Drawer>
    </Box>
  );
}
