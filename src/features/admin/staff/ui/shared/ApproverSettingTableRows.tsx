import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import {
  StaffApproverFormValues,
  StaffAutocompleteOption,
  toAdminApproverOptions,
} from "@features/admin/staff/model/staffForm";
import {
  Autocomplete,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { ApproverMultipleMode, ApproverSettingMode } from "@shared/api/graphql/types";
import { useMemo } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

type Props<TFieldValues extends FieldValues & StaffApproverFormValues> = {
  control: Control<TFieldValues>;
  watch: <K extends keyof TFieldValues>(name: K) => TFieldValues[K];
  staffs: StaffType[];
  currentCognitoUserId?: string | null;
  labelCellClassName: string;
  valueCellClassName: string;
};

export function ApproverSettingTableRows<
  TFieldValues extends FieldValues & StaffApproverFormValues,
>({
  control,
  watch,
  staffs,
  currentCognitoUserId,
  labelCellClassName,
  valueCellClassName,
}: Props<TFieldValues>) {
  const adminOptions = useMemo<StaffAutocompleteOption[]>(
    () => toAdminApproverOptions(staffs, currentCognitoUserId),
    [staffs, currentCognitoUserId],
  );
  const approverSetting = watch(
    "approverSetting" as Path<TFieldValues>,
  ) as StaffApproverFormValues["approverSetting"];
  const approverMultiple =
    (watch("approverMultiple" as Path<TFieldValues>) as string[] | null | undefined) ??
    [];
  const approverMultipleMode = watch(
    "approverMultipleMode" as Path<TFieldValues>,
  ) as StaffApproverFormValues["approverMultipleMode"];
  const selectedMultipleOptions = approverMultiple
    .filter((value): value is string => Boolean(value))
    .map((value) => adminOptions.find((option) => option.value === value))
    .filter((option): option is StaffAutocompleteOption => Boolean(option));

  return (
    <>
      {approverSetting === ApproverSettingMode.SINGLE && (
        <tr>
          <td className={labelCellClassName} />
          <td className={valueCellClassName}>
            <Controller
              name={"approverSingle" as Path<TFieldValues>}
              control={control}
              rules={{
                validate: (value) => {
                  if (approverSetting !== ApproverSettingMode.SINGLE) {
                    return true;
                  }
                  return Boolean(value) || "承認者を選択してください";
                },
              }}
              render={({ field, fieldState }) => {
                const valueOption = adminOptions.find(
                  (option) => option.value === field.value,
                );
                return (
                  <Autocomplete
                    value={valueOption ?? null}
                    options={adminOptions}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.value ?? null);
                    }}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.value === value.value
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        sx={{ width: { xs: "100%", sm: 400 } }}
                        label="承認者"
                        placeholder="承認者を検索"
                        error={Boolean(fieldState.error)}
                        helperText={
                          fieldState.error?.message ||
                          "承認者を1名選択してください。"
                        }
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                );
              }}
            />
          </td>
        </tr>
      )}

      {approverSetting === ApproverSettingMode.MULTIPLE && (
        <>
          <tr>
            <td className={labelCellClassName} />
            <td className={valueCellClassName}>
              <Controller
                name={"approverMultiple" as Path<TFieldValues>}
                control={control}
                rules={{
                  validate: (value) => {
                    if (approverSetting !== ApproverSettingMode.MULTIPLE) {
                      return true;
                    }
                    return (value?.length ?? 0) > 0 || "承認者を選択してください";
                  },
                }}
                render={({ field, fieldState }) => {
                  const selectedValues = (field.value ?? []) as string[];
                  const valueOptions = selectedValues
                    .map((value: string) =>
                      adminOptions.find((option) => option.value === value),
                    )
                    .filter(
                      (
                        option: StaffAutocompleteOption | undefined,
                      ): option is StaffAutocompleteOption => Boolean(option),
                    );

                  return (
                    <Autocomplete<StaffAutocompleteOption, true>
                      multiple
                      options={adminOptions}
                      value={valueOptions}
                      onChange={(_, newValue) => {
                        field.onChange(newValue.map((option) => option.value));
                      }}
                      disableCloseOnSelect
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option.value}
                            label={option.label}
                            size="small"
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          sx={{ width: { xs: "100%", sm: 400 } }}
                          label="承認者"
                          placeholder="承認者を選択"
                          error={Boolean(fieldState.error)}
                          helperText={
                            fieldState.error?.message ||
                            (approverMultipleMode === ApproverMultipleMode.ORDER
                              ? "選択した順番が承認順になります。"
                              : "複数選択できます。")
                          }
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  );
                }}
              />
            </td>
          </tr>

          <tr>
            <td className={labelCellClassName} />
            <td className={valueCellClassName}>
              <Controller
                name={"approverMultipleMode" as Path<TFieldValues>}
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    row
                    value={field.value ?? ApproverMultipleMode.ANY}
                    onChange={(event) => {
                      const nextValue = event.target.value as ApproverMultipleMode;
                      field.onChange(nextValue);
                    }}
                  >
                    <FormControlLabel
                      value={ApproverMultipleMode.ANY}
                      control={<Radio />}
                      label="誰か1人が承認すれば完了"
                    />
                    <FormControlLabel
                      value={ApproverMultipleMode.ORDER}
                      control={<Radio />}
                      label="設定した順番で承認"
                    />
                  </RadioGroup>
                )}
              />
            </td>
          </tr>

          {approverMultipleMode === ApproverMultipleMode.ORDER && (
            <tr>
              <td className={labelCellClassName} />
              <td className={valueCellClassName}>
                <div className="space-y-1">
                  {selectedMultipleOptions.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      承認順を設定するスタッフを選択してください。
                    </p>
                  ) : (
                    selectedMultipleOptions.map((option, index) => (
                      <div key={option.value} className="flex items-center gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-1 text-xs font-semibold text-slate-700">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm text-slate-900">{option.label}</p>
                          <p className="text-xs text-slate-500">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <p className="text-xs text-slate-500">
                    選択した順番が承認順として利用されます。
                  </p>
                </div>
              </td>
            </tr>
          )}
        </>
      )}
    </>
  );
}
