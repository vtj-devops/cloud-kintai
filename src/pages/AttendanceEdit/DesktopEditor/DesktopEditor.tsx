import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Stack,
  styled,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";

import ProductionTimeItem from "../../../components/attendance_editor/items/ProductionTimeItem";
import StaffNameItem from "../../../components/attendance_editor/items/StaffNameItem";
import Title from "../../../components/Title/Title";
import AttendanceEditBreadcrumb from "../AttendanceEditBreadcrumb";
import { AttendanceEditContext } from "../AttendanceEditProvider";
import ChangeRequestingAlert from "./ChangeRequestingMessage";
import GoDirectlyFlagInput from "./GoDirectlyFlagInput";
import NoDataAlert from "./NoDataAlert";
import PaidHolidayFlagInput from "./PaidHolidayFlagInput";
import RemarksInput from "./RemarksInput";
import { calcTotalRestTime } from "./RestTimeItem/RestTimeInput/RestTimeInput";
import RestTimeItem from "./RestTimeItem/RestTimeItem";
import ReturnDirectlyFlagInput from "./ReturnDirectlyFlagInput";
import StaffCommentInput from "./StaffCommentInput";
import { SubstituteHolidayDateInput } from "./SubstituteHolidayDateInput";
import WorkDateItem from "./WorkDateItem";
import {
  calcTotalWorkTime,
  WorkTimeInput,
} from "./WorkTimeInput/WorkTimeInput";

const DesktopContainer = styled(Container)(() => ({
  pt: 1,
  pb: 5,
}));

const BodyStack = styled(Stack)(() => ({
  padding: "0 239px",
}));

const RequestButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main,
  border: `3px solid ${theme.palette.primary.main}`,
  width: 150,
  "&:hover": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.contrastText,
  },
  "&:disabled": {
    color: theme.palette.text.disabled,
    backgroundColor: theme.palette.action.disabledBackground,
    border: "3px solid #E0E0E0",
  },
}));

export default function DesktopEditor() {
  const {
    staff,
    onSubmit,
    register,
    control,
    setValue,
    watch,
    handleSubmit,
    isDirty,
    isValid,
    isSubmitting,
    changeRequests,
  } = useContext(AttendanceEditContext);
  const [totalProductionTime, setTotalProductionTime] = useState<number>(0);

  useEffect(() => {
    if (!watch) return;

    watch((data) => {
      const totalWorkTime = calcTotalWorkTime(data.startTime, data.endTime);

      const totalRestTime =
        data.rests?.reduce((acc, rest) => {
          if (!rest) return acc;

          const diff = calcTotalRestTime(rest.startTime, rest.endTime);
          return acc + diff;
        }, 0) ?? 0;

      const totalTime = totalWorkTime - totalRestTime;
      setTotalProductionTime(totalTime);
    });
  }, [watch]);

  if (!staff || !control || !setValue || !watch || !handleSubmit || !register) {
    return null;
  }

  return (
    <DesktopContainer maxWidth="xl">
      <Stack direction="column" spacing={2}>
        <AttendanceEditBreadcrumb />
        <BodyStack spacing={2}>
          <Title>勤怠編集</Title>
          <Stack direction="column" spacing={2}>
            <AttendanceEditBreadcrumb />
            <ChangeRequestingAlert changeRequests={changeRequests} />
          </Stack>
          <NoDataAlert />
          <WorkDateItem />
          <StaffNameItem />
          <PaidHolidayFlagInput />
          <SubstituteHolidayDateInput />
          <GoDirectlyFlagInput />
          <ReturnDirectlyFlagInput />
          <WorkTimeInput />
          <RestTimeItem />
          <ProductionTimeItem time={totalProductionTime} />
          <RemarksInput />
          <Divider />
          <StaffCommentInput register={register} setValue={setValue} />
          <Box>
            <Stack
              direction="row"
              alignItems={"center"}
              justifyContent={"center"}
              spacing={3}
            >
              <Box>
                <RequestButton
                  onClick={handleSubmit(onSubmit)}
                  disabled={
                    !isDirty ||
                    !isValid ||
                    isSubmitting ||
                    changeRequests.length > 0
                  }
                  startIcon={
                    isSubmitting ? <CircularProgress size={20} /> : null
                  }
                >
                  申請
                </RequestButton>
              </Box>
            </Stack>
          </Box>
        </BodyStack>
      </Stack>
    </DesktopContainer>
  );
}
