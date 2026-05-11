import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { AppButton } from "@shared/ui/button";
import { InlineAlert } from "@shared/ui/feedback/InlineAlert";
import dayjs, { Dayjs } from "dayjs";

type AttendanceEditorHeaderProps = {
  workDate: Dayjs | null;
  onBackToAttendanceList: () => void;
  readOnly?: boolean;
  currentHistoryCreatedAt?: string;
  onBackToEdit?: () => void;
};

export function AttendanceEditorHeader({
  workDate,
  onBackToAttendanceList,
  readOnly,
  currentHistoryCreatedAt,
  onBackToEdit,
}: AttendanceEditorHeaderProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <AppButton
          data-testid="attendance-admin-back-button"
          onClick={onBackToAttendanceList}
          variant="outline"
          tone="neutral"
          size="sm"
        >
          <span aria-hidden="true" className="text-base leading-none">
            ←
          </span>
          勤怠一覧に戻る
        </AppButton>
        {workDate && (
          <div
            data-testid="attendance-workdate-label"
            className="inline-flex w-fit items-center rounded-full bg-slate-900/5 px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-slate-600"
          >
            {workDate.format(AttendanceDate.DisplayFormat)}
          </div>
        )}
      </div>

      {readOnly && (
        <div>
          <div className="mt-1">
            <InlineAlert tone="info">
              <div>この画面は表示専用です（編集はできません）</div>
              {currentHistoryCreatedAt && (
                <div className="mt-0.5 text-sm">
                  履歴作成日時:{" "}
                  {dayjs(currentHistoryCreatedAt).format("YYYY/MM/DD HH:mm:ss")}
                </div>
              )}
            </InlineAlert>
          </div>

          {onBackToEdit && (
            <div className="mt-1">
              <AppButton
                onClick={onBackToEdit}
                variant="outline"
                tone="neutral"
                size="sm"
              >
                編集画面に戻る
              </AppButton>
            </div>
          )}
        </div>
      )}
    </>
  );
}