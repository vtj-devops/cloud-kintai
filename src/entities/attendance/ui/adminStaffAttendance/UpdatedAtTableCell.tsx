import { Attendance } from "@shared/api/graphql/types";
import { DateDisplayCell } from "@shared/ui/table";

const dateCellSx = {
  width: (theme: { spacing: (value: number) => string }) => theme.spacing(18),
  minWidth: (theme: { spacing: (value: number) => string }) =>
    theme.spacing(18),
  textAlign: "right",
  whiteSpace: "nowrap",
} as const;

export function UpdatedAtTableCell({
  updatedAt,
}: {
  updatedAt: Attendance["updatedAt"];
}) {
  return (
    <DateDisplayCell
      date={updatedAt}
      format="YYYY/MM/DD HH:mm"
      emptyLabel=""
      sx={dateCellSx}
    />
  );
}
