import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { DateDisplayCell } from "@shared/ui/table";

export function UpdatedAtTableCell({ staff }: { staff: StaffType }) {
  return (
    <DateDisplayCell
      date={staff.updatedAt}
      format="YYYY/MM/DD HH:mm"
      emptyLabel=""
    />
  );
}
