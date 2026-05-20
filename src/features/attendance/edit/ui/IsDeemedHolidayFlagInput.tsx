import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import {
  Checkbox,
  Stack,
  Typography,
} from "@mui/material";
import { useIsMobile } from "@shared/lib/hooks/useIsMobile";
import { Control, Controller } from "react-hook-form";

export default function IsDeemedHolidayFlagInput({
  control,
  name,
  disabled = false,
  helperText,
}: {
  control: Control<AttendanceEditInputs>;
  name: keyof AttendanceEditInputs;
  disabled?: boolean;
  helperText?: string;
}) {
  const isMobile = useIsMobile();

  return (
    <Stack direction="column" spacing={0.5} mb={isMobile ? 1 : undefined}>
      <Typography variant="body2">
        勤務形態がシフト勤務のスタッフのみ設定が可能です。
      </Typography>
      <Typography variant="body2">
        設定した場合は、土日祝日と同様に休日扱いとなります。
      </Typography>
      <Stack direction="row" alignItems="center" spacing={isMobile ? 1 : undefined}>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={Boolean(field.value)}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={disabled}
            />
          )}
        />
      </Stack>
      {helperText && (
        <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
          {helperText}
        </Typography>
      )}
    </Stack>
  );
}

