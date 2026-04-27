import enableStaff from "@entities/staff/model/cognito/enableStaff";
import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import PersonIcon from "@mui/icons-material/Person";
import { CircularProgress, ListItemIcon, ListItemText, MenuItem, } from "@mui/material";
import { UpdateStaffInput } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useState } from "react";
import { useDispatch } from "react-redux";

import * as MESSAGE_CODE from "@/errors";

export function EnableAccountMenuItem({ staff, updateStaff, }: {
    staff: StaffType;
    updateStaff: (input: UpdateStaffInput) => Promise<void>;
}) {
    const dispatch = useDispatch();
    const [isProcessing, setIsProcessing] = useState(false);
    const { id, cognitoUserId } = staff;
    const handleClick = async () => {
        setIsProcessing(true);
        await enableStaff(cognitoUserId).catch(() => {
            dispatch(pushNotification({
                tone: "success",
                message: MESSAGE_CODE.E12001
            }));
            setIsProcessing(false);
            throw new Error(MESSAGE_CODE.E12001);
        });
        await updateStaff({
            id: id,
            enabled: true,
        })
            .then(() => {
            dispatch(pushNotification({
                tone: "success",
                message: MESSAGE_CODE.S12001
            }));
        })
            .catch(() => {
            dispatch(pushNotification({
                tone: "success",
                message: MESSAGE_CODE.E12001
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
      <ListItemText>アカウントを有効化</ListItemText>
    </MenuItem>);
}
