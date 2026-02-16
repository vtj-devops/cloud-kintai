import useAppConfig from "@entities/app-config/model/useAppConfig";
import useOperationLog from "@entities/operation-log/model/useOperationLog";
import { VacationTabs } from "@features/attendance/edit/ui/components/VacationTabs";
import { GoDirectlyFlagCheckbox } from "@features/attendance/edit/ui/GoDirectlyFlagCheckbox";
import HourlyPaidHolidayTimeItem, {
  calcTotalHourlyPaidHolidayTime,
} from "@features/attendance/edit/ui/items/HourlyPaidHolidayTimeItem";
import ProductionTimeItem from "@features/attendance/edit/ui/items/ProductionTimeItem";
import StaffNameItem from "@features/attendance/edit/ui/items/StaffNameItem";
import WorkTypeItem from "@features/attendance/edit/ui/items/WorkTypeItem";
import QuickInputButtons from "@features/attendance/edit/ui/QuickInputButtons";
import AddAlarmIcon from "@mui/icons-material/AddAlarm";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  styled,
  TabsProps,
  Typography,
} from "@mui/material";
import GroupContainer from "@shared/ui/group-container/GroupContainer";
import Title from "@shared/ui/typography/Title";
import { useContext, useEffect, useMemo, useState } from "react";
import { Controller, useFormState } from "react-hook-form";

import { AppConfigContext } from "@/context/AppConfigContext";
import { resolveConfigTimeOnDate } from "@/entities/attendance/lib/resolveConfigTimeOnDate";
import { collectAttendanceErrorMessages } from "@/entities/attendance/validation/collectErrorMessages";
import { AttendanceEditContext } from "@/features/attendance/edit/model/AttendanceEditProvider";
import { SubstituteHolidayDateInput } from "@/features/attendance/edit/ui/items/SubstituteHolidayDateInput";
import { createLogger } from "@/shared/lib/logger";

import AttendanceEditBreadcrumb from "../AttendanceEditBreadcrumb";
import ChangeRequestingAlert from "./ChangeRequestingMessage";
import NoDataAlert from "./NoDataAlert";
import PaidHolidayFlagInput from "./PaidHolidayFlagInput";
// add Checkbox and FormControlLabel to top-level @mui/material import
import RemarksInput from "./RemarksInput";
import { calcTotalRestTime } from "./RestTimeItem/RestTimeInput/RestTimeInput";
import RestTimeItem from "./RestTimeItem/RestTimeItem";
import ReturnDirectlyFlagInput from "./ReturnDirectlyFlagInput";
import StaffCommentInput from "./StaffCommentInput";
import WorkDateItem from "./WorkDateItem";
import {
  calcTotalWorkTime,
  WorkTimeInput,
} from "./WorkTimeInput/WorkTimeInput";

const logger = createLogger("DesktopEditor");

const DesktopContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(5),
}));

