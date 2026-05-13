import SettingsIcon from "@features/admin/layout/ui/SettingsIcon";
import AttendanceSettingsDialog from "@features/admin-config-attendance/AttendanceSettingsDialog";
import AttendanceDailyList from "@features/attendance/daily-list/ui/AttendanceDailyList";
import DownloadForm from "@features/attendance/download-form/ui/DownloadForm";
import { Stack } from "@mui/material";
import { designTokenVar } from "@shared/designSystem";
import { AppButton } from "@shared/ui/button";
import { PageSection } from "@shared/ui/layout";
import { useState } from "react";

const PAGE_PADDING_X = {
  xs: designTokenVar("spacing.sm", "8px"),
  md: designTokenVar("spacing.xxl", "32px"),
};

const PAGE_PADDING_Y = {
  xs: designTokenVar("spacing.xl", "24px"),
  md: designTokenVar("spacing.xxl", "32px"),
};

const PAGE_SECTION_GAP = designTokenVar("spacing.lg", "16px");

export default function AdminAttendance() {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  return (
    <>
      <AttendanceSettingsDialog
        open={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
      />
      <Stack
        component="section"
        sx={{
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
          px: PAGE_PADDING_X,
          py: PAGE_PADDING_Y,
          gap: PAGE_SECTION_GAP,
        }}
      >
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.38)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-2xl">
                勤怠管理
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                勤怠一覧の確認と出力、勤怠ルールの見直しを行う画面です。右上の設定ボタンから、勤務時間や半休、入力補助などの勤怠設定をまとめて管理できます。
              </p>
            </div>

            <AppButton
              variant="outline"
              tone="secondary"
              onClick={() => setIsSettingsDialogOpen(true)}
              className="self-start"
              aria-label="勤怠設定を開く"
              startIcon={
                <SettingsIcon name="settings" className="text-current" />
              }
            >
              <span>設定</span>
            </AppButton>
          </div>
        </section>
        <PageSection
          variant="surface"
          layoutVariant="dashboard"
          className="gap-0"
          sx={{
            position: "relative",
            zIndex: 20,
            overflow: "visible",
            borderRadius: "24px",
            border: "1px solid rgba(226,232,240,0.8)",
            backgroundColor: "#ffffff",
            boxShadow: "0 24px 48px -36px rgba(15,23,42,0.35)",
          }}
        >
          <DownloadForm />
        </PageSection>
        <PageSection
          variant="surface"
          layoutVariant="dashboard"
          className="gap-0"
          sx={{
            position: "relative",
            zIndex: 10,
            borderRadius: "24px",
            border: "1px solid rgba(226,232,240,0.8)",
            backgroundColor: "#ffffff",
            boxShadow: "0 24px 48px -36px rgba(15,23,42,0.35)",
          }}
        >
          <AttendanceDailyList />
        </PageSection>
      </Stack>
    </>
  );
}
