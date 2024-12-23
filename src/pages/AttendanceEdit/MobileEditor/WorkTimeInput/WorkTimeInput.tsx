import { Divider, Typography } from "@mui/material";
import { useContext } from "react";

import { AttendanceEditContext } from "../../AttendanceEditProvider";
import StartTimeInput from "../../DesktopEditor/WorkTimeInput/StartTimeInput";
import { Label } from "../Label";
import EndTimeInput from "./EndTimeInput";

export function WorkTimeInput() {
  const { workDate, control, setValue, getValues, watch } = useContext(
    AttendanceEditContext
  );

  if (!workDate || !control || !setValue || !getValues || !watch) {
    return null;
  }

  return (
    <>
      <Label>勤務時間</Label>
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
        開始時刻
      </Typography>
      <StartTimeInput />
      <Divider />
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
        終了時刻
      </Typography>
      <EndTimeInput
        workDate={workDate}
        control={control}
        setValue={setValue}
        getValues={getValues}
        watch={watch}
      />
    </>
  );
}