const BodyStack = styled(Stack)(({ theme }) => ({
  width: "100%",
  maxWidth: 960,
  margin: "0 auto",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  [theme.breakpoints.up("md")]: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
  },
  [theme.breakpoints.up("lg")]: {
    maxWidth: 1080,
    paddingLeft: theme.spacing(6),
    paddingRight: theme.spacing(6),
  },
  [theme.breakpoints.up("xl")]: {
    maxWidth: 1200,
  },
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
  const ctx = useContext(AttendanceEditContext);
  const {
    attendance,
    staff,
    onSubmit,
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit,
    isDirty,
    isValid,
    isSubmitting,
    changeRequests,
    hourlyPaidHolidayTimeFields,
    hourlyPaidHolidayTimeAppend,
    restReplace,
    hourlyPaidHolidayTimeReplace,
    workDate,
    readOnly,
    errorMessages: contextErrorMessages,
  } = ctx;
  const { errors } = useFormState({ control });

  // OperationLog を作成するためのフック
  const { create: createOperationLog } = useOperationLog();
  const { getStartTime } = useAppConfig();
  const { hourlyPaidHolidayEnabled } = useContext(AttendanceEditContext);
  const { getSpecialHolidayEnabled } = useContext(AppConfigContext);
  const [vacationTab, setVacationTab] = useState<number>(0);
  const [totalProductionTime, setTotalProductionTime] = useState<number>(0);
  const [totalHourlyPaidHolidayTime, setTotalHourlyPaidHolidayTime] =
    useState<number>(0);
  const [highlightStartTime, setHighlightStartTime] = useState(false);
  const [highlightEndTime, setHighlightEndTime] = useState(false);
  const errorMessages = useMemo(() => {
    if (contextErrorMessages && contextErrorMessages.length > 0) {
      return contextErrorMessages;
    }
    return collectAttendanceErrorMessages(errors || {});
  }, [contextErrorMessages, errors]);

  useEffect(() => {
    if (!watch) return;

    const unsubscribe = watch((data) => {
      if (!data.endTime) {
        setTotalProductionTime(0);
      } else {
        const totalWorkTime = calcTotalWorkTime(data.startTime, data.endTime);
        const totalRestTime =
          data.rests?.reduce((acc, rest) => {
            if (!rest) return acc;
            const diff = calcTotalRestTime(rest.startTime, rest.endTime);
            return acc + diff;
          }, 0) ?? 0;
        const totalTime = totalWorkTime - totalRestTime;
        setTotalProductionTime(totalTime);
      }
      // 合計時間単位休暇時間
      const totalHourly =
        data.hourlyPaidHolidayTimes?.reduce((acc, time) => {
          if (!time) return acc;
          if (!time.endTime) return acc;
          const diff = calcTotalHourlyPaidHolidayTime(
            time.startTime,
            time.endTime
          );
          return acc + diff;
        }, 0) ?? 0;
      setTotalHourlyPaidHolidayTime(totalHourly);
    });
    return typeof unsubscribe === "function" ? unsubscribe : undefined;
  }, [watch]);

  if (!staff || !control || !setValue || !watch || !handleSubmit || !register) {
    return null;
  }

  return (
    <DesktopContainer maxWidth={false}>
      <Stack direction="column" spacing={2}>
        <AttendanceEditBreadcrumb />
        <BodyStack spacing={2}>
          <Title>勤怠編集</Title>
          {errorMessages.length > 0 && (
            <Alert severity="error">
              <AlertTitle>入力内容に誤りがあります。</AlertTitle>
              <Stack spacing={0.5}>
                {errorMessages.map((message: string) => (
                  <Typography key={message} variant="body2">
                    {message}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}
          <Stack direction="column" spacing={2}>
            <ChangeRequestingAlert changeRequests={changeRequests} />
          </Stack>
          <NoDataAlert />
          <GroupContainer>
            {setValue && restReplace && hourlyPaidHolidayTimeReplace && (
              <QuickInputButtons
                setValue={setValue}
                restReplace={restReplace}
                hourlyPaidHolidayTimeReplace={hourlyPaidHolidayTimeReplace}
                workDate={workDate ?? null}
                visibleMode="staff"
                getValues={getValues}
              />
            )}
          </GroupContainer>
          <GroupContainer>
            <WorkDateItem />
          </GroupContainer>
          <GroupContainer>
            <Stack spacing={2}>
              <StaffNameItem />
              <WorkTypeItem />
            </Stack>
          </GroupContainer>
          <GroupContainer>
            <WorkTimeInput
              highlightStartTime={highlightStartTime}
              highlightEndTime={highlightEndTime}
            />
            <GoDirectlyFlagCheckbox
              name="goDirectlyFlag"
              control={control}
              disabled={changeRequests.length > 0 || !!readOnly}
              onChangeExtra={(checked: boolean) => {
                if (checked && setValue) {
                  setValue(
                    "startTime",
                    resolveConfigTimeOnDate(
                      getStartTime(),
                      getValues?.("startTime") as string | null | undefined,
                      workDate ?? undefined,
                      attendance?.workDate
                    )
                  );
                  // トリガーハイライトアニメーション
                  setHighlightStartTime(true);
                  setTimeout(() => setHighlightStartTime(false), 2500);
                }
              }}
            />
            <ReturnDirectlyFlagInput onHighlightEndTime={setHighlightEndTime} />
            <RestTimeItem />
            <Divider />
            <ProductionTimeItem
              time={totalProductionTime}
              hourlyPaidHolidayHours={totalHourlyPaidHolidayTime}
            />
          </GroupContainer>
          <GroupContainer>
            {(() => {
              const items: { label: string; content: JSX.Element }[] = [];
              items.push({
                label: "振替休日",
                content: <SubstituteHolidayDateInput />,
              });
              items.push({
                label: "有給(1日)",
                content: <PaidHolidayFlagInput />,
              });
              if (getSpecialHolidayEnabled && getSpecialHolidayEnabled()) {
                items.push({
                  label: "特別休暇",
                  content: (
                    <Stack direction="row">
                      <Box sx={{ fontWeight: "bold", width: "150px" }}>
                        {"特別休暇"}
                      </Box>
                      <Stack spacing={1} sx={{ flexGrow: 2 }}>
                        <Box sx={{ color: "text.secondary", fontSize: 14 }}>
                          有給休暇ではない特別な休暇(忌引きなど)として扱われます。
                          <br />
                          使用する際は、事前に勤怠管理者へご相談ください。
                        </Box>
                        <Controller
                          name="specialHolidayFlag"
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Checkbox
                                  {...field}
                                  checked={!!field.value}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                  ) => field.onChange(e.target.checked)}
                                  disabled={changeRequests.length > 0}
                                />
                              }
                              label={""}
                            />
                          )}
                        />
                      </Stack>
                    </Stack>
                  ),
                });
              }

              if (hourlyPaidHolidayEnabled) {
                items.push({
                  label: `時間単位(${hourlyPaidHolidayTimeFields.length})`,
                  content: (
                    <Stack direction="row">
                      <Box sx={{ fontWeight: "bold", width: "150px" }}>
                        {"時間単位休暇"}
                      </Box>
                      <Stack spacing={1} sx={{ flexGrow: 2 }}>
                        {hourlyPaidHolidayTimeFields.length === 0 && (
                          <Box sx={{ color: "text.secondary", fontSize: 14 }}>
                            時間単位休暇の時間帯を追加してください。
                          </Box>
                        )}
                        {hourlyPaidHolidayTimeFields.map(
                          (hourlyPaidHolidayTime, index) => (
                            <HourlyPaidHolidayTimeItem
                              key={hourlyPaidHolidayTime.id}
                              time={hourlyPaidHolidayTime}
                              index={index}
                            />
                          )
                        )}
                        <Box>
                          <IconButton
                            aria-label="add-hourly-paid-holiday-time"
                            onClick={() =>
                              hourlyPaidHolidayTimeAppend({
                                startTime: null,
                                endTime: null,
                              })
                            }
                            disabled={changeRequests.length > 0}
                          >
                            <AddAlarmIcon />
                          </IconButton>
                        </Box>
                      </Stack>
                    </Stack>
                  ),
                });
              }

              return (
                <VacationTabs
                  value={vacationTab}
                  onChange={setVacationTab}
                  items={items}
                  panelPadding={2}
                  tabsProps={
                    {
                      "aria-label": "vacation-tabs-desktop",
                      sx: { borderBottom: 1, borderColor: "divider" },
                    } as TabsProps
                  }
                />
              );
            })()}
          </GroupContainer>
          <GroupContainer title="備考">
            <RemarksInput />
          </GroupContainer>
          <GroupContainer>
            <StaffCommentInput register={register} setValue={setValue} />
          </GroupContainer>
          <Box>
            <Stack
              direction="row"
              alignItems={"center"}
              justifyContent={"center"}
              spacing={3}
            >
              <Box sx={{ paddingBottom: 2 }}>
                <RequestButton
                  data-testid="attendance-submit-button"
                  onClick={async () => {
                    // capture pressed time and t0 for processing-time measurement
                    const pressedAt = new Date().toISOString();
                    const t0 = Date.now();

                    // call validation + submit and measure duration regardless of success
                    let submitError: unknown = undefined;
                    try {
                      await handleSubmit(onSubmit)();
                    } catch (e) {
                      submitError = e;
                    }

                    const t1 = Date.now();
                    const processingTimeMs = t1 - t0;

                    // Try to create an operation log (best-effort). Include processing time.
                    try {
                      await createOperationLog({
                        staffId: staff?.cognitoUserId ?? undefined,
                        action: "submit_change_request",
                        resource: "attendance",
                        resourceId: attendance?.id ?? String(workDate ?? ""),
                        // primary timestamp: when the user pressed the button
                        timestamp: pressedAt,
                        details: JSON.stringify({
                          startTime: getValues?.("startTime"),
                          endTime: getValues?.("endTime"),
                          remarks: getValues?.("remarks"),
                          processingTimeMs,
                          success: submitError ? false : true,
                        }),
                        metadata: JSON.stringify({ processingTimeMs }),
                        severity: "INFO",
                      });
                    } catch (e) {
                      // ログ作成失敗は握りつぶす。ただしデバッグに出す
                      logger.error("createOperationLog failed:", e);
                    }
                  }}
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
