import { TableCell as MuiTableCell, Typography } from "@mui/material";

export default function TableCell({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <MuiTableCell className={className}>
      <Typography variant="body2" component="div">
        {children}
      </Typography>
    </MuiTableCell>
  );
}
