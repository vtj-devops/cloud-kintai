import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import { roleLabelMap } from "@entities/staff/model/useStaffs/useStaffs";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import { AppTabs } from "@shared/ui/tabs";
import { PageTitle } from "@shared/ui/typography";
import dayjs from "dayjs";
import { type ReactNode, useState } from "react";

import { InfoCard } from "./profile/components/InfoCard";
import { ProfileGeneralTab } from "./profile/components/ProfileGeneralTab";
import { ProfileLinksTab } from "./profile/components/ProfileLinksTab";
import { ProfileNotificationsTab } from "./profile/components/ProfileNotificationsTab";
import { ProfileSecurityTab } from "./profile/components/ProfileSecurityTab";
import { useProfileForm } from "./profile/hooks/useProfileForm";

export type { StaffNotificationInputs } from "./profile/hooks/useProfileForm";

const PROFILE_CONTENT_MAX_WIDTH = 920;

type ProfileTab = "general" | "notifications" | "links" | "security";

const profileTabs: { value: ProfileTab; label: string }[] = [
  { value: "general", label: "一般設定" },
  { value: "notifications", label: "通知設定" },
  { value: "links", label: "個人リンク設定" },
  { value: "security", label: "セキュリティ" },
];

export default function Profile() {
  const {
    cognitoUser,
    signOut,
    staff,
    isAutoSaving,
    isAutoSavePending,
    lastSavedAt,
    notificationControl,
    linksControl,
    passwordControl,
    handlePasswordSubmit,
    getPasswordValues,
    resetPasswordForm,
    externalLinkFields,
    canAddMoreLinks,
    hasPendingLinkInput,
    handleAddLink,
    handleRemoveLink,
    isNotificationDirty,
    isLinksDirty,
    isPasswordDirty,
    isPasswordValid,
    isPasswordSubmitting,
  } = useProfileForm();

  const [activeTab, setActiveTab] = useState<ProfileTab>("general");

  const { dialog } = usePageLeaveGuard({
    isDirty: isNotificationDirty || isLinksDirty || isPasswordDirty || isAutoSavePending,
    isBusy: isAutoSaving || isPasswordSubmitting,
  });

  if (!cognitoUser || staff === undefined) {
    return null;
  }

  const profileName = `${cognitoUser.familyName} ${cognitoUser.givenName}`;
  const roleLabel = staff?.role ? roleLabelMap.get(staff.role) : "未設定";
  const usageStartDateLabel = staff?.usageStartDate
    ? dayjs(staff.usageStartDate).format(AttendanceDate.DisplayFormat)
    : "未設定";
  const renderTabSection = (content: ReactNode) => (
    <section className="min-w-0 w-full rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4 shadow-[0_24px_54px_-40px_rgba(15,23,42,0.35)] sm:rounded-[2rem] sm:p-6">
      {content}
    </section>
  );
  const profileTabItems = [
    {
      value: profileTabs[0].value,
      label: profileTabs[0].label,
      content: renderTabSection(
        <ProfileGeneralTab
          mailAddress={cognitoUser.mailAddress}
          roleLabel={roleLabel ?? "未設定"}
          usageStartDateLabel={usageStartDateLabel}
          signOut={signOut}
        />
      ),
    },
    {
      value: profileTabs[1].value,
      label: profileTabs[1].label,
      content: renderTabSection(
        <ProfileNotificationsTab
          notificationControl={notificationControl}
          isAutoSaving={isAutoSaving}
          isAutoSavePending={isAutoSavePending}
          lastSavedAt={lastSavedAt}
        />
      ),
    },
    {
      value: profileTabs[2].value,
      label: profileTabs[2].label,
      content: renderTabSection(
        <ProfileLinksTab
          linksControl={linksControl}
          externalLinkFields={externalLinkFields}
          handleAddLink={handleAddLink}
          handleRemoveLink={handleRemoveLink}
          canAddMoreLinks={canAddMoreLinks}
          isAutoSaving={isAutoSaving}
          isAutoSavePending={isAutoSavePending}
          lastSavedAt={lastSavedAt}
          hasPendingLinkInput={hasPendingLinkInput}
        />
      ),
    },
    {
      value: profileTabs[3].value,
      label: profileTabs[3].label,
      content: renderTabSection(
        <ProfileSecurityTab
          passwordControl={passwordControl}
          handlePasswordSubmit={handlePasswordSubmit}
          getPasswordValues={getPasswordValues}
          resetPasswordForm={resetPasswordForm}
          isPasswordValid={isPasswordValid}
          isPasswordSubmitting={isPasswordSubmitting}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1280px] overflow-x-hidden px-4 py-3 sm:px-8 sm:py-6 lg:px-12">
      {dialog}
      <div className="min-w-0 space-y-3 sm:space-y-5">
        <section
          className="w-full overflow-hidden rounded-[1.5rem] border border-emerald-100/80 bg-[linear-gradient(135deg,#f7fcf8_0%,#ecfdf5_55%,#ffffff_100%)] shadow-[0_28px_60px_-40px_rgba(15,23,42,0.35)] sm:rounded-[2rem]"
          style={{ maxWidth: PROFILE_CONTENT_MAX_WIDTH }}
        >
          <div className="grid gap-3 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(240px,0.85fr)] lg:items-end">
            <div className="min-w-0 space-y-2">
              <div className="space-y-2">
                <PageTitle className="text-[1.75rem] font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
                  個人設定
                </PageTitle>
                <p className="max-w-2xl text-sm leading-5 text-slate-600 sm:text-[0.95rem] sm:leading-6">
                  通知、個人リンク、ログイン情報をここで管理します。日常的に触る設定をひとつの画面にまとめています。
                </p>
              </div>
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <InfoCard label="名前" value={`${profileName} さん`} />
              <InfoCard label="権限" value={roleLabel ?? "未設定"} />
            </div>
          </div>
        </section>

        <div
          className="w-full rounded-[1.25rem] border border-emerald-100/80 bg-white/80 p-1.5 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.35)] sm:rounded-[1.5rem] sm:p-2"
          style={{ maxWidth: PROFILE_CONTENT_MAX_WIDTH }}
        >
          <AppTabs
            value={activeTab}
            onChange={setActiveTab}
            items={profileTabItems}
            panelPadding={0}
            tabsProps={{ "aria-label": "プロフィール設定タブ" }}
          />
        </div>
      </div>
    </div>
  );
}
