import { TableCell } from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";
import dayjs from "dayjs";

type Props = {
  date?: string | null;
  format?: string;
  emptyLabel?: string;
  sx?: SxProps<Theme>;
};

export function DateDisplayCell({
  date,
  format = "YYYY/MM/DD",
  emptyLabel = "-",
  sx,
}: Props) {
  const content = date ? dayjs(date).format(format) : emptyLabel;
  return <TableCell sx={sx}>{content}</TableCell>;
}
