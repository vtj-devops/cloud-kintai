import { Box, CircularProgress } from "@mui/material";
import { FC } from "react";

/**
 * Full‑screen centered spinner used across the app.
 * It accepts optional size and color props to keep it flexible.
 */
export const CenteredSpinner: FC<{
  size?: number;
  color?: string;
}> = ({ size = 40, color = "primary" }) => (
  <Box
    sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CircularProgress size={size} color={color as any} />
  </Box>
);

export default CenteredSpinner;
