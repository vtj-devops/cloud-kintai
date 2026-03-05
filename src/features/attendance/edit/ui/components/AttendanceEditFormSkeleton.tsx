import AddAlarmIcon from "@mui/icons-material/AddAlarm";
import { Alert, Box, IconButton, Stack } from "@mui/material";
import GroupContainer from "@shared/ui/group-container/GroupContainer";
import { ReactNode } from "react";
import { Control, UseFormGetValues, UseFormSetValue } from "react-hook-form";

import {
  AttendanceEditInputs,
  RestInputs,
} from "@/features/attendance/edit/model/common";

import { GoDirectlyFlagCheckbox } from "../GoDirectlyFlagCheckbox";
import ProductionTimeItem from "../items/ProductionTimeItem";
import { RestTimeItem } from "../items/RestTimeItem/RestTimeItem";
import SeparatorItem from "../items/SeparatorItem";
import StaffNameItem from "../items/StaffNameItem";
import { WorkTimeItem } from "../items/WorkTimeItem/WorkTimeItem";
import WorkTypeItem from "../items/WorkTypeItem";
import { LunchRestTimeNotSetWarning } from "../LunchRestTimeNotSetWarning";
import ReturnDirectlyFlagInput from "../ReturnDirectlyFlagInput";

type AttendanceEditFormSkeletonProps = {
  // Form state
  control: Control<AttendanceEditInputs>;
  setValue: UseFormSetValue<AttendanceEditInputs>;
  getValues: UseFormGetValues<AttendanceEditInputs>;

  // Work time
  highlightStartTime: boolean;
  highlightEndTime: boolean;
  onHighlightStartTime: (highlight: boolean) => void;
  onHighlightEndTime: (highlight: boolean) => void;

  // Rest fields
  restFields: Array<{ id: string } & RestInputs>;
  restAppend: (value: RestInputs) => void;
  lunchRestStartTime: string;
  lunchRestEndTime: string;
  visibleRestWarning: boolean;

  // Production time
  totalProductionTime: number;
  totalHourlyPaidHolidayTime: number;

  // Permission/state
  readOnly?: boolean;
  changeRequests: Array<unknown>;
  isOnBreak: boolean;

  // Optional callbacks
  onGoDirectlyChange?: (checked: boolean) => void;

  // Optional rendering
  targetWorkDate?: string;
  vacationTabsContent?: ReactNode;
  remarksContent?: ReactNode;
  additionalTopContent?: ReactNode;
  additionalBottomContent?: ReactNode;
};

export function AttendanceEditFormSkeleton({
  control,
  setValue: _setValue,
  getValues: _getValues,
  highlightStartTime,
  highlightEndTime,
  onHighlightStartTime: _onHighlightStartTime,
  onHighlightEndTime,
  restFields,
  restAppend,
  lunchRestStartTime,
  lunchRestEndTime,
  visibleRestWarning,
  totalProductionTime,
  totalHourlyPaidHolidayTime,
  readOnly,
  changeRequests,
  isOnBreak,
  onGoDirectlyChange,
  targetWorkDate,
  vacationTabsContent,
  remarksContent,
  additionalTopContent,
  additionalBottomContent,
}: AttendanceEditFormSkeletonProps) {
  return (
    <Stack spacing={2}>
      {additionalTopContent}

      <GroupContainer hideAccent hideBorder>
        <Stack spacing={2}>
          <StaffNameItem />
          <WorkTypeItem />
        </Stack>
      </GroupContainer>

      <GroupContainer hideAccent hideBorder>
        <WorkTimeItem
          highlightStartTime={highlightStartTime}
          highlightEndTime={highlightEndTime}
        />
        <GoDirectlyFlagCheckbox
          name="goDirectlyFlag"
          control={control}
          disabled={changeRequests.length > 0 || !!readOnly}
          onChangeExtra={(checked: boolean) => {
            if (onGoDirectlyChange) {
              onGoDirectlyChange(checked);
            }
          }}
        />
        <ReturnDirectlyFlagInput onHighlightEndTime={onHighlightEndTime} />

        <Stack direction="row">
          <Box
            sx={{ fontWeight: "bold", width: "150px" }}
          >{`休憩時間(${restFields.length}件)`}</Box>
          <Stack spacing={1} sx={{ flexGrow: 2 }}>
            {restFields.length === 0 && (
              <Stack direction="column" spacing={1}>
                <Alert severity="info">
                  昼休憩はスタッフが退勤打刻時に{lunchRestStartTime}〜
                  {lunchRestEndTime}で自動打刻されます。
                </Alert>
                {visibleRestWarning && targetWorkDate && (
                  <Box>
                    <LunchRestTimeNotSetWarning
                      targetWorkDate={targetWorkDate}
                    />
                  </Box>
                )}
              </Stack>
            )}

            {restFields.map((rest, index) => (
              <RestTimeItem key={rest.id} rest={rest} index={index} />
            ))}

            <Box>
              <IconButton
                aria-label="add-rest-time"
                onClick={() => restAppend({ startTime: null, endTime: null })}
                disabled={!!readOnly || isOnBreak}
              >
                <AddAlarmIcon />
              </IconButton>
            </Box>
          </Stack>
        </Stack>

        <Box>
          <SeparatorItem />
        </Box>

        <Box>
          <ProductionTimeItem
            time={totalProductionTime}
            hourlyPaidHolidayHours={totalHourlyPaidHolidayTime}
          />
        </Box>
      </GroupContainer>

      {vacationTabsContent && (
        <GroupContainer hideAccent hideBorder>
          {vacationTabsContent}
        </GroupContainer>
      )}

      {remarksContent && (
        <GroupContainer title="備考" hideAccent hideBorder>
          {remarksContent}
        </GroupContainer>
      )}

      {additionalBottomContent}
    </Stack>
  );
}
