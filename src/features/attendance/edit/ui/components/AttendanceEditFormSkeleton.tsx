import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import GroupContainer from "@shared/ui/group-container/GroupContainer";
import { ReactNode } from "react";
import { Control } from "react-hook-form";

import RestTimeItem from "../desktop/RestTimeItem";
import { WorkTimeInput } from "../desktop/WorkTimeInput";
import { GoDirectlyFlagCheckbox } from "../GoDirectlyFlagCheckbox";
import ProductionTimeItem from "../items/ProductionTimeItem";
import SeparatorItem from "../items/SeparatorItem";
import StaffNameItem from "../items/StaffNameItem";
import WorkTypeItem from "../items/WorkTypeItem";
import ReturnDirectlyFlagInput from "../ReturnDirectlyFlagInput";

type AttendanceEditFormSkeletonProps = {
  // Form state
  control: Control<AttendanceEditInputs>;

  // Work time
  highlightStartTime: boolean;
  highlightEndTime: boolean;
  onHighlightEndTime: (highlight: boolean) => void;

  // Production time
  totalProductionTime: number;
  totalHourlyPaidHolidayTime: number;

  // Permission/state
  readOnly?: boolean;
  changeRequests: Array<unknown>;

  // Optional callbacks
  onGoDirectlyChange?: (checked: boolean) => void;

  // Optional rendering
  vacationTabsContent?: ReactNode;
  remarksContent?: ReactNode;
  additionalTopContent?: ReactNode;
  additionalBottomContent?: ReactNode;
};

export function AttendanceEditFormSkeleton({
  control,
  highlightStartTime,
  highlightEndTime,
  onHighlightEndTime,
  totalProductionTime,
  totalHourlyPaidHolidayTime,
  readOnly,
  changeRequests,
  onGoDirectlyChange,
  vacationTabsContent,
  remarksContent,
  additionalTopContent,
  additionalBottomContent,
}: AttendanceEditFormSkeletonProps) {
  return (
    <div className="flex flex-col gap-2">
      {additionalTopContent}

      <GroupContainer hideAccent hideBorder>
        <div className="flex flex-col gap-2">
          <StaffNameItem />
          <WorkTypeItem />
        </div>
      </GroupContainer>

      <GroupContainer hideAccent hideBorder>
        <WorkTimeInput
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
        <RestTimeItem />
        <div className="h-px w-full bg-slate-200" />
        <SeparatorItem />
        <ProductionTimeItem
          time={totalProductionTime}
          hourlyPaidHolidayHours={totalHourlyPaidHolidayTime}
        />
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
    </div>
  );
}
