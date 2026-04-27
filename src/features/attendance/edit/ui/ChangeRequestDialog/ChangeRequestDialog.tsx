import { type UpdateAttendanceMutationArg } from "@entities/attendance/api/attendanceApi";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { Stack, TextField, Typography, } from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import { GenericMailSender } from "@shared/lib/mail/GenericMailSender";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import AppDialog from "@shared/ui/feedback/AppDialog";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

import { ChangeRequestDiffTable } from "./ChangeRequestDiffTable";
import handleApproveChangeRequest from "./handleApproveChangeRequest";
import handleRejectChangeRequest from "./handleRejectChangeRequest";

export default function ChangeRequestDialog({ attendance, updateAttendance, staff, }: {
    attendance: Attendance | null;
    updateAttendance: (input: UpdateAttendanceMutationArg) => Promise<Attendance>;
    staff: StaffType | null | undefined;
}) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [comment, setComment] = useState<string | undefined>(undefined);
    const [manualClose, setManualClose] = useState(false);
    // 派生状態として計算：未完了の変更リクエストがあれば表示
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open: shouldOpen, changeRequest } = useMemo(() => {
        if (!attendance?.changeRequests) {
            return { open: false, changeRequest: null };
        }
        const changeRequests = attendance.changeRequests
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .filter((item) => !item.completed);
        if (changeRequests.length === 0) {
            return { open: false, changeRequest: null };
        }
        return { open: true, changeRequest: changeRequests[0] };
    }, [attendance?.changeRequests]);
    // 実際の表示状態（手動で閉じられていない場合のみ表示）
    const open = shouldOpen && !manualClose;
    // changeRequestが変わったらmanualCloseをリセット
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setManualClose(false);
    }, [changeRequest]);
    const handleClose = () => {
        setManualClose(true);
    };
    const getWorkDate = () => {
        if (!attendance)
            return "";
        const { workDate } = attendance;
        if (!dayjs(workDate).isValid())
            return "";
        return dayjs(workDate).format(AttendanceDate.DisplayFormat);
    };
    if (!attendance || !changeRequest) {
        return null;
    }
    return (<AppDialog open={open} onClose={handleClose} fullWidth maxWidth="md" title={`変更リクエスト(勤務日: ${getWorkDate()})`} actions={<>
        <AppButton variant="ghost" onClick={handleClose}>閉じる</AppButton>
        <AppButton variant="solid" tone="danger" onClick={() => {
            handleRejectChangeRequest(attendance, updateAttendance, comment)
                .then(async (updatedAttendance) => {
                if (!staff || !updatedAttendance) {
                    throw new Error(MESSAGE_CODE.E00002);
                }
                try {
                    await new GenericMailSender(staff, updatedAttendance).rejectChangeRequest(comment);
                }
                catch (mailError) {
                    console.error("Failed to send rejection notification mail:", mailError);
                }
                dispatch(pushNotification({
                    tone: "success",
                    message: MESSAGE_CODE.S04007
                }));
                handleClose();
            })
                .catch(() => dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E04007
            })));
            handleClose();
        }}>
          却下
        </AppButton>
        <AppButton variant="solid" onClick={() => {
            handleApproveChangeRequest(attendance, updateAttendance, comment)
                .then(async (updatedAttendance) => {
                if (!staff || !updatedAttendance) {
                    throw new Error(MESSAGE_CODE.E00002);
                }
                try {
                    await new GenericMailSender(staff, updatedAttendance).approveChangeRequest(comment);
                }
                catch (mailError) {
                    console.error("Failed to send approval notification mail:", mailError);
                }
                dispatch(pushNotification({
                    tone: "success",
                    message: "勤怠情報の変更リクエストを承認しました",
                    description: updatedAttendance.workDate
                        ? `${updatedAttendance.workDate} の勤怠情報の変更リクエストが承認されました`
                        : undefined
                }));
                navigate(`/admin/staff/${updatedAttendance.staffId}/attendance`);
                handleClose();
            })
                .catch(() => dispatch(pushNotification({
                tone: "error",
                message: MESSAGE_CODE.E04006
            })));
        }}>
          承認
        </AppButton>
      </>}>
      <Stack spacing={2}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          スタッフから勤怠情報の変更リクエストが届いています。
          <br />
          内容を確認して承認または却下してください。
        </Typography>
        <ChangeRequestDiffTable attendance={attendance} changeRequest={changeRequest} size="medium"/>
        <Stack direction="column" spacing={1}>
          <Typography variant="body1">【スタッフからのコメント】</Typography>
          <TextField fullWidth multiline disabled minRows={3} value={changeRequest?.staffComment || "コメントはありません"}/>
        </Stack>
        <Stack direction="column" spacing={1}>
          <Typography variant="body1">【スタッフへのコメント】</Typography>
          <TextField label="コメント" fullWidth multiline minRows={3} value={comment} onChange={(e) => setComment(e.target.value)}/>
        </Stack>
      </Stack>
    </AppDialog>);
}
