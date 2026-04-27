import SettingsDialog from "@shared/ui/feedback/SettingsDialog";

import AdminShiftSettingsContent from "./AdminShiftSettingsContent";
import { useAdminShiftSettings } from "./useAdminShiftSettings";

type AdminShiftSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AdminShiftSettingsDialog({
  open,
  onClose,
}: AdminShiftSettingsDialogProps) {
  const state = useAdminShiftSettings();

  return (
    <SettingsDialog
      open={open}
      onClose={onClose}
      title="シフト設定"
      description="シフトグループの構成と管理画面の表示モードをこの画面から見直せます。"
      maxWidth="lg"
      isDirty={state.isDirty}
      isBusy={state.isBusy}
    >
      <AdminShiftSettingsContent state={state} />
    </SettingsDialog>
  );
}
