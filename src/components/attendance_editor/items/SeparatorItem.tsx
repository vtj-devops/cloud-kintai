import { Box, Stack } from "@mui/material";

export default function SeparatorItem() {
  return (
    <Stack direction="row" alignItems={"center"}>
      <Box sx={{ fontWeight: "bold", width: "150px" }}></Box>
      <Box sx={{ flexGrow: 2 }}>
        <hr />
      </Box>
    </Stack>
  );
}
