import { Avatar, IconButton } from "@mui/material";
import { Link } from "react-router-dom";

interface StaffIconProps {
  name?: string;
}

const StaffIcon = ({ name }: StaffIconProps) => {
  return (
    <IconButton
      aria-label="account"
      component={Link}
      to="/profile"
      className="p-[2px] sm:p-[6px]"
    >
      <Avatar
        className="h-7 w-7 text-[0.9rem] sm:h-9 sm:w-9 sm:text-[1.1rem] md:h-10 md:w-10 md:text-[1.25rem]"
      >
        {name ? name.slice(0, 1) : ""}
      </Avatar>
    </IconButton>
  );
};

export default StaffIcon;
