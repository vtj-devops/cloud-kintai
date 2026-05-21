import FileUploadIcon from "@mui/icons-material/FileUpload";
import { AppButton } from "@shared/ui/button";
import AppDialog from "@shared/ui/feedback/AppDialog";
import { type Dispatch, type ReactNode, type SetStateAction, useState } from "react";

export type BulkUploadDialogRenderProps<T> = {
  uploadedData: T[];
  setUploadedData: Dispatch<SetStateAction<T[]>>;
  isSubmitting: boolean;
};

type BulkUploadDialogShellProps<T> = {
  onSubmit: (
    uploadedData: readonly T[],
    helpers: { setUploadedData: Dispatch<SetStateAction<T[]>> },
  ) => Promise<boolean>;
  renderContent: (props: BulkUploadDialogRenderProps<T>) => ReactNode;
  dialogTitle?: string;
  triggerLabel?: string;
  registerLabel?: string;
  registeringLabel?: string;
  confirmMessage?: (count: number) => string;
  disableRegisterWhenNoData?: boolean;
  closeMode?: "success" | "always";
  disableCancelWhenSubmitting?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

export function BulkUploadDialogShell<T>({
  onSubmit,
  renderContent,
  dialogTitle = "ファイルからまとめて追加",
  triggerLabel = "ファイルからまとめて追加",
  registerLabel = "登録",
  registeringLabel,
  confirmMessage = (count) => `以下の${count}件のデータを登録しますか？`,
  disableRegisterWhenNoData = false,
  closeMode = "success",
  disableCancelWhenSubmitting = false,
  onOpen,
  onClose,
}: BulkUploadDialogShellProps<T>) {
  const [open, setOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState<T[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = () => {
    onOpen?.();
    setOpen(true);
  };

  const handleClose = () => {
    onClose?.();
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (uploadedData.length === 0) {
      if (closeMode === "always") {
        handleClose();
      }
      return;
    }

    // eslint-disable-next-line no-alert
    const result = window.confirm(confirmMessage(uploadedData.length));
    if (!result) {
      if (closeMode === "always") {
        handleClose();
      }
      return;
    }

    if (closeMode === "always") {
      handleClose();
    }

    setIsSubmitting(true);
    let isSucceeded = false;

    try {
      isSucceeded = await onSubmit(uploadedData, { setUploadedData });
    } finally {
      setIsSubmitting(false);
    }

    if (closeMode === "success" && isSucceeded) {
      handleClose();
    }
  };

  const submitLabel = isSubmitting && registeringLabel ? registeringLabel : registerLabel;

  return (
    <>
      <AppButton variant="outline" startIcon={<FileUploadIcon />} onClick={handleOpen}>
        {triggerLabel}
      </AppButton>
      <AppDialog
        open={open}
        onClose={handleClose}
        title={dialogTitle}
        actions={
          <>
            <AppButton
              variant="ghost"
              onClick={handleClose}
              disabled={disableCancelWhenSubmitting && isSubmitting}
            >
              キャンセル
            </AppButton>
            <AppButton
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (disableRegisterWhenNoData && uploadedData.length === 0)
              }
            >
              {submitLabel}
            </AppButton>
          </>
        }
      >
        {renderContent({ uploadedData, setUploadedData, isSubmitting })}
      </AppDialog>
    </>
  );
}
