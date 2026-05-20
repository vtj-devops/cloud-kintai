import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { BulkUploadDialogShell } from "@features/admin/holidayCalendar/ui/components/BulkUploadDialogShell";
import { BulkUploadFileInput } from "@features/admin/holidayCalendar/ui/components/BulkUploadFileInput";
import { Stack, Typography } from "@mui/material";
import {
  CreateEventCalendarInput,
  EventCalendar,
} from "@shared/api/graphql/types";
import { EventCalendarMessage } from "@shared/lib/message/EventCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs from "dayjs";
import { type Dispatch, type SetStateAction, useState } from "react";

type ParseSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
};

export function CSVFilePicker({
  bulkCreateEventCalendar,
}: {
  bulkCreateEventCalendar: (
    inputs: CreateEventCalendarInput[],
  ) => Promise<EventCalendar[]>;
}) {
  const dispatch = useAppDispatchV2();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [parseSummary, setParseSummary] = useState<ParseSummary | null>(null);

  const onSubmit = async (
    uploadedData: readonly CreateEventCalendarInput[],
  ): Promise<boolean> => {
    const eventCalendarMessage = EventCalendarMessage();
    setSubmitError(null);

    try {
      await bulkCreateEventCalendar([...uploadedData]);
      dispatch(
        pushNotification({
          tone: "success",
          message: eventCalendarMessage.create(MessageStatus.SUCCESS),
        }),
      );
      return true;
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: eventCalendarMessage.create(MessageStatus.ERROR),
        }),
      );
      setSubmitError("登録に失敗しました。内容を確認して再度お試しください。");
      return false;
    }
  };

  return (
    <BulkUploadDialogShell<CreateEventCalendarInput>
      onSubmit={onSubmit}
      closeMode="success"
      disableRegisterWhenNoData
      disableCancelWhenSubmitting
      registeringLabel="登録中..."
      onOpen={() => {
        setSubmitError(null);
        setParseSummary(null);
      }}
      onClose={() => {
        setSubmitError(null);
        setParseSummary(null);
      }}
      renderContent={({ setUploadedData }) => (
        <Stack direction="column" spacing={1}>
          <Typography variant="body1">
            CSVファイル形式: eventDate (YYYY-MM-DD), name, description (任意)
          </Typography>
          <Typography variant="body1">例: 2026-04-01,花見,桜を見る会</Typography>
          <Typography variant="body1">ファイルを選択してください。</Typography>
          <FileInput
            setUploadedData={setUploadedData}
            onFileSelected={() => setSubmitError(null)}
            onParsed={setParseSummary}
          />
          <Typography variant="body1">
            ファイルを選択したら、登録ボタンを押してください。
          </Typography>
          {parseSummary && (
            <Typography
              variant="body2"
              sx={{
                color:
                  parseSummary.invalidRows > 0 ? "warning.main" : "text.secondary",
              }}
            >
              読み込み結果: {parseSummary.totalRows}件中 {parseSummary.validRows}
              件を登録対象にしました（除外 {parseSummary.invalidRows}件）
            </Typography>
          )}
          {submitError && (
            <Typography variant="body2" color="error">
              {submitError}
            </Typography>
          )}
        </Stack>
      )}
    />
  );
}

function FileInput({
  setUploadedData,
  onFileSelected,
  onParsed,
}: {
  setUploadedData: Dispatch<SetStateAction<CreateEventCalendarInput[]>>;
  onFileSelected: () => void;
  onParsed: (summary: ParseSummary) => void;
}) {
  const parseEventCsv = (
    csv: string,
  ): {
    calendars: CreateEventCalendarInput[];
    summary: ParseSummary;
  } => {
    const lines = csv.split(/\r\n|\n/);
    const data = lines.map((line) => line.split(","));

    const calendars = data
      .slice(1)
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

    const totalRows = data.slice(1).filter((row) => row[0] !== "").length;

    return {
      calendars,
      summary: {
        totalRows,
        validRows: calendars.length,
        invalidRows: totalRows - calendars.length,
      },
    };
  };

  return (
    <BulkUploadFileInput<{
      calendars: CreateEventCalendarInput[];
      summary: ParseSummary;
    }>
      encoding="UTF-8"
      parse={parseEventCsv}
      onFileSelected={onFileSelected}
      onParsed={({ calendars, summary }) => {
        setUploadedData(calendars);
        onParsed(summary);
      }}
    />
  );
}
