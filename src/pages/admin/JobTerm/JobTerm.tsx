import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Autocomplete,
  Box,
  Button,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, GridActionsCellItem, GridRowParams } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AttendanceDate } from "@/lib/AttendanceDate";

import { CloseDate } from "../../../API";
import { useAppDispatchV2 } from "../../../app/hooks";
import * as MESSAGE_CODE from "../../../errors";
import useCloseDates from "../../../hooks/useCloseDates/useCloseDates";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../../lib/reducers/snackbarReducer";
import { defaultValues, Inputs } from "./common";
import EditJobTermInputDialog from "./EditJobTermInputDialog";

function Title() {
  return (
    <Typography
      variant="h4"
      sx={{ pl: 1, borderBottom: "solid 5px #0FA85E", color: "#0FA85E" }}
    >
      集計対象月
    </Typography>
  );
}

export default function JobTerm() {
  const dispatch = useAppDispatchV2();
  const candidateCloseDates = Array.from(Array(12).keys()).map((i) => {
    const date = dayjs().add(i, "month").date(1);
    return date;
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<CloseDate | null>(null);

  const {
    closeDates,
    loading: closeDateLoading,
    error: closeDateError,
    createCloseDate,
    updateCloseDate,
    deleteCloseDate,
  } = useCloseDates();

  const {
    control,
    handleSubmit,
    formState: { isDirty, isValid, isSubmitting },
    reset,
  } = useForm<Inputs>({
    mode: "onChange",
    defaultValues,
  });

  const onSubmit = (data: Inputs) => {
    if (!data.closeDate || !data.startDate || !data.endDate) {
      throw new Error("Please fill in all fields.");
    }

    void createCloseDate({
      closeDate: data.closeDate.toISOString(),
      startDate: data.startDate?.toISOString(),
      endDate: data.endDate?.toISOString(),
    }).then(() => {
      reset(defaultValues);
    });
  };

  if (closeDateLoading) {
    return <LinearProgress />;
  }

  if (closeDateError) {
    return (
      <Typography variant="body1">
        データ取得中に問題が発生しました。管理者に連絡してください。
      </Typography>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        <Title />
        <Typography>月ごとに勤怠を締める日付を指定します。</Typography>
        <Box>
          <Stack spacing={2}>
            <Box>
              <Controller
                name="closeDate"
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <Autocomplete
                    options={candidateCloseDates}
                    value={value}
                    getOptionLabel={(option) => option.format("YYYY/MM")}
                    onChange={(e, v) => {
                      if (!v) return;
                      onChange(v);
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="集計対象月" size="small" />
                    )}
                  />
                )}
              />
            </Box>
            <Box>
              <Stack spacing={2} direction="row" alignItems="center">
                <Box>
                  <Controller
                    name="startDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <DatePicker
                        label="開始日"
                        format={AttendanceDate.DisplayFormat}
                        slotProps={{
                          textField: { size: "small" },
                        }}
                        {...field}
                      />
                    )}
                  />
                </Box>
                <Box>〜</Box>
                <Box>
                  <Controller
                    name="endDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <DatePicker
                        label="終了日"
                        format={AttendanceDate.DisplayFormat}
                        slotProps={{
                          textField: { size: "small" },
                        }}
                        {...field}
                      />
                    )}
                  />
                </Box>
              </Stack>
            </Box>
            <Box>
              <Button
                variant="contained"
                disabled={!isDirty || !isValid || isSubmitting}
                onClick={handleSubmit(onSubmit)}
              >
                追加
              </Button>
            </Box>
          </Stack>
        </Box>
        <DataGrid
          rows={closeDates}
          sortModel={[
            {
              field: "closeDate",
              sort: "desc",
            },
          ]}
          autoHeight
          columns={[
            {
              field: "closeDate",
              headerName: "集計対象月",
              width: 150,
              valueGetter: (params) => {
                const date = dayjs(params.row.closeDate);
                return date.format("YYYY年M月");
              },
            },
            {
              field: "expirationDate",
              headerName: "有効期間",
              width: 300,
              valueGetter: (params) => {
                const startDate = dayjs(params.row.startDate);
                const endDate = dayjs(params.row.endDate);
                return `${startDate.format(
                  AttendanceDate.DisplayFormat
                )} 〜 ${endDate.format(AttendanceDate.DisplayFormat)}`;
              },
            },
            {
              field: "createdAt",
              headerName: "作成日",
              width: 150,
              valueGetter: (params) => {
                const date = dayjs(params.row.createdAt);
                return date.format(AttendanceDate.DisplayFormat);
              },
            },
            {
              field: "actions",
              type: "actions",
              headerName: "操作",
              getActions: (params: GridRowParams<CloseDate>) => [
                <GridActionsCellItem
                  key={params.row.id}
                  icon={<EditIcon />}
                  label="編集"
                  onClick={() => {
                    setEditRow(params.row);
                    setEditDialogOpen(true);
                  }}
                />,
                <GridActionsCellItem
                  key={params.row.id}
                  icon={<DeleteIcon />}
                  label="削除"
                  onClick={() => {
                    // eslint-disable-next-line no-alert
                    const result = window.confirm(
                      "本当に削除しますか？この操作は取り消せません。"
                    );
                    if (!result) return;

                    deleteCloseDate({ id: params.row.id })
                      .then(() =>
                        dispatch(setSnackbarSuccess(MESSAGE_CODE.S09004))
                      )
                      .catch(() =>
                        dispatch(setSnackbarError(MESSAGE_CODE.E09004))
                      );
                  }}
                />,
              ],
            },
          ]}
        />
      </Stack>
      <EditJobTermInputDialog
        targetData={editRow}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        candidateCloseDates={candidateCloseDates}
        updateCloseDate={updateCloseDate}
      />
    </>
  );
}
