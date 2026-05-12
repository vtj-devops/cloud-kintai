import {
  ClockInButton,
  ClockOutButton,
  GoDirectlyButton,
  RestEndButton,
  RestStartButton,
  ReturnDirectlyButton,
} from "@shared/ui/button/time-recorder";

import { WorkStatusCodes } from "../lib/common";
import { useTimeRecorder } from "./TimeRecorderContext";

export default function RecorderActionButtons() {
  const {
    workStatus,
    directMode,
    hasChangeRequest,
    onClockIn,
    onClockOut,
    onGoDirectly,
    onReturnDirectly,
    onRestStart,
    onRestEnd,
  } = useTimeRecorder();
  const isBeforeWork = workStatus.code === WorkStatusCodes.BEFORE_WORK;
  const isWorking = workStatus.code === WorkStatusCodes.WORKING;
  const isResting = workStatus.code === WorkStatusCodes.RESTING;

  return (
    <div className="recorder-actions-card__actions">
      <div className="recorder-actions-card__action">
        {directMode ? (
          <GoDirectlyButton
            key={String(isBeforeWork)}
            isBeforeWork={isBeforeWork}
            onGoDirectly={onGoDirectly}
            disabled={hasChangeRequest}
          />
        ) : (
          <ClockInButton
            key={String(isBeforeWork)}
            isBeforeWork={isBeforeWork}
            onClockIn={onClockIn}
            disabled={hasChangeRequest}
          />
        )}
      </div>
      <div className="recorder-actions-card__action">
        {directMode ? (
          <ReturnDirectlyButton
            key={String(isWorking)}
            isWorking={isWorking}
            onReturnDirectly={onReturnDirectly}
            disabled={hasChangeRequest}
          />
        ) : (
          <ClockOutButton
            key={String(isWorking)}
            isWorking={isWorking}
            onClockOut={onClockOut}
            disabled={hasChangeRequest}
          />
        )}
      </div>
      <div className="recorder-actions-card__action">
        <RestStartButton
          key={String(isWorking)}
          isWorking={isWorking}
          onRestStart={onRestStart}
          disabled={hasChangeRequest}
        />
      </div>
      <div className="recorder-actions-card__action">
        <RestEndButton
          key={String(isResting)}
          isResting={isResting}
          onRestEnd={onRestEnd}
          disabled={hasChangeRequest}
        />
      </div>
    </div>
  );
}
