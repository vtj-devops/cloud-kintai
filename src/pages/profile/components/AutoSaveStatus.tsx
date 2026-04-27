import dayjs from "dayjs";
import React from "react";

const PROFILE_AUTO_SAVE_TIME_FORMAT = "M/D HH:mm:ss";

interface AutoSaveStatusProps {
  isSaving: boolean;
  isPending: boolean;
  lastSavedAt: Date | null;
  helperText?: string;
}

export const AutoSaveStatus = React.memo(function AutoSaveStatus({
  isSaving,
  isPending,
  lastSavedAt,
  helperText,
}: AutoSaveStatusProps) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-5 items-center">
        {isSaving ? (
          <p className="text-xs font-medium text-slate-500">保存中...</p>
        ) : null}
        {isPending && !isSaving ? (
          <p className="text-xs font-medium text-slate-500">保存待ち</p>
        ) : null}
        {!isSaving && !isPending && lastSavedAt ? (
          <p className="text-xs font-medium text-emerald-700">
            最終保存: {dayjs(lastSavedAt).format(PROFILE_AUTO_SAVE_TIME_FORMAT)}
          </p>
        ) : null}
      </div>
      {helperText ? <p className="text-xs text-amber-700">{helperText}</p> : null}
    </div>
  );
});
