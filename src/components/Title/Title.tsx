import { Typography } from "@mui/material";

export default function Title({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="h4"
      sx={{ pl: 1, borderBottom: "solid 5px #0FA85E", color: "#0FA85E" }}
    >
      {children}
    </Typography>
  );
}
