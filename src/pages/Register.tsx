import { Box } from "@mui/material";

import TimeRecorder from "../components/time_recorder/TimeRecorder";

export default function Register() {
  return (
    <Box
      sx={{
        height: 1,
        py: {
          xs: 2,
          md: 10,
        },
        justifyContent: "center",
        display: "flex",
      }}
    >
      <TimeRecorder />
    </Box>
  );
}
