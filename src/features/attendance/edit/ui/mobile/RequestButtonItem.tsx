import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { AppButton } from "@shared/ui/button";
import { UseFormHandleSubmit } from "react-hook-form";

export function RequestButtonItem({
  handleSubmit,
  onSubmit,
  isDirty: _isDirty,
  isValid: _isValid,
  isSubmitting,
}: {
  handleSubmit: UseFormHandleSubmit<AttendanceEditInputs>;
  onSubmit: (data: AttendanceEditInputs) => Promise<void>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}) {
  return (
    <AppButton
      onClick={handleSubmit(onSubmit)}
      loading={isSubmitting}
      fullWidth
      size="lg"
    >
      申請
    </AppButton>
  );
}
