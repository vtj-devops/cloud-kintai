import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { AppEditIconButton } from "@shared/ui/button/AppActionIconButton";
import { useNavigate } from "react-router-dom";

export function EditButton({ staff }: { staff: StaffType }) {
  const navigate = useNavigate();

  const handleClick = () => {
    const { cognitoUserId } = staff;
    navigate(`/admin/staff/${cognitoUserId}/edit`);
  };
  return (
    <AppEditIconButton
      aria-label="スタッフを編集"
      size="sm"
      onClick={handleClick}
    />
  );
}
