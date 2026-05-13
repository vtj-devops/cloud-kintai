import { AppButton } from "@shared/ui/button";
import dayjs, { type Dayjs } from "dayjs";
import type {
  ChangeEvent,
  CSSProperties,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type SettingsButtonVariant = "primary" | "secondary" | "danger";
type SettingsButtonSize = "sm" | "md";

type SettingsButtonProps = {
  variant?: SettingsButtonVariant;
  size?: SettingsButtonSize;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

type SettingsRowProps = {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

type FieldBaseProps = {
  label?: ReactNode;
  helperText?: ReactNode;
  errorText?: ReactNode;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
  required?: boolean;
};

type SettingsTextFieldProps = FieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  autoComplete?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  maxLength?: number;
  style?: CSSProperties;
};

type SettingsTextAreaFieldProps = FieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  minRows?: number;
  textAreaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "onChange" | "disabled"
  >;
};

type SelectOption = {
  value: string;
  label: string;
  content?: ReactNode;
};

type SettingsSelectProps = FieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  name?: string;
  id?: string;
};

type SettingsCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

type SettingsSwitchProps = SettingsCheckboxProps;

type SettingsTimeFieldProps = FieldBaseProps & {
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  id?: string;
  name?: string;
};

type SettingsAlertProps = {
  children: ReactNode;
  variant?: "info" | "warning" | "error";
  className?: string;
};

const fieldContainerClassName = "flex flex-col gap-1";
const fieldLabelClassName = "text-sm font-medium text-slate-700";
const fieldBaseInputClassName =
  "w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500";

const getFieldStateClassName = (hasError: boolean) =>
  hasError
    ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
    : "border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

const createTimeValue = (value: string) => {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);

  if (
    Number.isNaN(parsedHours) ||
    Number.isNaN(parsedMinutes) ||
    parsedHours < 0 ||
    parsedHours > 23 ||
    parsedMinutes < 0 ||
    parsedMinutes > 59
  ) {
    return null;
  }

  return dayjs()
    .hour(parsedHours)
    .minute(parsedMinutes)
    .second(0)
    .millisecond(0);
};

function FieldMessages({
  helperText,
  errorText,
}: {
  helperText?: ReactNode;
  errorText?: ReactNode;
}) {
  if (!helperText && !errorText) {
    return null;
  }

  return (
    <p
      className={`m-0 text-xs leading-5 ${errorText ? "text-rose-600" : "text-slate-500"}`}
    >
      {errorText ?? helperText}
    </p>
  );
}

