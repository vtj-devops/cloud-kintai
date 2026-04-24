import SettingsDialog from "@shared/ui/feedback/SettingsDialog";

import AdminWorkflowSettingsContent from "./AdminWorkflowSettingsContent";
import { useAdminWorkflowSettings } from "./useAdminWorkflowSettings";

type AdminWorkflowSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function AdminWorkflowSettingsDialog({
  open,
  onClose,
}: AdminWorkflowSettingsDialogProps) {
  const state = useAdminWorkflowSettings();

  return (
    <SettingsDialog
      open={open}
      onClose={onClose}
      title="ワークフロー設定"
      description="申請カテゴリの表示順や有効状態、その他申請用テンプレートをこの画面から見直せます。"
      maxWidth="lg"
      isDirty={state.isDirty}
      isBusy={state.isBusy}
    >
      <AdminWorkflowSettingsContent state={state} />
    </SettingsDialog>
  );
}
