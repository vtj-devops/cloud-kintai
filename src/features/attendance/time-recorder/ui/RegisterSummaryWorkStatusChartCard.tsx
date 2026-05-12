import InfoIconTooltip from "@shared/ui/tooltip/InfoIconTooltip";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartData,
  type ChartOptions,
  Legend,
  LinearScale,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

type RegisterSummaryWorkStatusChartCardProps = {
  chartData: ChartData<"bar">;
  chartOptions: ChartOptions<"bar">;
  hasChartData: boolean;
  workStatusDataCount: number;
};

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

export default function RegisterSummaryWorkStatusChartCard({
  chartData,
  chartOptions,
  hasChartData,
  workStatusDataCount,
}: RegisterSummaryWorkStatusChartCardProps) {
  const chartInfoAriaLabel =
    "勤務状況チャートの算出根拠: 勤務時間=退勤時刻-出勤時刻-休憩時間（通常勤務）、有給休暇=有給フラグ付きの勤務時間（休憩時間は表示しない）、残業時間=max(勤務時間-所定労働時間,0)、休憩時間=休憩終了時刻-休憩開始時刻の合計（通常勤務のみ）";
  const chartInfoTooltip = (
    <div className="text-xs leading-relaxed">
      <div>勤務時間: 退勤時刻 - 出勤時刻 - 休憩時間（通常勤務）</div>
      <div>有給休暇: 有給フラグ付きの勤務時間（休憩時間は表示しない）</div>
      <div>残業時間: max(勤務時間 - 所定労働時間, 0)</div>
      <div>休憩時間: 休憩終了時刻 - 休憩開始時刻 の合計（通常勤務のみ）</div>
    </div>
  );

  return (
    <div className="mt-3 rounded-[4px] border border-slate-200/90 bg-slate-50/70 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <p className="m-0 text-xs font-medium tracking-[0.03em] text-slate-500">
            勤務状況チャート
          </p>
          <InfoIconTooltip
            testId="register-dashboard-work-status-chart-info"
            ariaLabel={chartInfoAriaLabel}
            tooltipContent={chartInfoTooltip}
            tooltipClassName="max-w-[260px]"
          />
        </div>
        <p
          data-testid="register-dashboard-work-status-chart-count"
          className="m-0 text-xs font-semibold text-slate-600"
        >
          対象データ {workStatusDataCount}件
        </p>
      </div>
      <div className="mt-2 h-52">
        {hasChartData ? (
          <Bar
            data={chartData}
            options={chartOptions}
            data-testid="register-dashboard-work-status-chart"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
            表示可能な勤務データがありません
          </div>
        )}
      </div>
    </div>
  );
}
