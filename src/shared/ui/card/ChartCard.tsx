import { Box, Typography } from "@mui/material";
import InfoIconTooltip from "@shared/ui/tooltip/InfoIconTooltip";
import { FC } from "react";

/**
 * Generic chart card used for displaying a chart with a title, optional count and
 * an empty state message.
 *
 * @param title The title of the chart.
 * @param count Optional count to display next to the title.
 * @param chart The chart component (e.g., <Bar />, <Line />, etc.).
 * @param hasData Flag indicating whether chart data is available.
 * @param emptyMessage Message to show when there is no data.
 * @param tooltipContent Optional tooltip content for the title.
 */
export const ChartCard: FC<{
  title: string;
  count?: number;
  chart: JSX.Element;
  hasData: boolean;
  emptyMessage?: string;
  tooltipContent?: JSX.Element;
}> = ({
  title,
  count,
  chart,
  hasData,
  emptyMessage = "表示可能な勤務データがありません",
  tooltipContent,
}) => (
  <Box sx={{ mt: 3, borderRadius: 1, border: "1px solid", borderColor: "grey.200", backgroundColor: "grey.50", p: 1.75 }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {tooltipContent && (
          <InfoIconTooltip
            testId={`chart-card-${title.toLowerCase().replace(/\s+/g, "-")}-info`}
            ariaLabel={title}
            tooltipContent={tooltipContent}
            tooltipClassName="max-w-[260px]"
          />
        )}
      </Box>
      {count !== undefined && (
        <Typography variant="body2" fontWeight="bold" color="text.primary">
          {`対象データ ${count}件`}
        </Typography>
      )}
    </Box>
    <Box sx={{ mt: 2, height: 208 }}>
      {hasData ? chart : (
        <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary", fontSize: "0.875rem" }}>
          {emptyMessage}
        </Box>
      )}
    </Box>
  </Box>
);

export default ChartCard;
