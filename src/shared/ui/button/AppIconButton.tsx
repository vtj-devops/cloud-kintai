import "./buttonStyles.scss";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

import type { IconButtonSize, IconButtonTone } from "./types";

export type AppIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "color"
> & {
  tone?: IconButtonTone;
  size?: IconButtonSize;
  active?: boolean;
  loading?: boolean;
  tooltip?: string;
  className?: string;
  children: ReactNode;
  "aria-label": string;
};

const joinClassNames = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(" ");

const sharedStyle: CSSProperties = {
  fontFamily: "var(--ds-typography-font-family)",
};

export default function AppIconButton({
  tone = "neutral",
  size = "md",
  active = false,
  loading = false,
  disabled = false,
  tooltip,
  className,
  children,
  ...rest
}: AppIconButtonProps) {
  const resolvedDisabled = disabled || loading;

  const button = (
    <button
      {...rest}
      type={rest.type ?? "button"}
      disabled={resolvedDisabled}
      className={joinClassNames("app-icon-button", className)}
      data-app-icon-button-tone={tone}
      data-app-icon-button-size={size}
      data-app-icon-button-active={String(active)}
      style={sharedStyle}
    >
      {loading ? (
        <span className="app-icon-button__spinner" aria-hidden="true" />
      ) : (
        <span className="app-icon-button__icon" aria-hidden="true">
          {children}
        </span>
      )}
    </button>
  );

  if (!tooltip) return button;

  return (
    <span className="relative inline-flex group/app-icon-tooltip">
      {button}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/app-icon-tooltip:opacity-100 group-focus-within/app-icon-tooltip:opacity-100"
      >
        {tooltip}
      </span>
    </span>
  );
}
