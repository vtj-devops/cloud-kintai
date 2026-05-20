import { ROLE_OPTIONS } from "@features/admin/staff/model/staffForm";
import { Autocomplete, TextField } from "@mui/material";
import type { Control, FieldValues, Path, UseFormSetValue } from "react-hook-form";
import { Controller } from "react-hook-form";

type StaffRoleTableCellProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
};

const VALUE_CELL_CLASS = "border-b border-slate-200 px-4 py-3 align-middle";

export function StaffRoleTableCell<TFieldValues extends FieldValues>({
  control,
  setValue,
}: StaffRoleTableCellProps<TFieldValues>) {
  return (
    <td className={VALUE_CELL_CLASS}>
      <Controller
        name={"role" as Path<TFieldValues>}
        control={control}
        render={({ field }) => (
          <Autocomplete
            {...field}
            value={
              ROLE_OPTIONS.find((option) => String(option.value) === field.value) ??
              null
            }
            options={ROLE_OPTIONS}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                sx={{ width: { xs: "100%", sm: 400 } }}
              />
            )}
            onChange={(_, data) => {
              if (!data) return;
              setValue("role" as Path<TFieldValues>, data.value as never);
              field.onChange(data.value);
            }}
          />
        )}
      />
    </td>
  );
}
