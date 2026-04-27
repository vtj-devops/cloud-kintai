import disableStaff from "@entities/staff/model/cognito/disableStaff";
import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import PersonIcon from "@mui/icons-material/Person";
import { CircularProgress, ListItemIcon, ListItemText, MenuItem, } from "@mui/material";
import { UpdateStaffInput } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useState } from "react";
import { useDispatch } from "react-redux";

import * as MESSAGE_CODE from "@/errors";

export function DisableAccountMenuItem({ staff, updateStaff, }: {
    staff: StaffType;
    updateStaff: (input: UpdateStaffInput) => Promise<void>;
}) {
    const dispatch = useDispatch();
    const [isProcessing, setIsProcessing] = useState(false);
    const handleClick = async () => {
        setIsProcessing(true);
        const { id, cognitoUserId } = staff;
        await disableStaff(cognitoUserId).catch(() => {
            dispatch(pushNotification({
                tone: "success",
                message: MESSAGE_CODE.E11001
            }));
            setIsProcessing(false);
            throw new Error(MESSAGE_CODE.E11001);
        });
        await updateStaff({
            id,
            enabled: false,
        })
            .then(() => {
            dispatch(pushNotification({
                tone: "success",
                message: MESSAGE_CODE.S11001
            }));
        })
            .catch(() => {
            dispatch(pushNotification({
                tone: "success",
                message: MESSAGE_CODE.E11001
            }));
        })
            .finally(() => {
            setIsProcessing(false);
        });
    };
    return (<MenuItem onClick={handleClick}>
      <ListItemIcon>
        {isProcessing ? (<CircularProgress size={18}/>) : (<PersonIcon fontSize="small"/>)}
      </ListItemIcon>
      <ListItemText>アカウントを無効化</ListItemText>
    </MenuItem>);
}
