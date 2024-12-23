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
import enableStaff from "../../../../hooks/common/enableStaff";
import { StaffType } from "../../../../hooks/useStaffs/useStaffs";
import { setSnackbarSuccess } from "../../../../lib/reducers/snackbarReducer";

export function EnableAccountMenuItem({
  staff,
  updateStaff,
}: {
  staff: StaffType;
  updateStaff: (input: UpdateStaffInput) => Promise<void>;
}) {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);

  const { id, cognitoUserId } = staff;

  const handleClick = async () => {
    setIsProcessing(true);
    await enableStaff(cognitoUserId).catch(() => {
      dispatch(setSnackbarSuccess(MESSAGE_CODE.E12001));
      setIsProcessing(false);
      throw new Error(MESSAGE_CODE.E12001);
    });

    await updateStaff({
      id: id,
      enabled: true,
    })
      .then(() => {
        dispatch(setSnackbarSuccess(MESSAGE_CODE.S12001));
      })
      .catch(() => {
        dispatch(setSnackbarSuccess(MESSAGE_CODE.E12001));
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
      <ListItemText>アカウントを有効化</ListItemText>
    </MenuItem>
  );
}
