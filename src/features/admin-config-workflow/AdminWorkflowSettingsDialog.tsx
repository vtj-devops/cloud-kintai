import AppDialog from "@shared/ui/feedback/AppDialog";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";

import AdminWorkflowSettingsContent from "./AdminWorkflowSettingsContent";
import { useAdminWorkflowSettings } from "./useAdminWorkflowSettings";

type AdminWorkflowSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

const subtleButtonClassName =
  "rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white";

export default function AdminWorkflowSettingsDialog({
  open,
  onClose,
}: AdminWorkflowSettingsDialogProps) {
  const state = useAdminWorkflowSettings();
  const { dialog, requestClose } = useDialogCloseGuard({
    isDirty: state.isDirty,
    isBusy: state.isBusy,
    onClose,
  });

  return (
    <>
      {dialog}
      <AppDialog
        open={open}
        onClose={requestClose}
        title="ワークフロー設定"
        description="申請カテゴリの表示順や有効状態、その他申請用テンプレートをこの画面から見直せます。"
        maxWidth="lg"
        actions={
          <button
            type="button"
            onClick={requestClose}
            className={subtleButtonClassName}
          >
            閉じる
          </button>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <AdminWorkflowSettingsContent state={state} />
        </div>
      </AppDialog>
    </>
  );
}
