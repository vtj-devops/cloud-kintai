import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, } from "@mui/material";
import { CreateEventCalendarInput, EventCalendar, } from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useState } from "react";

export function CSVFilePicker({ bulkCreateEventCalendar, }: {
    bulkCreateEventCalendar: (inputs: CreateEventCalendarInput[]) => Promise<EventCalendar[]>;
}) {
    type ParseSummary = {
        totalRows: number;
        validRows: number;
        invalidRows: number;
    };
    const dispatch = useAppDispatchV2();
    const [open, setOpen] = useState(false);
    const [uploadedData, setUploadedData] = useState<CreateEventCalendarInput[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [parseSummary, setParseSummary] = useState<ParseSummary | null>(null);
    const handleClickOpen = () => {
        setSubmitError(null);
        setParseSummary(null);
        setOpen(true);
    };
    const handleClose = () => {
        setSubmitError(null);
        setParseSummary(null);
        setOpen(false);
    };
    const onSubmit = async (): Promise<boolean> => {
        if (isSubmitting)
            return false;
        if (uploadedData.length === 0)
            return false;
        // eslint-disable-next-line no-alert
        const result = window.confirm(`以下の${uploadedData.length}件のデータを登録しますか？`);
        if (!result)
            return false;
        const eventCalendarMessage = EventCalendarMessage();
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            await bulkCreateEventCalendar(uploadedData);
            dispatch(pushNotification({
                tone: "success",
                message: eventCalendarMessage.create(MessageStatus.SUCCESS)
            }));
            return true;
        }
        catch {
            dispatch(pushNotification({
                tone: "error",
                message: eventCalendarMessage.create(MessageStatus.ERROR)
            }));
            setSubmitError("登録に失敗しました。内容を確認して再度お試しください。");
            return false;
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<>
      <AppButton variant="outline" startIcon={<FileUploadIcon />} onClick={handleClickOpen}>
        ファイルからまとめて追加
      </AppButton>
      <Dialog open={open} onClose={handleClose} PaperProps={{
            component: "form",
            onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const isSucceeded = await onSubmit();
                if (isSucceeded) {
                    handleClose();
                }
            },
        }}>
        <DialogTitle>ファイルからまとめて追加</DialogTitle>
        <DialogContent>
          <Stack direction="column" spacing={1}>
            <Typography variant="body1">
              CSVファイル形式: eventDate (YYYY-MM-DD), name, description (任意)
            </Typography>
            <Typography variant="body1">
              例: 2026-04-01,花見,桜を見る会
            </Typography>
            <Typography variant="body1">
              ファイルを選択してください。
            </Typography>
            <FileInput setUploadedData={setUploadedData} onFileSelected={() => setSubmitError(null)} onParsed={setParseSummary}/>
            <Typography variant="body1">
              ファイルを選択したら、登録ボタンを押してください。
            </Typography>
            {parseSummary && (<Typography variant="body2" sx={{
                color: parseSummary.invalidRows > 0 ? "warning.main" : "text.secondary",
            }}>
                読み込み結果: {parseSummary.totalRows}件中 {parseSummary.validRows}
                件を登録対象にしました（除外 {parseSummary.invalidRows}件）
              </Typography>)}
            {submitError && (<Typography variant="body2" color="error">
                {submitError}
              </Typography>)}
          </Stack>
        </DialogContent>
        <DialogActions>
          <AppButton variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            キャンセル
          </AppButton>
          <AppButton type="submit" disabled={isSubmitting || uploadedData.length === 0}>
            {isSubmitting ? "登録中..." : "登録"}
          </AppButton>
        </DialogActions>
      </Dialog>
    </>);
}
function FileInput({ setUploadedData, onFileSelected, onParsed, }: {
    setUploadedData: React.Dispatch<React.SetStateAction<CreateEventCalendarInput[]>>;
    onFileSelected: () => void;
    onParsed: (summary: {
        totalRows: number;
        validRows: number;
        invalidRows: number;
    }) => void;
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
            onFileSelected();
            setName(file.name);
            const reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = () => {
                const csv = reader.result as string;
                const lines = csv.split(/\r\n|\n/);
                const data = lines.map((line) => line.split(","));
                const requestCalendars = data
                    .slice(1) // skip header
                    .filter((row) => row[0] !== "")
                    .map((row) => {
                    const eventDate = dayjs(row[0].trim());
                    if (!eventDate.isValid()) {
                        return null;
                    }
                    return {
                        eventDate: eventDate.format(AttendanceDate.DataFormat),
                        name: String(row[1]?.trim() || ""),
                        description: row[2]?.trim() || undefined,
                    } as CreateEventCalendarInput;
                })
                    .filter((item): item is CreateEventCalendarInput => item !== null);
                setUploadedData(requestCalendars);
                onParsed({
                    totalRows: data.slice(1).filter((row) => row[0] !== "").length,
                    validRows: requestCalendars.length,
                    invalidRows: data.slice(1).filter((row) => row[0] !== "").length -
                        requestCalendars.length,
                });
            };
        }}/>
      </AppButton>
      <Typography>{name}</Typography>
    </Box>);
}
