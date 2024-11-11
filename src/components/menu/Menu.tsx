import { Box, Stack } from "@mui/material";

import Link from "../link/Link";

const Menu = () => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={2}
    sx={{ width: "auto", height: 1, boxSizing: "border-box" }}
  >
    <Box>
      <Link
        label="スタッフ管理"
        href="/admin/staff"
        color="secondary"
        sx={{ display: "block", height: 1, lineHeight: "32px", px: 1 }}
      />
    </Box>
    <Box>
      <Link
        label="勤怠管理"
        href="/admin/attendance"
        color="secondary"
        sx={{ display: "block", height: 1, lineHeight: "32px", px: 1 }}
      />
    </Box>
  </Stack>
);
export default Menu;
