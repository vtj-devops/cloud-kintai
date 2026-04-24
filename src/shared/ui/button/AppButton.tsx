import "./buttonStyles.scss";

import type {
  ButtonHTMLAttributes,
  CSSProperties,
  LabelHTMLAttributes,
  ReactNode,
} from "react";

import type { ButtonSize, ButtonTone, ButtonVariant } from "./types";

type CommonProps = {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonElementProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps | "color"> & {
    as?: "button";
  };

type LabelElementProps = CommonProps &
  Omit<LabelHTMLAttributes<HTMLLabelElement>, keyof CommonProps | "color"> & {
    as: "label";
  };

export type AppButtonProps = ButtonElementProps | LabelElementProps;

const joinClassNames = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(" ");

const contentClassName = "app-button__content";

const sharedStyle: CSSProperties = {
  fontFamily: "var(--ds-typography-font-family)",
};

function ButtonInner({
  loading,
  startIcon,
  endIcon,
  children,
}: Pick<
  CommonProps,
  "loading" | "startIcon" | "endIcon" | "children"
>) {
  return (
    <>
      {loading ? (
        <span className="app-button__spinner" aria-hidden="true" />
      ) : startIcon ? (
        <span className="app-button__icon" aria-hidden="true">
          {startIcon}
        </span>
      ) : null}
      <span className={contentClassName}>{children}</span>
      {endIcon ? (
        <span className="app-button__icon" aria-hidden="true">
          {endIcon}
        </span>
      ) : null}
    </>
  );
}

export default function AppButton(props: AppButtonProps) {
  const {
    as = "button",
    variant = "solid",
    tone = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    startIcon,
    endIcon,
    disabled = false,
    className,
    children,
    ...rest
  } = props;

  const resolvedDisabled = disabled || loading;

  if (as === "label") {
    const labelProps = rest as Omit<
      LabelElementProps,
      keyof CommonProps | "as"
    >;

    return (
      <label
        {...labelProps}
        role="button"
        tabIndex={resolvedDisabled ? -1 : 0}
        aria-disabled={resolvedDisabled}
        className={joinClassNames("app-button", className)}
        data-app-button-variant={variant}
        data-app-button-tone={tone}
        data-app-button-size={size}
        data-app-button-full-width={String(fullWidth)}
        onClick={(event) => {
          if (resolvedDisabled) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          labelProps.onClick?.(event);
        }}
        style={sharedStyle}
      >
        <ButtonInner loading={loading} startIcon={startIcon} endIcon={endIcon}>
          {children}
        </ButtonInner>
      </label>
    );
  }

  const buttonProps = rest as Omit<
    ButtonElementProps,
    keyof CommonProps | "as"
  >;

  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? "button"}
      disabled={resolvedDisabled}
      className={joinClassNames("app-button", className)}
      data-app-button-variant={variant}
      data-app-button-tone={tone}
      data-app-button-size={size}
      data-app-button-full-width={String(fullWidth)}
      style={sharedStyle}
    >
      <ButtonInner loading={loading} startIcon={startIcon} endIcon={endIcon}>
        {children}
      </ButtonInner>
    </button>
  );
}
