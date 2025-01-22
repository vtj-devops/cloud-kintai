import { Button, styled } from "@mui/material";
import { useEffect, useState } from "react";

import { WorkStatus, WorkStatusCodes } from "../common";

const ClockOutButton = styled(Button)(({ theme }) => ({
  color: theme.palette.clock_out.contrastText,
  backgroundColor: theme.palette.clock_out.main,
  border: `3px solid ${theme.palette.clock_out.main}`,
  width: 120,
  height: 120,
  borderRadius: 100,
  "&:hover": {
    color: theme.palette.clock_out.main,
    backgroundColor: theme.palette.clock_out.contrastText,
    border: `3px solid ${theme.palette.clock_out.main}`,
  },
  "&:disabled": {
    border: "3px solid #E0E0E0",
    backgroundColor: "#E0E0E0",
  },
}));

export default function ClockOutItem({
  workStatus,
  onClick,
}: {
  workStatus: WorkStatus | null;
  onClick: () => void;
}) {
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    setDisabled(workStatus?.code !== WorkStatusCodes.WORKING);
  }, [workStatus]);

  return (
    <ClockOutButton
      onClick={() => {
        setDisabled(true);
        onClick();
      }}
      size="large"
      variant={
        workStatus?.code === WorkStatusCodes.WORKING ? "outlined" : "contained"
      }
      disabled={disabled}
    >
      勤務終了
    </ClockOutButton>
  );
}
