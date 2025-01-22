import PersonIcon from "@mui/icons-material/Person";
import {
  CircularProgress,
  ListItemIcon,
  ListItemText,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";

import { UpdateStaffInput } from "../../../../API";
import * as MESSAGE_CODE from "../../../../errors";
import disableStaff from "../../../../hooks/common/disableStaff";
import { StaffType } from "../../../../hooks/useStaffs/useStaffs";
import { setSnackbarSuccess } from "../../../../lib/reducers/snackbarReducer";

export function DisableAccountMenuItem({
  staff,
  updateStaff,
}: {
  staff: StaffType;
  updateStaff: (input: UpdateStaffInput) => Promise<void>;
}) {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    setIsProcessing(true);
    const { id, cognitoUserId } = staff;
    await disableStaff(cognitoUserId).catch(() => {
      dispatch(setSnackbarSuccess(MESSAGE_CODE.E11001));
      setIsProcessing(false);
      throw new Error(MESSAGE_CODE.E11001);
    });

    await updateStaff({
      id,
      enabled: false,
    })
      .then(() => {
        dispatch(setSnackbarSuccess(MESSAGE_CODE.S11001));
      })
      .catch(() => {
        dispatch(setSnackbarSuccess(MESSAGE_CODE.E11001));
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  return (
    <MenuItem onClick={handleClick}>
      <ListItemIcon>
        {isProcessing ? (
          <CircularProgress size={18} />
        ) : (
          <PersonIcon fontSize="small" />
        )}
      </ListItemIcon>
      <ListItemText>アカウントを無効化</ListItemText>
    </MenuItem>
  );
}
