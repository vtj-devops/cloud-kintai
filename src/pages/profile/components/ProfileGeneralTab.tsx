import { AppButton } from "@shared/ui/button";
import React from "react";

import { InfoCard } from "./InfoCard";
import { ProfileSectionHeader } from "./ProfileSectionHeader";

interface ProfileGeneralTabProps {
  mailAddress: string;
  roleLabel: string;
  usageStartDateLabel: string;
  signOut: () => void;
}

export const ProfileGeneralTab = React.memo(function ProfileGeneralTab({
  mailAddress,
  roleLabel,
  usageStartDateLabel,
  signOut,
}: ProfileGeneralTabProps) {
  return (
    <div className="w-full max-w-[920px] space-y-4">
      <ProfileSectionHeader
        title="一般設定"
        description="プロフィールの基本情報を確認できます。編集対象ではない項目も、ここでまとめて確認できます。"
      />
      <div className="grid gap-2.5 md:grid-cols-2">
        <InfoCard label="メールアドレス" value={mailAddress} />
        <InfoCard label="権限" value={roleLabel} />
        <InfoCard label="利用開始日" value={usageStartDateLabel} />
      </div>
      <div className="rounded-[1.35rem] border border-rose-100 bg-rose-50/70 p-4">
        <p className="text-sm font-medium text-slate-900">ログアウト</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">現在の端末からサインアウトします。</p>
        <AppButton
          type="button"
          onClick={signOut}
          tone="danger"
          className="mt-3 w-full sm:w-auto"
        >
          ログアウト
        </AppButton>
      </div>
    </div>
  );
});