export function SettingsTextField({
  label,
  helperText,
  errorText,
  className,
  inputClassName,
  labelClassName,
  disabled,
  required,
  value,
  onChange,
  type = "text",
  ...props
}: SettingsTextFieldProps) {
  const hasError = Boolean(errorText);

  return (
    <div
      className={[fieldContainerClassName, className].filter(Boolean).join(" ")}
    >
      {label ? (
        <label
          className={[fieldLabelClassName, labelClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </label>
      ) : null}
      <input
        {...props}
        disabled={disabled}
        required={required}
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        className={[
          fieldBaseInputClassName,
          getFieldStateClassName(hasError),
          inputClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <FieldMessages helperText={helperText} errorText={errorText} />
    </div>
  );
}

export function SettingsTextAreaField({
  label,
  helperText,
  errorText,
  className,
  inputClassName,
  labelClassName,
  disabled,
  required,
  value,
  onChange,
  minRows = 3,
  textAreaProps,
  ...props
}: SettingsTextAreaFieldProps) {
  const hasError = Boolean(errorText);

  return (
    <div
      className={[fieldContainerClassName, className].filter(Boolean).join(" ")}
    >
      {label ? (
        <label
          className={[fieldLabelClassName, labelClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </label>
      ) : null}
      <textarea
        {...textAreaProps}
        {...props}
        rows={minRows}
        disabled={disabled}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={[
          fieldBaseInputClassName,
          "resize-y",
          getFieldStateClassName(hasError),
          inputClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <FieldMessages helperText={helperText} errorText={errorText} />
    </div>
  );
}

export function SettingsSelect({
  label,
  helperText,
  errorText,
  className,
  inputClassName,
  labelClassName,
  disabled,
  required,
  value,
  onChange,
  options,
  id,
  ...props
}: SettingsSelectProps) {
  const hasError = Boolean(errorText);
  const selectId =
    id ??
    (typeof label === "string"
      ? `settings-select-${label.replace(/\s+/g, "-")}`
      : undefined);

  return (
    <div
      className={[fieldContainerClassName, className].filter(Boolean).join(" ")}
    >
      {label ? (
        <label
          htmlFor={selectId}
          className={[fieldLabelClassName, labelClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {label}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </label>
      ) : null}
      <select
        {...props}
        id={selectId}
        disabled={disabled}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={[
          fieldBaseInputClassName,
          "appearance-none pr-9",
          getFieldStateClassName(hasError),
          inputClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {options.some((option) => option.content) ? (
        <div className="flex flex-wrap gap-2">
          {options
            .filter((option) => option.value === value && option.content)
            .map((option) => (
              <div key={option.value}>{option.content}</div>
            ))}
        </div>
      ) : null}
      <FieldMessages helperText={helperText} errorText={errorText} />
    </div>
  );
}

export function SettingsCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  ariaLabel,
}: SettingsCheckboxProps) {
  return (
    <label
      className={[
        "inline-flex cursor-pointer items-start gap-3 text-sm text-slate-700",
        disabled ? "cursor-not-allowed opacity-60" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <span className="flex flex-col gap-1">
        <span>{label}</span>
        {description ? (
          <span className="text-xs text-slate-500">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function SettingsSwitch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
  ariaLabel,
}: SettingsSwitchProps) {
  return (
    <SettingsCheckbox
      checked={checked}
      onChange={onChange}
      label={label}
      description={description}
      disabled={disabled}
      className={className}
      ariaLabel={ariaLabel}
    />
  );
}

export function SettingsTimeField({
  label,
  helperText,
  errorText,
  className,
  inputClassName,
  labelClassName,
  disabled,
  required,
  value,
  onChange,
  ...props
}: SettingsTimeFieldProps) {
  return (
    <SettingsTextField
      {...props}
      label={label}
      helperText={helperText}
      errorText={errorText}
      className={className}
      inputClassName={inputClassName}
      labelClassName={labelClassName}
      disabled={disabled}
      required={required}
      type="time"
      value={value ? value.format("HH:mm") : ""}
      onChange={(nextValue) => onChange(createTimeValue(nextValue))}
    />
  );
}

export function SettingsAlert({
  children,
  variant = "info",
  className,
}: SettingsAlertProps) {
  const toneClassName =
    variant === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : variant === "error"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : "border-sky-200 bg-sky-50 text-sky-900";

  return (
    <div
      className={[
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        toneClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
    >
      {children}
    </div>
  );
}

export function readChecked(
  event: ChangeEvent<HTMLInputElement>,
  checked?: boolean,
) {
  return checked ?? event.target.checked;
}

export function SettingsButton({
  variant = "primary",
  size = "md",
  disabled,
  type = "button",
  onClick,
  children,
  className,
  style,
}: SettingsButtonProps) {
  const toneByVariant: Record<
    SettingsButtonVariant,
    "primary" | "secondary" | "danger"
  > = {
    primary: "primary",
    secondary: "secondary",
    danger: "danger",
  };

  return (
    <AppButton
      type={type}
      disabled={disabled}
      onClick={onClick}
      tone={toneByVariant[variant]}
      variant={variant === "secondary" ? "outline" : "solid"}
      size={size}
      className={className}
      style={style}
    >
      {children}
    </AppButton>
  );
}

export function SettingsRow({
  label,
  description,
  children,
  className,
}: SettingsRowProps) {
  return (
    <div
      className={[
        "flex flex-row flex-wrap items-start justify-between gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-1 flex-1 min-w-[280px] max-w-[640px]">
        <span className="text-base font-semibold text-slate-800">{label}</span>
        {description ? (
          <p className="m-0 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="min-w-[140px]">{children}</div>
    </div>
  );
}
