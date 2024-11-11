import { Link as MuiLink, SxProps, Theme } from "@mui/material";

interface LinkProps {
  label?: string;
  href?: string;
  color?: "primary" | "secondary";
  sx?: SxProps<Theme> | undefined;
  onClick?: () => void;
}

const Link = ({
  label = "link",
  href = "/",
  color = "primary",
  onClick = () => {},
  sx = {},
}: LinkProps) => (
  <MuiLink href={href} variant="button" color={color} sx={sx} onClick={onClick}>
    {label}
  </MuiLink>
);
export default Link;
