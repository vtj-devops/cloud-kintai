import { TableCell, TableRow } from "@mui/material";
import { ReactNode } from "react";

export type ComparisonTableRowProps = {
  label: string;
  beforeValue: ReactNode;
  afterValue: ReactNode;
  highlightDifference?: boolean;
};

export default function ComparisonTableRow({
  label,
  beforeValue,
  afterValue,
  highlightDifference = false,
}: ComparisonTableRowProps) {
  return (
    <TableRow
      sx={
        highlightDifference
          ? { backgroundColor: "rgba(255,193,7,0.12)" }
          : undefined
      }
    >
      <TableCell
        sx={{ whiteSpace: "nowrap", fontWeight: highlightDifference ? 600 : 400 }}
      >
        {label}
      </TableCell>
      <TableCell sx={{ whiteSpace: "pre-line" }}>{beforeValue}</TableCell>
      <TableCell
        sx={{
          whiteSpace: "pre-line",
          fontWeight: highlightDifference ? 600 : 400,
          color: highlightDifference ? "warning.dark" : undefined,
        }}
      >
        {afterValue}
      </TableCell>
    </TableRow>
  );
}
