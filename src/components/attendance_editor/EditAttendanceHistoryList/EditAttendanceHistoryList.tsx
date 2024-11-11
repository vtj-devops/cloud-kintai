import HistoryIcon from "@mui/icons-material/History";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useContext, useState } from "react";

import { AttendanceEditContext } from "@/pages/AttendanceEdit/AttendanceEditProvider";

import { AttendanceHistoryRow } from "./AttendanceHistoryRow";

export default function EditAttendanceHistoryList() {
  const { getValues, attendance } = useContext(AttendanceEditContext);
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!getValues) return null;

  return (
    <Box>
      <Button
        variant="outlined"
        size="medium"
        startIcon={<HistoryIcon />}
        onClick={handleClickOpen}
      >
        変更履歴
      </Button>
      <Dialog
        open={open}
        fullWidth
        maxWidth="lg"
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"変更履歴"}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            左端のアイコンをクリックすると休憩時間が表示されます
          </Typography>
          <TableContainer>
            <Table size="small" sx={{ width: 1500, overflowY: "auto" }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>勤務日</TableCell>
                  <TableCell>勤務時間</TableCell>
                  <TableCell sx={{ writingMode: "vertical-rl" }}>
                    有給休暇
                  </TableCell>
                  <TableCell sx={{ writingMode: "vertical-rl" }}>
                    振替休日
                  </TableCell>
                  <TableCell sx={{ writingMode: "vertical-rl" }}>
                    直行
                  </TableCell>
                  <TableCell sx={{ writingMode: "vertical-rl" }}>
                    直帰
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>備考</TableCell>
                  <TableCell>作成日時</TableCell>
                  <TableCell>スタッフID</TableCell>
                  <TableCell sx={{ flexGrow: 1 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance?.histories
                  ? attendance.histories
                      .filter(
                        (item): item is NonNullable<typeof item> =>
                          item !== null
                      )
                      .sort((a, b) =>
                        dayjs(b.createdAt).isBefore(dayjs(a.createdAt)) ? -1 : 1
                      )
                      .map((history, index) => (
                        <AttendanceHistoryRow key={index} history={history} />
                      ))
                  : null}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
