import { styled, Typography } from "@mui/material";

export const Label = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  padding: theme.spacing(1),
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main,
}));
