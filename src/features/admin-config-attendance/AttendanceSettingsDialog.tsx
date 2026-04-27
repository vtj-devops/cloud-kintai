import SettingsDialog from "@shared/ui/feedback/SettingsDialog";

import AttendanceSettingsContent from "./AttendanceSettingsContent";

type AttendanceSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AttendanceSettingsDialog({
  open,
  onClose,
}: AttendanceSettingsDialogProps) {
  return (
    <SettingsDialog
      open={open}
      onClose={onClose}
      title="勤怠設定"
      description="勤怠一覧と勤怠編集に関わる設定を、この画面からまとめて見直せます。"
      maxWidth="xl"
    >
      <AttendanceSettingsContent />
    </SettingsDialog>
  );
}
