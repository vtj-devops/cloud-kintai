import { AttendanceHistory } from "@shared/api/graphql/types";
import { AppButton } from "@shared/ui/button";
import { ProgressBar } from "@shared/ui/feedback";
import { InlineAlert } from "@shared/ui/feedback/InlineAlert";
import dayjs from "dayjs";

type AttendanceEditorHistorySidebarProps = {
  historiesLoading: boolean;
  sortedHistories: AttendanceHistory[];
  historyIndex: number;
  onSelectHistory: (index: number) => void;
};

export function AttendanceEditorHistorySidebar({
  historiesLoading,
  sortedHistories,
  historyIndex,
  onSelectHistory,
}: AttendanceEditorHistorySidebarProps) {
  return (
    <div className="pointer-events-auto z-[1500] max-h-[60vh] w-[260px] overflow-y-auto">
      {historiesLoading ? (
        <div className="p-2">
          <ProgressBar />
        </div>
      ) : sortedHistories.length > 0 ? (
        <div className="flex flex-col gap-1">
          {sortedHistories.map((history, idx) => (
            <AppButton
              key={idx}
              onClick={() => onSelectHistory(idx)}
              variant={idx === historyIndex ? "solid" : "outline"}
              tone={idx === historyIndex ? "primary" : "neutral"}
              size="sm"
              fullWidth
              className="flex-col items-start"
            >
              <span className="text-sm font-semibold text-slate-900">
                {`履歴 #${sortedHistories.length - idx}`}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                {dayjs(history.createdAt).format("YYYY/MM/DD HH:mm:ss")}
              </span>
            </AppButton>
          ))}
        </div>
      ) : (
        <div className="p-2">
          <InlineAlert tone="info">履歴がありません。</InlineAlert>
        </div>
      )}
    </div>
  );
}