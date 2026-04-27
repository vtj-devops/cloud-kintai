import { TableCell } from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";
import dayjs from "dayjs";

type Props = {
  time?: string | null;
  format?: string;
  emptyLabel?: string;
  sx?: SxProps<Theme>;
};

export function TimeDisplayCell({
  time,
  format = "H:mm",
  emptyLabel = "-",
  sx,
}: Props) {
  const content = time ? dayjs(time).format(format) : emptyLabel;
  return <TableCell sx={sx}>{content}</TableCell>;
}
