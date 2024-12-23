import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import {
  Control,
  FieldArrayMethodProps,
  FieldArrayWithId,
  UseFieldArrayRemove,
  UseFieldArrayUpdate,
} from "react-hook-form";

import { AttendanceEditContext } from "../../AttendanceEditProvider";
import { AttendanceEditInputs, RestInputs } from "../../common";
import RestStartTimeInput from "../../DesktopEditor/RestTimeItem/RestTimeInput/RestStartTimeInput";
import { Label } from "../Label";
import RestEndTimeInput from "./RestEndTimeInput";

type RestTimeInputProps = {
  restFields: FieldArrayWithId<AttendanceEditInputs, "rests", "id">[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<AttendanceEditInputs, any>;
  restAppend: (
    value: RestInputs | RestInputs[],
    options?: FieldArrayMethodProps | undefined
  ) => void;
  restRemove: UseFieldArrayRemove;
  restUpdate: UseFieldArrayUpdate<AttendanceEditInputs, "rests">;
};

export function RestTimeInput({
  restFields,
  control,
  restAppend,
  restRemove,
  restUpdate,
}: RestTimeInputProps) {
  const { workDate } = useContext(AttendanceEditContext);

  if (!workDate) return null;

  return (
    <>
      <Label>休憩時間</Label>
      {restFields.map((rest, index) => (
        <Paper elevation={2} key={index} sx={{ p: 2 }}>
          <Stack direction="column" spacing={1}>
            <Stack direction="row" spacing={0} alignItems={"center"}>
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", flexGrow: 1 }}
              >
                開始時刻
              </Typography>
              <IconButton
                aria-label="staff-search"
                onClick={() => restRemove(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
            <RestStartTimeInput rest={rest} index={index} />
            <Divider />
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              終了時間
            </Typography>
            <RestEndTimeInput
              workDate={workDate}
              rest={rest}
              index={index}
              control={control}
              restUpdate={restUpdate}
            />
          </Stack>
        </Paper>
      ))}
      <Button
        variant="outlined"
        size="medium"
        startIcon={<AddCircleOutlineOutlinedIcon />}
        fullWidth
        onClick={() =>
          restAppend({
            startTime: null,
            endTime: null,
          })
        }
      >
        休憩時間を追加
      </Button>
    </>
  );
}
