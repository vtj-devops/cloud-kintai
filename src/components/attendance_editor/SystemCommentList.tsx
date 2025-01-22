import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
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

export function SystemCommentList() {
  const { systemCommentFields, systemCommentReplace } = useContext(
    AttendanceEditContext
  );
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const unconfirmedCount = systemCommentFields.filter(
    (systemComment) => !systemComment.confirmed
  ).length;

  const handleAllConfirmed = () => {
    if (!systemCommentReplace) {
      return;
    }

    const confirmedSystemCommentFields = systemCommentFields.map(
      (systemComment) => ({
        ...systemComment,
        confirmed: true,
      })
    );

    systemCommentReplace(confirmedSystemCommentFields);
  };

  return (
    <Box>
      <Badge badgeContent={unconfirmedCount} color="error">
        <Button
          variant="outlined"
          size="medium"
          startIcon={<ChatBubbleOutlineOutlinedIcon />}
          onClick={handleClickOpen}
        >
          システムコメント
        </Button>
      </Badge>
      <Dialog
        open={open}
        fullWidth
        maxWidth="lg"
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"システムコメント"}</DialogTitle>
        <DialogContent>
          <Stack direction="column" spacing={1}>
            <Typography variant="body1">
              システムからのコメントを表示しています。保存するまで反映されません。
            </Typography>
            <Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DoneAllIcon />}
                onClick={handleAllConfirmed}
              >
                すべて確認済みにする
              </Button>
            </Box>
          </Stack>
          <TableContainer>
            <Table size="small" sx={{ overflowY: "auto" }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>コメント</TableCell>
                  <TableCell>作成日時</TableCell>
                  <TableCell sx={{ flexGrow: 1 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {systemCommentFields.map(
                  ({ comment, createdAt, confirmed }, systemCommentIndex) => (
                    <TableRow key={systemCommentIndex}>
                      <TableCell>{confirmed ? <DoneIcon /> : null}</TableCell>
                      <TableCell>{comment}</TableCell>
                      <TableCell>
                        {dayjs(createdAt).format("YYYY/MM/DD HH:MM")}
                      </TableCell>
                      <TableCell sx={{ flexGrow: 1 }} />
                    </TableRow>
                  )
                )}
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
