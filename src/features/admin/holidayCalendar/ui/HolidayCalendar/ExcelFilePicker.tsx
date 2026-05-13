import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { BulkUploadDialogShell } from "@features/admin/holidayCalendar/ui/components/BulkUploadDialogShell";
import DownloadIcon from "@mui/icons-material/Download";
import { Box, Stack, Typography } from "@mui/material";
import {
  CompanyHolidayCalendar,
  CreateCompanyHolidayCalendarInput,
} from "@shared/api/graphql/types";
import { CompanyHolidayCalendarMessage } from "@shared/lib/message/CompanyHolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useState } from "react";

import company_holiday from "@/templates/company_holiday.csv";

const CSV_DOWNLOAD_FILENAME = "company_holiday.csv";
const CSV_PARSE_ERROR_MESSAGE =
  "CSVファイルの読み込みに失敗しました。テンプレートの形式をご確認ください。";
const CSV_EMPTY_DATA_MESSAGE = "CSVファイルに休日データが含まれていません。";

const normalizeCell = (cell: string) => cell.replace(/^\uFEFF/, "").trim();
const splitCsvLine = (line: string) =>
  line.split(",").map((value) => normalizeCell(value));

const parseHolidayCsv = (text: string): CreateCompanyHolidayCalendarInput[] => {
  const sanitizedLines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(splitCsvLine);

  if (sanitizedLines.length === 0) {
    return [];
  }

  const header = sanitizedLines[0].map((cell) => cell.toLowerCase());
  const dateIndex = header.indexOf("holiday_date");
  const nameIndex = header.indexOf("name");

  if (dateIndex === -1 || nameIndex === -1) {
    throw new Error("missing-header");
  }

  return sanitizedLines
    .slice(1)
    .reduce<CreateCompanyHolidayCalendarInput[]>((acc, row) => {
      const dateValue = row[dateIndex];
      const nameValue = row[nameIndex];

      if (!dateValue || !nameValue) {
        return acc;
      }

      const parsedDate = dayjs(dateValue);
      if (!parsedDate.isValid()) {
        return acc;
      }

      acc.push({
        holidayDate: parsedDate.format(AttendanceDate.DataFormat),
        name: nameValue,
      });
      return acc;
    }, []);
};

export function ExcelFilePicker({
  bulkCreateCompanyHolidayCalendar,
}: {
  bulkCreateCompanyHolidayCalendar: (
    inputs: CreateCompanyHolidayCalendarInput[],
  ) => Promise<CompanyHolidayCalendar[]>;
}) {
  const dispatch = useAppDispatchV2();

  const onSubmit = async (
    uploadedData: readonly CreateCompanyHolidayCalendarInput[],
    {
      setUploadedData,
    }: {
      setUploadedData: React.Dispatch<
        React.SetStateAction<CreateCompanyHolidayCalendarInput[]>
      >;
    },
  ): Promise<boolean> => {
    const companyHolidayCalendarMessage = CompanyHolidayCalendarMessage();

    try {
      await bulkCreateCompanyHolidayCalendar([...uploadedData]);
      setUploadedData([]);
      dispatch(
        pushNotification({
          tone: "success",
          message: companyHolidayCalendarMessage.create(MessageStatus.SUCCESS),
        }),
      );
      return true;
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: companyHolidayCalendarMessage.create(MessageStatus.ERROR),
        }),
      );
      return false;
    }
  };

  return (
    <BulkUploadDialogShell<CreateCompanyHolidayCalendarInput>
      onSubmit={onSubmit}
      closeMode="always"
      renderContent={({ setUploadedData }) => (
        <Stack direction="column" spacing={1}>
          <Typography variant="body1">
            専用のテンプレートファイルをダウンロードしてください。
          </Typography>
          <Box>
            <AppButton
              variant="outline"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const a = document.createElement("a");
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                a.href = company_holiday;
                a.download = CSV_DOWNLOAD_FILENAME;
                a.click();
              }}
            >
              テンプレート
            </AppButton>
          </Box>
          <Typography variant="body1">
            テンプレートに登録したい休日を入力し、CSVファイルを選択してください。
          </Typography>
          <FileInput setUploadedData={setUploadedData} />
          <Typography variant="body1">
            ファイルを選択したら、登録ボタンを押してください。
          </Typography>
        </Stack>
      )}
    />
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
  const dispatch = useAppDispatchV2();

  const handleParseFailure = (message: string) => {
    dispatch(
      pushNotification({
        tone: "error",
        message,
      }),
    );
    setUploadedData([]);
    setFile(undefined);
  };

  return (
    <Box>
      <AppButton as="label" variant="outline">
        ファイルを選択
        <input
          type="file"
          hidden
          accept=".csv"
          onChange={(event) => {
            const uploadFile = event.target.files?.item(0);
            if (!uploadFile) {
              return;
            }

            setFile(uploadFile);
            const reader = new FileReader();
            reader.readAsText(uploadFile, "utf-8");

            reader.onload = (e) => {
              if (!e.target?.result) {
                handleParseFailure(CSV_PARSE_ERROR_MESSAGE);
                return;
              }

              try {
                const parsed = parseHolidayCsv(e.target.result as string);
                if (parsed.length === 0) {
                  handleParseFailure(CSV_EMPTY_DATA_MESSAGE);
                  return;
                }
                setUploadedData(parsed);
              } catch (error) {
                console.error(error);
                handleParseFailure(CSV_PARSE_ERROR_MESSAGE);
              }
            };

            reader.onerror = () => handleParseFailure(CSV_PARSE_ERROR_MESSAGE);
            event.target.value = "";
          }}
        />
      </AppButton>
      <Typography>{file?.name}</Typography>
    </Box>
  );
}
