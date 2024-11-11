import EditIcon from "@mui/icons-material/Edit";
import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { StaffType } from "../../../hooks/useStaffs/useStaffs";

export function EditButton({ staff }: { staff: StaffType }) {
  const navigate = useNavigate();

  const handleClick = () => {
    const { cognitoUserId } = staff;
    navigate(`/admin/staff/${cognitoUserId}/edit`);
  };
  return (
    <IconButton size="small" onClick={handleClick}>
      <EditIcon fontSize="small" />
    </IconButton>
  );
}
