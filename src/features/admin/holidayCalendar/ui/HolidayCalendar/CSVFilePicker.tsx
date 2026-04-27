import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Link, Stack, Typography, } from "@mui/material";
import { CreateHolidayCalendarInput, HolidayCalendar, } from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useState } from "react";

export function CSVFilePicker({ bulkCreateHolidayCalendar, }: {
    bulkCreateHolidayCalendar: (inputs: CreateHolidayCalendarInput[]) => Promise<HolidayCalendar[]>;
}) {
    const dispatch = useAppDispatchV2();
    const [open, setOpen] = useState(false);
    const [uploadedData, setUploadedData] = useState<CreateHolidayCalendarInput[]>([]);
    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const onSubmit = async () => {
        if (uploadedData.length === 0)
            return;
        // eslint-disable-next-line no-alert
        const result = window.confirm(`以下の${uploadedData.length}件のデータを登録しますか？`);
        if (!result)
            return;
        const holidayCalendarMessage = HolidayCalendarMessage();
        await bulkCreateHolidayCalendar(uploadedData)
            .then(() => dispatch(pushNotification({
            tone: "success",
            message: holidayCalendarMessage.create(MessageStatus.SUCCESS)
        })))
            .catch(() => dispatch(pushNotification({
            tone: "error",
            message: holidayCalendarMessage.create(MessageStatus.ERROR)
        })));
    };
    return (<>
      <AppButton variant="outline" startIcon={<FileUploadIcon />} onClick={handleClickOpen}>
        ファイルからまとめて追加
      </AppButton>
      <Dialog open={open} onClose={handleClose} PaperProps={{
            component: "form",
            onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                handleClose();
            },
        }}>
        <DialogTitle>ファイルからまとめて追加</DialogTitle>
        <DialogContent>
          <Stack direction="column" spacing={1}>
            <Typography variant="body1">
              <Link href="https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html" target="_blank">
                政府のサイト
              </Link>
              からCSVファイルをダウンロードしてアップロードしてください。
            </Typography>
            <Typography variant="body1">
              ファイルを選択してください。
            </Typography>
            <FileInput setUploadedData={setUploadedData}/>
            <Typography variant="body1">
              ファイルを選択したら、登録ボタンを押してください。
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <AppButton variant="ghost" onClick={handleClose}>キャンセル</AppButton>
          <AppButton type="submit" onClick={onSubmit}>
            登録
          </AppButton>
        </DialogActions>
      </Dialog>
    </>);
}
function FileInput({ setUploadedData, }: {
    setUploadedData: React.Dispatch<React.SetStateAction<CreateHolidayCalendarInput[]>>;
}) {
    const [name, setName] = useState<string | undefined>();
    return (<Box>
      <AppButton as="label" variant="outline">
        ファイルを選択
        <input type="file" hidden accept=".csv" onChange={(event) => {
            // ファイル名を設定
            const file = event.target.files?.item(0);
            if (!file)
                return;
            setName(file.name);
            const reader = new FileReader();
            reader.readAsText(file, "Shift_JIS");
            reader.onload = () => {
                const csv = reader.result as string;
                const lines = csv.split("\r\n");
                const data = lines.map((line) => line.split(","));
                const requestCalendars = data
                    .slice(1)
                    .filter((row) => row[0] !== "")
                    .filter((row) => dayjs(row[0]).isAfter("2023/01/01"))
                    .map((row) => ({
                    holidayDate: dayjs(row[0]).format(AttendanceDate.DataFormat),
                    name: String(row[1]),
                } as CreateHolidayCalendarInput));
                setUploadedData(requestCalendars);
            };
        }}/>
      </AppButton>
      <Typography>{name}</Typography>
    </Box>);
}
