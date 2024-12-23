import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import React from "react";

const Clock = () => {
  const [time, setTime] = React.useState(dayjs().format("YYYY/MM/DD HH:mm:ss"));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs().format("YYYY/MM/DD HH:mm:ss"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box bgcolor="black" textAlign="center" sx={{ p: 3 }} borderRadius="5px">
      <Typography variant="h4" color="white">
        {time}
      </Typography>
    </Box>
  );
};

export default Clock;
