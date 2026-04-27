import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import React from "react";

interface PasswordFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  helperText?: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
}

export const PasswordField = React.memo(function PasswordField({
  label,
  type,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  showPassword,
  onToggleVisibility,
}: PasswordFieldProps) {
  const fieldClassName = [
    "flex items-center rounded-2xl border bg-white transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100",
    error
      ? "border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-100"
      : "border-slate-200",
  ].join(" ");

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className={fieldClassName}>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={[
            "min-w-0 flex-1 rounded-l-2xl border-0 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0",
            "min-h-[52px]",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label="パスワードの表示切り替え"
          className="inline-flex h-[52px] w-12 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-slate-400 transition hover:text-slate-700"
        >
          {showPassword ? (
            <VisibilityOffIcon fontSize="small" />
          ) : (
            <VisibilityIcon fontSize="small" />
          )}
        </button>
      </div>
      {error || helperText ? (
        <p
          className={["text-xs leading-5", error ? "text-rose-600" : "text-slate-500"].join(
            " ",
          )}
        >
          {error ?? helperText}
        </p>
      ) : null}
    </label>
  );
});
