import React from "react";
import { Controller } from "react-hook-form";

import type { NotificationControl } from "../hooks/useProfileForm";
import { AutoSaveStatus } from "./AutoSaveStatus";
import { ProfileSectionHeader } from "./ProfileSectionHeader";

interface ProfileNotificationsTabProps {
  notificationControl: NotificationControl;
  isAutoSaving: boolean;
  isAutoSavePending: boolean;
  lastSavedAt: Date | null;
}

export const ProfileNotificationsTab = React.memo(function ProfileNotificationsTab({
  notificationControl,
  isAutoSaving,
  isAutoSavePending,
  lastSavedAt,
}: ProfileNotificationsTabProps) {
  return (
    <div className="w-full max-w-[920px] space-y-5">
      <ProfileSectionHeader
        title="通知設定"
        description="勤務開始と勤務終了の通知メールを切り替えられます。"
      />
      <AutoSaveStatus
        isSaving={isAutoSaving}
        isPending={isAutoSavePending}
        lastSavedAt={lastSavedAt}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Controller
          name="workStart"
          control={notificationControl}
          render={({ field }) => {
            const labelId = `${field.name}-label`;
            const descriptionId = `${field.name}-description`;

            return (
              <label className="flex min-w-0 cursor-pointer items-center justify-between gap-4 rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5 transition hover:border-emerald-200 hover:bg-emerald-50/70">
                <div className="min-w-0 space-y-1">
                  <p id={labelId} className="text-sm font-semibold text-slate-900">
                    勤務開始メール
                  </p>
                  <p id={descriptionId} className="text-sm leading-6 text-slate-500">
                    出勤打刻時の通知を受け取ります。
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  aria-labelledby={labelId}
                  aria-describedby={descriptionId}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            );
          }}
        />
        <Controller
          name="workEnd"
          control={notificationControl}
          render={({ field }) => {
            const labelId = `${field.name}-label`;
            const descriptionId = `${field.name}-description`;

            return (
              <label className="flex min-w-0 cursor-pointer items-center justify-between gap-4 rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5 transition hover:border-emerald-200 hover:bg-emerald-50/70">
                <div className="min-w-0 space-y-1">
                  <p id={labelId} className="text-sm font-semibold text-slate-900">
                    勤務終了メール
                  </p>
                  <p id={descriptionId} className="text-sm leading-6 text-slate-500">
                    退勤打刻時の通知を受け取ります。
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) => field.onChange(event.target.checked)}
                  aria-labelledby={labelId}
                  aria-describedby={descriptionId}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            );
          }}
        />
      </div>
    </div>
  );
});


