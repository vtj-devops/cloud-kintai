import { Box, Container, Stack } from "@mui/material";

import AttendanceList from "../components/AttendanceList/AttendanceList";

export default function List() {
  return (
    <Container maxWidth="xl">
      <Stack direction="column" sx={{ height: 1, pt: 2, display: "flex" }}>
        <Box sx={{ height: 1 }}>
          <AttendanceList />
        </Box>
      </Stack>
    </Container>
  );
}
