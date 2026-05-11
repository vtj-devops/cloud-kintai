import { AttendanceErrorSummary } from "@features/attendance/edit/ui/components/AttendanceErrorSummary";
import { InlineAlert } from "@shared/ui/feedback/InlineAlert";

type AttendanceEditorAlertsProps = {
  errorMessages: string[];
  overtimeError: string | null;
  showNoDataAlert: boolean;
};

export function AttendanceEditorAlerts({
  errorMessages,
  overtimeError,
  showNoDataAlert,
}: AttendanceEditorAlertsProps) {
  return (
    <>
      {errorMessages.length > 0 && (
        <AttendanceErrorSummary messages={errorMessages} />
      )}

      {overtimeError && (
        <div>
          <InlineAlert tone="error" title="残業チェック">
            {overtimeError}
          </InlineAlert>
        </div>
      )}

      {showNoDataAlert && (
        <div>
          <InlineAlert tone="info">
            指定された日付に勤怠情報の登録がありません。保存時に新規作成されます。
          </InlineAlert>
        </div>
      )}
    </>
  );
}