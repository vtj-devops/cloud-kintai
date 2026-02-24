import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import Title from "@shared/ui/typography/Title";

import AttendanceStatisticsSection from "@/features/admin/configManagement/ui/AttendanceStatisticsSection";
import GroupSection from "@/features/admin/configManagement/ui/GroupSection";
import LinkListSection from "@/features/admin/configManagement/ui/LinkListSection";
import OfficeModeSection from "@/features/admin/configManagement/ui/OfficeModeSection";
import QuickInputSection from "@/features/admin/configManagement/ui/QuickInputSection";
import ReasonListSection from "@/features/admin/configManagement/ui/ReasonListSection";
import WorkingTimeSection from "@/features/admin/configManagement/ui/WorkingTimeSection";

import { useAdminConfigForm } from "../model/useAdminConfigForm";

export default function AdminConfigManagement() {
  const {
    sectionSpacing,
    startTime,
    endTime,
    lunchRestStartTime,
    lunchRestEndTime,
    quickInputStartTimes,
    quickInputEndTimes,
    links,
    reasons,
    officeMode,
    hourlyPaidHolidayEnabled,
    amHolidayStartTime,
    amHolidayEndTime,
    pmHolidayStartTime,
    pmHolidayEndTime,
    amPmHolidayEnabled,
    specialHolidayEnabled,
    absentEnabled,
    attendanceStatisticsEnabled,
    overTimeCheckEnabled,
    setStartTime,
    setEndTime,
    setLunchRestStartTime,
    setLunchRestEndTime,
    setAmHolidayStartTime,
    setAmHolidayEndTime,
    setPmHolidayStartTime,
    setPmHolidayEndTime,
    setAmPmHolidayEnabled,
    handleOfficeModeChange,
    handleHourlyPaidHolidayEnabledChange,
    handleSpecialHolidayEnabledChange,
    handleAbsentEnabledChange,
    handleAttendanceStatisticsEnabledChange,
    handleOverTimeCheckEnabledChange,
    handleAddLink,
    handleLinkChange,
    handleRemoveLink,
    handleAddReason,
    handleReasonChange,
    handleRemoveReason,
    handleAddQuickInputStartTime,
    handleQuickInputStartTimeChange,
    handleQuickInputStartTimeToggle,
    handleRemoveQuickInputStartTime,
    handleAddQuickInputEndTime,
    handleQuickInputEndTimeChange,
    handleQuickInputEndTimeToggle,
    handleRemoveQuickInputEndTime,
    handleSave,
  } = useAdminConfigForm();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack
        spacing={0}
        sx={{
          pb: 2,
          gap: sectionSpacing,
          alignItems: "flex-start",
          maxWidth: 1040,
          width: "100%",
        }}
      >
        <Title>設定</Title>
        <GroupSection title="勤務時間">
          <Stack spacing={1}>
            <WorkingTimeSection
              startTime={startTime}
              endTime={endTime}
              lunchRestStartTime={lunchRestStartTime}
              lunchRestEndTime={lunchRestEndTime}
              setStartTime={setStartTime}
              setEndTime={setEndTime}
              setLunchRestStartTime={setLunchRestStartTime}
              setLunchRestEndTime={setLunchRestEndTime}
            />
          </Stack>
        </GroupSection>
        <GroupSection
          title="午前/午後休暇(β版)"
          description={
            <>
              この機能が有効な場合、午前休暇と午後休暇の時間帯を設定できます。
              <br />
              午前休暇は通常の勤務時間の前半、午後休暇は後半に適用されます。
              <br />
              ベータ(β)版は、まだ完全ではないため、予期しない動作が発生する可能性があります。
            </>
          }
        >
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={amPmHolidayEnabled}
                  onChange={(_, checked) => setAmPmHolidayEnabled(checked)}
                  color="primary"
                />
              }
              label={amPmHolidayEnabled ? "有効" : "無効"}
              sx={{ mb: 1 }}
            />
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ flexWrap: "wrap", rowGap: 1.5 }}
            >
              <Typography variant="subtitle1">午前</Typography>
              <TimePicker
                label="開始"
                value={amHolidayStartTime}
                onChange={setAmHolidayStartTime}
                ampm={false}
                format="HH:mm"
                slotProps={{ textField: { size: "small" } }}
                sx={{ width: 160 }}
                disabled={!amPmHolidayEnabled}
              />
              <Typography>〜</Typography>
              <TimePicker
                label="終了"
                value={amHolidayEndTime}
                onChange={setAmHolidayEndTime}
                ampm={false}
                format="HH:mm"
                slotProps={{ textField: { size: "small" } }}
                sx={{ width: 160 }}
                disabled={!amPmHolidayEnabled}
              />
            </Stack>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ flexWrap: "wrap", rowGap: 1.5 }}
            >
              <Typography variant="subtitle1">午後</Typography>
              <TimePicker
                label="開始"
                value={pmHolidayStartTime}
                onChange={setPmHolidayStartTime}
                ampm={false}
                format="HH:mm"
                slotProps={{ textField: { size: "small" } }}
                sx={{ width: 160 }}
                disabled={!amPmHolidayEnabled}
              />
              <Typography>〜</Typography>
              <TimePicker
                label="終了"
                value={pmHolidayEndTime}
                onChange={setPmHolidayEndTime}
                ampm={false}
                format="HH:mm"
                slotProps={{ textField: { size: "small" } }}
                sx={{ width: 160 }}
                disabled={!amPmHolidayEnabled}
              />
            </Stack>
          </Stack>
        </GroupSection>
        <GroupSection
          title="特別休暇"
          description="忌引きなど特別な休暇を設定します。有効にすると、勤怠編集画面で申請や編集が可能になります。"
        >
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={specialHolidayEnabled}
                  onChange={handleSpecialHolidayEnabledChange}
                  color="primary"
                />
              }
              label={specialHolidayEnabled ? "有効" : "無効"}
              sx={{ mb: 1 }}
            />
          </Stack>
        </GroupSection>
        <GroupSection
          title="稼働統計"
          description="勤怠メニュー内の稼働統計の表示・非表示を切り替えます。"
        >
          <AttendanceStatisticsSection
            enabled={attendanceStatisticsEnabled}
            onChange={handleAttendanceStatisticsEnabledChange}
          />
        </GroupSection>
        <GroupSection title="欠勤">
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={absentEnabled}
                  onChange={handleAbsentEnabledChange}
                  color="primary"
                />
              }
              label={absentEnabled ? "有効" : "無効"}
              sx={{ mb: 1 }}
            />
          </Stack>
        </GroupSection>
        <GroupSection
          title="残業チェック機能"
          description="勤怠編集画面で、残業申請がない場合にエラーを表示するかどうかを切り替えます。"
        >
          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={overTimeCheckEnabled}
                  onChange={handleOverTimeCheckEnabledChange}
                  color="primary"
                />
              }
              label={overTimeCheckEnabled ? "有効" : "無効"}
              sx={{ mb: 1 }}
            />
          </Stack>
        </GroupSection>
        <GroupSection title="出勤モード">
          <OfficeModeSection
            officeMode={officeMode}
            onOfficeModeChange={handleOfficeModeChange}
            hourlyPaidHolidayEnabled={hourlyPaidHolidayEnabled}
            onHourlyPaidHolidayEnabledChange={
              handleHourlyPaidHolidayEnabledChange
            }
          />
        </GroupSection>
        <GroupSection title="外部リンク">
          <Stack spacing={1}>
            <LinkListSection
              links={links}
              onAddLink={handleAddLink}
              onLinkChange={handleLinkChange}
              onRemoveLink={handleRemoveLink}
            />
          </Stack>
        </GroupSection>
        <GroupSection title="打刻理由リスト">
          <Stack spacing={1}>
            <ReasonListSection
              reasons={reasons}
              onAddReason={handleAddReason}
              onReasonChange={handleReasonChange}
              onRemoveReason={handleRemoveReason}
            />
          </Stack>
        </GroupSection>
        <GroupSection title="クイック入力(打刻)設定">
          <QuickInputSection
            quickInputStartTimes={quickInputStartTimes}
            quickInputEndTimes={quickInputEndTimes}
            onAddQuickInputStartTime={handleAddQuickInputStartTime}
            onQuickInputStartTimeChange={handleQuickInputStartTimeChange}
            onQuickInputStartTimeToggle={handleQuickInputStartTimeToggle}
            onRemoveQuickInputStartTime={handleRemoveQuickInputStartTime}
            onAddQuickInputEndTime={handleAddQuickInputEndTime}
            onQuickInputEndTimeChange={handleQuickInputEndTimeChange}
            onQuickInputEndTimeToggle={handleQuickInputEndTimeToggle}
            onRemoveQuickInputEndTime={handleRemoveQuickInputEndTime}
          />
        </GroupSection>
        <Typography variant="body2" color="textSecondary">
          スタッフ側への設定反映には数分程度かかる場合があります。
        </Typography>
        <Button variant="contained" color="primary" onClick={handleSave}>
          保存
        </Button>
      </Stack>
    </LocalizationProvider>
  );
}
