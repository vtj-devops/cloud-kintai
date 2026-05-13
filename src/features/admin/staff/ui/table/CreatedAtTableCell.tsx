import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { DateDisplayCell } from "@shared/ui/table";

export function CreatedAtTableCell({ staff }: { staff: StaffType }) {
  return (
    <DateDisplayCell
      date={staff.createdAt}
      format="YYYY/MM/DD HH:mm"
      emptyLabel=""
    />
  );
}
