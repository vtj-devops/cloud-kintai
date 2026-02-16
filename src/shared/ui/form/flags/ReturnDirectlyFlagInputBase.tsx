import { Box, Stack, styled, Typography } from "@mui/material";
import Checkbox, { CheckboxProps } from "@mui/material/Checkbox";
import type { ComponentType } from "react";
import { forwardRef } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";

const MobileLabel = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  paddingBottom: theme.spacing(1),
}));

type Layout = "row" | "inline";
type BooleanInputComponent = ComponentType<Record<string, unknown>>;

export interface ReturnDirectlyFlagInputBaseProps<
  TFieldValues extends FieldValues
> {
  control: Control<TFieldValues> | undefined;
  disabled?: boolean;
  onChangeFlag?: (checked: boolean) => void;
  label?: string;
  checkedValueName?: Path<TFieldValues>;
  inputComponent?: BooleanInputComponent;
  layout?: Layout;
}

export default function ReturnDirectlyFlagInputBase<
  TFieldValues extends FieldValues
>({
  control,
  disabled = false,
  onChangeFlag,
  label = "直帰",
  checkedValueName = "returnDirectlyFlag" as Path<TFieldValues>,
  inputComponent,
  layout = "row",
}: ReturnDirectlyFlagInputBaseProps<TFieldValues>) {
  if (!control) return null;

  const DefaultInput = forwardRef<HTMLInputElement, CheckboxProps>(
    function DefaultInput(props, ref) {
      return <Checkbox {...props} inputRef={ref} />;
    }
  );

  const Input = inputComponent ?? DefaultInput;

  const handleToggle = (
    value: boolean | undefined,
    onChange: (nextValue: boolean) => void
  ) => {
    const nextValue = !value;
    if (onChangeFlag) onChangeFlag(nextValue);
    onChange(nextValue);
  };

  if (layout === "row") {
    return (
      <Stack direction="row" alignItems="center">
        <Box className="w-[150px] font-bold">{label}</Box>
        <Box>
          <Controller
            name={checkedValueName}
            control={control}
            disabled={disabled}
            render={({ field }) => (
              <Input
                {...field}
                checked={field.value || false}
                onChange={() => handleToggle(field.value, field.onChange)}
              />
            )}
          />
        </Box>
      </Stack>
    );
  }

  return (
    <Stack direction="row" alignItems="center">
      <MobileLabel>{label}</MobileLabel>
      <Controller
        name={checkedValueName}
        control={control}
        disabled={disabled}
        render={({ field }) => (
          <Input
            {...field}
            checked={field.value || false}
            onChange={() => handleToggle(field.value, field.onChange)}
          />
        )}
      />
    </Stack>
  );
}
