import { Box, Skeleton } from "@mui/material";
import { FC } from "react";

/**
 * Skeleton placeholder for form layouts.
 * @param rows Number of form rows to display.
 * @param columns Number of columns per row.
 */
export const FormSkeleton: FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 2 }) => (
  <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="rectangular" height={40} />
    ))}
  </Box>
);

export default FormSkeleton;
