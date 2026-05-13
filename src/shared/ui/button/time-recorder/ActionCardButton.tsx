import "./ActionCardButton.scss";

import type { CSSProperties, ReactNode } from "react";

export interface ActionCardButtonProps {
  className?: string;
  style: CSSProperties & Record<`--${string}`, string>;
  type?: "button" | "submit" | "reset";
  size?: "default" | "compact" | "slim";
  shape?: "card" | "circle";
  layout?: "split" | "center";
  disabled?: boolean;
  onClick?: () => void;
  testId?: string;
  label: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
}

type ActionCardContentProps = Pick<
  ActionCardButtonProps,
  "label" | "helper" | "icon"
>;

const getLayout = ({
  layout,
  icon,
}: Pick<ActionCardButtonProps, "layout" | "icon">) =>
  layout ?? (icon ? "split" : "center");

const buildActionCardClassName = (className?: string) =>
  ["action-card-button", className].filter(Boolean).join(" ");

const ActionCardContent = ({
  label,
  helper,
  icon,
}: ActionCardContentProps) => {
  return (
    <span className="action-card-button__content">
      <span className="action-card-button__label-wrap">
        <span className="action-card-button__label">{label}</span>
        {helper ? (
          <span
            className={[
              "action-card-helper",
              "action-card-button__helper",
            ].join(" ")}
          >
            {helper}
          </span>
        ) : null}
      </span>
      {icon ? (
        <span
          className={["action-card-icon", "action-card-button__icon"].join(" ")}
        >
          {icon}
        </span>
      ) : null}
    </span>
  );
};

export default function ActionCardButton({
  className,
  style,
  type = "button",
  size = "default",
  shape = "card",
  layout,
  disabled = false,
  onClick,
  testId,
  label,
  helper,
  icon,
}: ActionCardButtonProps) {
  const resolvedLayout = getLayout({ layout, icon });

  return (
    <button
      type={type}
      data-testid={testId}
      data-action-card-size={size}
      data-action-card-shape={shape}
      data-action-card-layout={resolvedLayout}
      disabled={disabled}
      onClick={onClick}
      className={buildActionCardClassName(className)}
      style={style}
    >
      <span className="action-card-button__top-line" />
      <ActionCardContent
        label={label}
        helper={helper}
        icon={icon}
      />
    </button>
  );
}
