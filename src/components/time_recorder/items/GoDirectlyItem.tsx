import { Button, styled } from "@mui/material";
import { useEffect, useState } from "react";

import { WorkStatus, WorkStatusCodes } from "../common";

const GoDirectlyButton = styled(Button)(({ theme }) => ({
  color: theme.palette.clock_in.contrastText,
  backgroundColor: theme.palette.clock_in.main,
  border: `3px solid ${theme.palette.clock_in.main}`,
  width: 120,
  height: 120,
  borderRadius: 100,
  "&:hover": {
    color: theme.palette.clock_in.main,
    backgroundColor: theme.palette.clock_in.contrastText,
  },
  "&:disabled": {
    border: "3px solid #E0E0E0",
    backgroundColor: "#E0E0E0",
  },
}));

export default function GoDirectlyItem({
  workStatus,
  onClick,
}: {
  workStatus: WorkStatus | null;
  onClick: () => void;
}) {
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    setDisabled(workStatus?.code !== WorkStatusCodes.BEFORE_WORK);
  }, [workStatus]);

  return (
    <GoDirectlyButton
      onClick={() => {
        setDisabled(true);
        onClick();
      }}
      disabled={disabled}
    >
      直行
    </GoDirectlyButton>
  );
}
