import { Box, Typography } from "@mui/material";
import { FC } from "react";

/**
 * Empty state component used when there is no data to display.
 *
 * @param message The message to show. Defaults to a generic Japanese phrase.
 */
export const EmptyState: FC<{ message?: string }> = ({ message }) => (
  <Box
    sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "text.secondary",
      fontSize: "0.875rem",
    }}
  >
    <Typography variant="body2" component="div">
      {message ?? "表示可能な勤務データがありません"}
    </Typography>
  </Box>
);

export default EmptyState;
