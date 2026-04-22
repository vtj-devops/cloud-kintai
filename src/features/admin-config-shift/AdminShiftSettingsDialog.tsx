import AppDialog from "@shared/ui/feedback/AppDialog";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";

import AdminShiftSettingsContent from "./AdminShiftSettingsContent";
import { useAdminShiftSettings } from "./useAdminShiftSettings";

type AdminShiftSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

const subtleButtonClassName =
  "rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white";

export default function AdminShiftSettingsDialog({
  open,
  onClose,
}: AdminShiftSettingsDialogProps) {
  const state = useAdminShiftSettings();
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
        title="シフト設定"
        description="シフトグループの構成と管理画面の表示モードをこの画面から見直せます。"
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
          <AdminShiftSettingsContent state={state} />
        </div>
      </AppDialog>
    </>
  );
}
