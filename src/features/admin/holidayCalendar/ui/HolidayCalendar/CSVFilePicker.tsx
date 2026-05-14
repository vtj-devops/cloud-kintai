import { useAppDispatchV2 } from "@app/hooks";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { BulkUploadDialogShell } from "@features/admin/holidayCalendar/ui/components/BulkUploadDialogShell";
import { BulkUploadFileInput } from "@features/admin/holidayCalendar/ui/components/BulkUploadFileInput";
import { Link, Stack, Typography } from "@mui/material";
import {
  CreateHolidayCalendarInput,
  HolidayCalendar,
} from "@shared/api/graphql/types";
import { HolidayCalendarMessage } from "@shared/lib/message/HolidayCalendarMessage";
import { MessageStatus } from "@shared/lib/message/Message";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs from "dayjs";
import { type Dispatch, type SetStateAction } from "react";

export function CSVFilePicker({
  bulkCreateHolidayCalendar,
}: {
  bulkCreateHolidayCalendar: (
    inputs: CreateHolidayCalendarInput[],
  ) => Promise<HolidayCalendar[]>;
}) {
  const dispatch = useAppDispatchV2();

  const onSubmit = async (
    uploadedData: readonly CreateHolidayCalendarInput[],
  ): Promise<boolean> => {
    const holidayCalendarMessage = HolidayCalendarMessage();

    try {
      await bulkCreateHolidayCalendar([...uploadedData]);
      dispatch(
        pushNotification({
          tone: "success",
          message: holidayCalendarMessage.create(MessageStatus.SUCCESS),
        }),
      );
      return true;
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: holidayCalendarMessage.create(MessageStatus.ERROR),
        }),
      );
      return false;
    }
  };

  return (
    <BulkUploadDialogShell<CreateHolidayCalendarInput>
      onSubmit={onSubmit}
      closeMode="always"
      renderContent={({ setUploadedData }) => (
        <Stack direction="column" spacing={1}>
          <Typography variant="body1">
            <Link
              href="https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html"
              target="_blank"
            >
              政府のサイト
            </Link>
            からCSVファイルをダウンロードしてアップロードしてください。
          </Typography>
          <Typography variant="body1">ファイルを選択してください。</Typography>
          <FileInput setUploadedData={setUploadedData} />
          <Typography variant="body1">
            ファイルを選択したら、登録ボタンを押してください。
          </Typography>
        </Stack>
      )}
    />
  );
}

const parseHolidayCalendarCsv = (
  csv: string,
): CreateHolidayCalendarInput[] => {
  const lines = csv.split("\r\n");
  const data = lines.map((line) => line.split(","));

  return data
    .slice(1)
    .filter((row) => row[0] !== "")
    .filter((row) => dayjs(row[0]).isAfter("2023/01/01"))
    .map(
      (row) =>
        ({
          holidayDate: dayjs(row[0]).format(AttendanceDate.DataFormat),
          name: String(row[1]),
        }) as CreateHolidayCalendarInput,
    );
};

function FileInput({
  setUploadedData,
}: {
  setUploadedData: Dispatch<SetStateAction<CreateHolidayCalendarInput[]>>;
}) {
  return (
    <BulkUploadFileInput<CreateHolidayCalendarInput[]>
      encoding="Shift_JIS"
      parse={parseHolidayCalendarCsv}
      onParsed={(parsed) => {
        setUploadedData(parsed);
      }}
    />
  );
}
