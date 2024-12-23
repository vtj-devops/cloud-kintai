import { Button, CircularProgress } from "@mui/material";
import { UseFormHandleSubmit } from "react-hook-form";

import { AttendanceEditInputs } from "../common";

export function RequestButtonItem({
  handleSubmit,
  onSubmit,
  isDirty,
  isValid,
  isSubmitting,
}: {
  handleSubmit: UseFormHandleSubmit<AttendanceEditInputs, undefined>;
  onSubmit: (data: AttendanceEditInputs) => Promise<void>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}) {
  return (
    <Button
      variant="contained"
      size="medium"
      onClick={handleSubmit(onSubmit)}
      // disabled={!isDirty || !isValid || isSubmitting}
      startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
    >
      申請
    </Button>
  );
}
