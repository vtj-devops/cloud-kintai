import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#0FA85E",
      }}
    >
      <Box textAlign="center" sx={{ p: 1 }}>
        <Typography
          sx={{
            variant: "body2",
            color: "white",
          }}
        >
          © 2024 Virtual Tech Japan Inc.
        </Typography>
      </Box>
    </footer>
  );
}
