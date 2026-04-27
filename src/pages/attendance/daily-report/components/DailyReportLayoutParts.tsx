import { SectionTitle } from "@shared/ui/typography";
import type { Dayjs } from "dayjs";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type AlertTone = "error" | "warning";
type ButtonTone = "primary" | "secondary" | "ghost";

export function VStack({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`dr-vstack ${className}`.trim()}>{children}</div>;
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`dr-panel ${className}`.trim()}>{children}</div>;
}

export function AlertBox({
  children,
  tone,
  onClose,
  className = "",
}: {
  children: ReactNode;
  tone: AlertTone;
  onClose?: () => void;
  className?: string;
}) {
  const toneClassName =
    tone === "error" ? "dr-alert--error" : "dr-alert--warning";

  return (
    <div
      role="alert"
      className={`dr-alert ${toneClassName} ${className}`.trim()}
    >
      <div>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="dr-alert-close"
        >
          閉じる
        </button>
      )}
    </div>
  );
}

export function DividerLine() {
  return <div className="dr-divider" />;
}

export function ActionButton({
  children,
  tone,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone: ButtonTone;
}) {
  const toneClassName = `dr-action-button--${tone.toLowerCase()}`;

  return (
    <button
      type="button"
      className={`dr-action-button ${toneClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`dr-skeleton ${className}`.trim()} />;
}

export function LoadingSection() {
  return (
    <VStack className="dr-gap-4">
      <SkeletonBlock className="dr-skeleton-title" />
      <SkeletonBlock className="dr-skeleton-subtitle" />
      <SkeletonBlock className="dr-skeleton-body" />
      <div className="dr-loading-button-row">
        <SkeletonBlock className="dr-skeleton-btn-sm" />
        <SkeletonBlock className="dr-skeleton-btn-md" />
        <SkeletonBlock className="dr-skeleton-btn-md" />
      </div>
    </VStack>
  );
}

export function NoReportSection({ onCreate }: { onCreate: () => void }) {
  return (
    <ActionButton tone="primary" onClick={onCreate} data-testid="daily-report-create-button">
      日報を作成する
    </ActionButton>
  );
}

export function ReportSummaryHeader({
  calendarDate,
}: {
  calendarDate: Dayjs;
}) {
  return (
    <div className="dr-summary-header">
      <div>
        <SectionTitle className="dr-summary-date">
          {calendarDate.format("YYYY年MM月DD日")}
        </SectionTitle>
      </div>
    </div>
  );
}
