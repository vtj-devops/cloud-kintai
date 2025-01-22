import { Avatar, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function StaffIcon({ name }: { name: string | undefined }) {
  const navigate = useNavigate();

  return (
    <IconButton aria-label="account" onClick={() => navigate("/profile")}>
      <Avatar>{name ? name.slice(0, 1) : ""}</Avatar>
    </IconButton>
  );
}
