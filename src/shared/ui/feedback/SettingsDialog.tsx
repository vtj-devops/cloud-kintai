import { type ReactNode } from "react";

import AppDialog from "./AppDialog";
import { useDialogCloseGuard } from "./useDialogCloseGuard";

type SettingsDialogProps = {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  isDirty?: boolean;
  isBusy?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  children: ReactNode;
};

export default function SettingsDialog({
  title,
  description,
  open,
  onClose,
  isDirty,
  isBusy,
  maxWidth,
  children,
}: SettingsDialogProps) {
  const { dialog, requestClose } = useDialogCloseGuard({ isDirty, isBusy, onClose });

  return (
    <>
      {dialog}
      <AppDialog
        open={open}
        onClose={requestClose}
        title={title}
        description={description}
        maxWidth={maxWidth}
        actions={
          <button
            type="button"
            onClick={requestClose}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
          >
            閉じる
          </button>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>
      </AppDialog>
    </>
  );
}
