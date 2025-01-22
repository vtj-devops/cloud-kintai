// cspell:words testid
import { Button as MuiButton, styled } from "@mui/material";

import { Color, Variant } from "../../lib/theme";

type Size = "small" | "medium" | "large";

const GeneralButton = styled(MuiButton)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main,
}));

export interface ButtonProps {
  color?: Color;
  variant?: Variant;
  disabled?: boolean;
  size?: Size;
  label?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  onClick?: () => void;
}

export default function Button({ label, ...props }: ButtonProps) {
  return <GeneralButton {...props}>{label}</GeneralButton>;
}
