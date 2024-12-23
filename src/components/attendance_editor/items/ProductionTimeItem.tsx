import { Box, Stack, Typography } from "@mui/material";

export default function ProductionTimeItem({ time }: { time: number }) {
  return (
    <Stack direction="row" alignItems={"center"}>
      <Box sx={{ fontWeight: "bold", width: "150px" }}>実稼働時間</Box>
      <Box sx={{ flexGrow: 2 }} textAlign={"right"}>
        <Typography variant="body1">{`${time.toFixed(1)}時間`}</Typography>
      </Box>
    </Stack>
  );
}
