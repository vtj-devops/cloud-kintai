import { AppIconButton } from "@shared/ui/button";
import { PageTitle } from "@shared/ui/typography";

type ShiftPlanHeaderProps = {
  selectedYear: number;
  isBusy: boolean;
  onYearChange: (delta: number) => void;
};

const ShiftPlanHeader: React.FC<ShiftPlanHeaderProps> = ({
  selectedYear,
  isBusy,
  onYearChange,
}: ShiftPlanHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <PageTitle className="text-2xl font-bold" style={{ color: "#1E2A25" }}>
          シフト計画管理
        </PageTitle>
        <p className="mt-1 text-sm" style={{ color: "#7D9288" }}>
          年ごとのシフト申請期間を管理し、各月の受付開始・締切日を調整できます。
        </p>
      </div>
      <div className="flex items-center gap-1">
        <AppIconButton
          aria-label="前の年"
          disabled={isBusy}
          onClick={() => onYearChange(-1)}
          tone="neutral"
          size="sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </AppIconButton>
        <span
          className="text-xl font-bold min-w-[5rem] text-center"
          style={{ color: "#1E2A25" }}
        >
          {selectedYear}年
        </span>
        <AppIconButton
          aria-label="次の年"
          disabled={isBusy}
          onClick={() => onYearChange(1)}
          tone="neutral"
          size="sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </AppIconButton>
      </div>
    </div>
  );
};

export default ShiftPlanHeader;
