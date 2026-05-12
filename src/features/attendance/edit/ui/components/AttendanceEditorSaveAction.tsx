import { AppButton } from "@shared/ui/button";

type AttendanceEditorSaveActionProps = {
  readOnly?: boolean;
  disabled: boolean;
  loading: boolean;
  onSave: () => void;
};

export function AttendanceEditorSaveAction({
  readOnly,
  disabled,
  loading,
  onSave,
}: AttendanceEditorSaveActionProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div>
        {!readOnly && (
          <AppButton
            onClick={onSave}
            disabled={disabled}
            loading={loading}
            size="lg"
          >
            {loading ? "保存中..." : "保存"}
          </AppButton>
        )}
      </div>
    </div>
  );
}