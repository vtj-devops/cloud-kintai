import DeleteIcon from "@mui/icons-material/Delete";
import {
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import dayjs from "dayjs";

import { AttendanceDate } from "@/lib/AttendanceDate";
import { HolidayCalenderMessage } from "@/lib/message/HolidayCalenderMessage";
import { MessageStatus } from "@/lib/message/Message";

import {
  CompanyHolidayCalendar,
  DeleteHolidayCalendarInput,
  HolidayCalendar,
} from "../../../../API";
import { useAppDispatchV2 } from "../../../../app/hooks";
import useHolidayCalendar from "../../../../hooks/useHolidayCalendars/useHolidayCalendars";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../../../lib/reducers/snackbarReducer";
import { AddHolidayCalendar } from "./AddHolidayCalendar";
import { CSVFilePicker } from "./CSVFilePicker";
import HolidayCalendarEdit from "./HolidayCalendarEdit";

export function sortCalendar(
  a: HolidayCalendar | CompanyHolidayCalendar,
  b: HolidayCalendar | CompanyHolidayCalendar
) {
  return dayjs(a.holidayDate).isBefore(dayjs(b.holidayDate)) ? 1 : -1;
}

export default function HolidayCalendarList() {
  const dispatch = useAppDispatchV2();

  const {
    holidayCalendars,
    loading: holidayCalendarLoading,
    error: holidayCalendarError,
    bulkCreateHolidayCalendar,
    updateHolidayCalendar,
    createHolidayCalendar,
    deleteHolidayCalendar,
  } = useHolidayCalendar();

  if (holidayCalendarLoading) {
    return <LinearProgress />;
  }

  if (holidayCalendarError) {
    dispatch(
      setSnackbarError(new HolidayCalenderMessage().get(MessageStatus.ERROR))
    );
    return null;
  }

  return (
    <>
      <Stack direction="row" spacing={1}>
        <AddHolidayCalendar createHolidayCalendar={createHolidayCalendar} />
        <CSVFilePicker bulkCreateHolidayCalendar={bulkCreateHolidayCalendar} />
      </Stack>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 50 }} />
              <TableCell sx={{ width: 100 }}>日付</TableCell>
              <TableCell sx={{ width: 200 }}>名前</TableCell>
              <TableCell sx={{ width: 100 }}>作成日</TableCell>
              <TableCell sx={{ flexGrow: 1 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {holidayCalendars
              .sort(sortCalendar)
              .map((holidayCalendar, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Stack direction="row" spacing={0}>
                      <HolidayCalendarEdit
                        holidayCalendar={holidayCalendar}
                        updateHolidayCalendar={updateHolidayCalendar}
                      />
                      <HolidayCalendarDelete
                        holidayCalendar={holidayCalendar}
                        deleteHolidayCalendar={deleteHolidayCalendar}
                      />
                    </Stack>
                  </TableCell>
                  <HolidayDateTableCell holidayCalendar={holidayCalendar} />
                  <HolidayNameTableCell holidayCalendar={holidayCalendar} />
                  <CreatedAtTableCell holidayCalendar={holidayCalendar} />
                  <TableCell />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function HolidayCalendarDelete({
  holidayCalendar,
  deleteHolidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
  deleteHolidayCalendar: (input: DeleteHolidayCalendarInput) => Promise<void>;
}) {
  const dispatch = useAppDispatchV2();

  const onSubmit = async () => {
    const beDeleteDate = dayjs(holidayCalendar.holidayDate).format(
      AttendanceDate.DisplayFormat
    );
    const beDeleteName = holidayCalendar.name;
    const formattedDeleteMessage = `「${beDeleteDate}(${beDeleteName})」を削除しますか？\nこの操作は取り消せません。`;

    const confirmed = window.confirm(formattedDeleteMessage);
    if (!confirmed) {
      return;
    }

    const holidayCalenderMessage = new HolidayCalenderMessage();
    await deleteHolidayCalendar({ id: holidayCalendar.id })
      .then(() => {
        dispatch(
          setSnackbarSuccess(
            holidayCalenderMessage.delete(MessageStatus.SUCCESS)
          )
        );
      })
      .catch(() => {
        dispatch(
          setSnackbarError(holidayCalenderMessage.delete(MessageStatus.ERROR))
        );
      });
  };

  return (
    <IconButton onClick={onSubmit}>
      <DeleteIcon fontSize="small" />
    </IconButton>
  );
}

function HolidayDateTableCell({
  holidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
}) {
  const date = dayjs(holidayCalendar.holidayDate);
  const holidayDate = date.format(AttendanceDate.DisplayFormat);

  return <TableCell>{holidayDate}</TableCell>;
}

function HolidayNameTableCell({
  holidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
}) {
  return <TableCell>{holidayCalendar.name}</TableCell>;
}

function CreatedAtTableCell({
  holidayCalendar,
}: {
  holidayCalendar: HolidayCalendar;
}) {
  const date = dayjs(holidayCalendar.createdAt);
  const createdAt = date.format(AttendanceDate.DisplayFormat);

  return <TableCell>{createdAt}</TableCell>;
}
