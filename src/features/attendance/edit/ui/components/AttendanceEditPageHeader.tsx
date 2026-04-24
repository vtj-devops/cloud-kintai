import { PageTitle } from "@shared/ui/typography";

import AttendanceEditBackNavigation from "../AttendanceEditBackNavigation";

type AttendanceEditPageHeaderProps = {
  title?: string;
  description?: string;
  showBackNavigation?: boolean;
  variant?: "desktop" | "mobile";
};

const HEADER_GRADIENT =
  "linear-gradient(135deg, rgba(247, 252, 248, 0.98) 0%, rgba(236, 253, 245, 0.92) 58%, rgba(255, 255, 255, 0.98) 100%)";

export function AttendanceEditPageHeader({
  title = "勤怠編集",
  description,
  showBackNavigation = true,
  variant = "desktop",
}: AttendanceEditPageHeaderProps) {
  const isDesktop = variant === "desktop";

  return (
    <div
      data-testid="attendance-header"
      className={[
        "border border-emerald-500/15 text-slate-900",
        isDesktop
          ? "rounded-2xl p-4 shadow-[0_28px_60px_-42px_rgba(15,23,42,0.35)] md:p-5"
          : "rounded-[14px] p-[10px] shadow-[0_24px_54px_-40px_rgba(15,23,42,0.35)]",
      ].join(" ")}
      style={{ background: HEADER_GRADIENT }}
    >
      <div className="flex flex-col gap-1.5">
        {showBackNavigation ? <AttendanceEditBackNavigation /> : null}
        <PageTitle
          className={[
            "m-0 font-bold leading-[1.15] tracking-[-0.02em] text-slate-950",
            isDesktop
              ? "text-[1.85rem] md:text-[2.2rem]"
              : "text-[1.9rem]",
          ].join(" ")}
        >
          {title}
        </PageTitle>
        {description ? (
          <p
            className={[
              "m-0 leading-loose text-slate-500",
              isDesktop
                ? "max-w-[760px] text-[0.93rem]"
                : "text-[0.88rem]",
            ].join(" ")}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
