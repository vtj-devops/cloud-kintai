import { Button, styled } from "@mui/material";
import { useEffect, useState } from "react";

import { WorkStatus, WorkStatusCodes } from "../common";

const RestStartButton = styled(Button)(({ theme }) => ({
  color: theme.palette.rest.main,
  "&:hover": {
    color: theme.palette.rest.contrastText,
    backgroundColor: theme.palette.rest.main,
  },
  "&:disabled": {
    backgroundColor: "#E0E0E0",
  },
}));

export default function RestStartItem({
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
    <RestStartButton
      fullWidth
      onClick={() => {
        setDisabled(true);
        onClick();
      }}
      disabled={disabled}
    >
      休憩開始
    </RestStartButton>
  );
}
