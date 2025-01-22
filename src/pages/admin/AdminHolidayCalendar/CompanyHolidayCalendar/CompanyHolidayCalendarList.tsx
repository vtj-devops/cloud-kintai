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

import { CompanyHolidayCalendar } from "@/API";
import { AttendanceDate } from "@/lib/AttendanceDate";
import { CompanyHolidayCalenderMessage } from "@/lib/message/CompanyHolidayCalenderMessage";
import { MessageStatus } from "@/lib/message/Message";

import { useAppDispatchV2 } from "../../../../app/hooks";
import useCompanyHolidayCalendars from "../../../../hooks/useCompanyHolidayCalendars/useCompanyHolidayCalendars";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../../../lib/reducers/snackbarReducer";
import { ExcelFilePicker } from "../HolidayCalendar/ExcelFilePicker";
import { sortCalendar } from "../HolidayCalendar/HolidayCalendarList";
import AddCompanyHolidayCalendar from "./AddCompanyHolidayCalendar";
import CompanyHolidayCalendarEdit from "./CompanyHolidayCalendarEdit";

export default function CompanyHolidayCalendarList() {
  const dispatch = useAppDispatchV2();

  const {
    companyHolidayCalendars,
    loading: companyHolidayCalendarLoading,
    error: companyHolidayCalendarError,
    createCompanyHolidayCalendar,
    updateCompanyHolidayCalendar,
    deleteCompanyHolidayCalendar,
    bulkCreateCompanyHolidayCalendar,
  } = useCompanyHolidayCalendars();

  const handleDelete = async (
    companyHolidayCalendar: CompanyHolidayCalendar
  ) => {
    // eslint-disable-next-line no-alert
    const beDeleteDate = dayjs(companyHolidayCalendar.holidayDate).format(
      AttendanceDate.DisplayFormat
    );
    const beDeleteName = companyHolidayCalendar.name;
    const message = `「${beDeleteDate}(${beDeleteName})」を削除しますか？\n削除したデータは元に戻せません。`;

    const confirm = window.confirm(message);
    if (!confirm) {
      return;
    }

    const id = companyHolidayCalendar.id;
    const companyHolidayCalenderMessage = new CompanyHolidayCalenderMessage();
    await deleteCompanyHolidayCalendar({ id })
      .then(() =>
        dispatch(
          setSnackbarSuccess(
            companyHolidayCalenderMessage.delete(MessageStatus.SUCCESS)
          )
        )
      )
      .catch(() =>
        dispatch(
          setSnackbarError(
            companyHolidayCalenderMessage.delete(MessageStatus.ERROR)
          )
        )
      );
  };

  if (companyHolidayCalendarLoading) {
    return <LinearProgress />;
  }

  if (companyHolidayCalendarError) {
    dispatch(
      setSnackbarError(
        new CompanyHolidayCalenderMessage().get(MessageStatus.ERROR)
      )
    );

    return null;
  }

  return (
    <>
      <Stack direction="row" spacing={1}>
        <AddCompanyHolidayCalendar
          createCompanyHolidayCalendar={createCompanyHolidayCalendar}
        />
        <ExcelFilePicker
          bulkCreateCompanyHolidayCalendar={bulkCreateCompanyHolidayCalendar}
        />
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
            {companyHolidayCalendars
              .sort(sortCalendar)
              .map((holidayCalendar, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Stack direction="row" spacing={0}>
                      <CompanyHolidayCalendarEdit
                        holidayCalendar={holidayCalendar}
                        updateCompanyHolidayCalendar={
                          updateCompanyHolidayCalendar
                        }
                      />
                      <IconButton onClick={() => handleDelete(holidayCalendar)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const date = dayjs(holidayCalendar.holidayDate);
                      return date.format(AttendanceDate.DisplayFormat);
                    })()}
                  </TableCell>
                  <TableCell>{holidayCalendar.name}</TableCell>
                  <TableCell>
                    {(() => {
                      const date = dayjs(holidayCalendar.createdAt);
                      return date.format(AttendanceDate.DisplayFormat);
                    })()}
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
