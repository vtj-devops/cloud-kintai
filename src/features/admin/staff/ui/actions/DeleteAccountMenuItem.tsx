import deleteCognitoUser from "@entities/staff/model/cognito/deleteCognitoUser";
import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import DeleteIcon from "@mui/icons-material/Delete";
import { CircularProgress, ListItemIcon, ListItemText, MenuItem, } from "@mui/material";
import { DeleteStaffInput } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useState } from "react";
import { useDispatch } from "react-redux";

import * as MESSAGE_CODE from "@/errors";

export function DeleteAccountMenuItem({ staff, deleteStaff, }: {
    staff: StaffType;
    deleteStaff: (input: DeleteStaffInput) => Promise<void>;
}) {
    const dispatch = useDispatch();
    const [isProcessing, setIsProcessing] = useState(false);
    const handleClick = async () => {
        setIsProcessing(true);
        const { id, cognitoUserId, familyName, givenName } = staff;
        const deleteMessage = (() => {
            const messages = [];
            messages.push(`「${familyName} ${givenName}」のアカウントを削除します。`);
            messages.push("削除すると元に戻せないことを理解した上で、削除処理を実行しますか?");
            return messages.join("\n");
        })();
        // eslint-disable-next-line no-alert
        const result = window.confirm(deleteMessage);
        if (!result)
            return;
        await deleteCognitoUser(cognitoUserId)
            .catch(() => dispatch(pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E10004
        })))
            .finally(() => setIsProcessing(false));
        await deleteStaff({ id })
            .then(() => dispatch(pushNotification({
            tone: "success",
            message: MESSAGE_CODE.S10004
        })))
            .catch(() => dispatch(pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E10004
        })))
            .finally(() => setIsProcessing(false));
    };
    return (<MenuItem onClick={handleClick}>
      <ListItemIcon>
        {isProcessing ? (<CircularProgress size={18}/>) : (<DeleteIcon fontSize="small"/>)}
      </ListItemIcon>
      <ListItemText>アカウントを削除</ListItemText>
    </MenuItem>);
}
