import DownloadIcon from "@mui/icons-material/Download";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useState } from "react";
import * as xlsx from "xlsx";

import { AttendanceDate } from "@/lib/AttendanceDate";
import { CompanyHolidayCalenderMessage } from "@/lib/message/CompanyHolidayCalenderMessage";
import { MessageStatus } from "@/lib/message/Message";

import {
  CompanyHolidayCalendar,
  CreateCompanyHolidayCalendarInput,
} from "../../../../API";
import { useAppDispatchV2 } from "../../../../app/hooks";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../../../lib/reducers/snackbarReducer";
import company_holiday from "../../../../templates/company_holiday.xlsx";

export function ExcelFilePicker({
  bulkCreateCompanyHolidayCalendar,
}: {
  bulkCreateCompanyHolidayCalendar: (
    inputs: CreateCompanyHolidayCalendarInput[]
  ) => Promise<CompanyHolidayCalendar[]>;
}) {
  const dispatch = useAppDispatchV2();

  const [open, setOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState<
    CreateCompanyHolidayCalendarInput[]
  >([]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = async () => {
    if (uploadedData.length === 0) return;

    // eslint-disable-next-line no-alert
    const result = window.confirm(
      `以下の${uploadedData.length}件のデータを登録しますか？`
    );
    if (!result) return;

    const companyHolidayCalenderMessage = new CompanyHolidayCalenderMessage();
    await bulkCreateCompanyHolidayCalendar(uploadedData)
      .then(() => {
        setUploadedData([]);
        handleClose();
        dispatch(
          setSnackbarSuccess(
            companyHolidayCalenderMessage.create(MessageStatus.SUCCESS)
          )
        );
      })
      .catch(() =>
        dispatch(
          setSnackbarError(
            companyHolidayCalenderMessage.create(MessageStatus.ERROR)
          )
        )
      );
  };

  return (
    <>
      <Button
        variant="outlined"
        size="medium"
        startIcon={<FileUploadIcon />}
        onClick={handleClickOpen}
      >
        ファイルからまとめて追加
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: "form",
          onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formJson = Object.fromEntries((formData as any).entries());
            const email = formJson.email;
            console.log(email);
            handleClose();
          },
        }}
      >
        <DialogTitle>ファイルからまとめて追加</DialogTitle>
        <DialogContent>
          <Stack direction="column" spacing={1}>
            <Typography variant="body1">
              専用のテンプレートファイルをダウンロードしてください。
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  const a = document.createElement("a");
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  a.href = company_holiday;
                  a.download = "company_holiday.xlsx";
                  a.click();
                }}
              >
                テンプレート
              </Button>
            </Box>
            <Typography variant="body1">
              テンプレートに登録したい休日を入力し、ファイルを選択してください。
            </Typography>
            <FileInput setUploadedData={setUploadedData} />
            <Typography variant="body1">
              ファイルを選択したら、登録ボタンを押してください。
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button type="submit" onClick={onSubmit}>
            登録
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function FileInput({
  setUploadedData,
}: {
  setUploadedData: React.Dispatch<
    React.SetStateAction<CreateCompanyHolidayCalendarInput[]>
  >;
}) {
  const [file, setFile] = useState<File | undefined>();

  return (
    <Box>
      <Button component="label" variant="outlined">
        ファイルを選択
        <input
          type="file"
          hidden
          accept=".xlsx"
          onChange={(event) => {
            const uploadFile = event.target.files?.item(0);
            if (!uploadFile) return;

            setFile(uploadFile);

            const reader = new FileReader();
            reader.readAsArrayBuffer(uploadFile);
            reader.onload = (e) => {
              if (!e.target?.result) return;

              const data = new Uint8Array(e.target.result as ArrayBuffer);
              const workbook = xlsx.read(data, { type: "array" });
              const csv = xlsx.utils.sheet_to_csv(workbook.Sheets.Sheet1);
              const lines = csv.split("\n").map((line) => line.split(","));
              const requestCompanyHolidayCalendars = lines
                .slice(1)
                .map((row) => ({
                  holidayDate: dayjs(row[0]).format(AttendanceDate.DataFormat),
                  name: String(row[1]),
                }));

              setUploadedData(requestCompanyHolidayCalendars);
            };
          }}
        />
      </Button>
      <Typography>{file?.name}</Typography>
    </Box>
  );
}
