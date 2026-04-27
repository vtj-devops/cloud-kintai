import {
  Box,
  CircularProgress,
  type CircularProgressProps,
} from "@mui/material";
import { FC } from "react";

type CenteredSpinnerProps = {
  size?: number;
  color?: CircularProgressProps["color"];
};

/**
 * Full‑screen centered spinner used across the app.
 * It accepts optional size and color props to keep it flexible.
 */
export const CenteredSpinner: FC<CenteredSpinnerProps> = ({
  size = 40,
  color = "primary",
}) => (
  <Box
    sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CircularProgress size={size} color={color} />
  </Box>
);

export default CenteredSpinner;
