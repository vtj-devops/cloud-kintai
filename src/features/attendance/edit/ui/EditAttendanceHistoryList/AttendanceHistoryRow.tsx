import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceDateTime } from "@entities/attendance/lib/AttendanceDateTime";
import { AttendanceHistory } from "@shared/api/graphql/types";
import { SubsectionTitle } from "@shared/ui/typography";
import { useContext, useState } from "react";

const cellClassName =
  "whitespace-nowrap border-b border-slate-200 px-4 py-3 text-sm text-slate-700 align-top";

const expandedTableCellClassName =
  "border-b border-slate-200 px-4 py-3 text-sm text-slate-700";

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
    >
      <path
        d="M15 12.5L10 7.5L5 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AttendanceHistoryRow({
  history,
}: {
  history: AttendanceHistory;
}) {
  const [open, setOpen] = useState(false);
  const { getHourlyPaidHolidayEnabled } = useContext(AppConfigContext);
  const hourlyPaidHolidayEnabled = getHourlyPaidHolidayEnabled();
  const rests = history.rests
    ? history.rests.filter(
        (item): item is NonNullable<typeof item> => item !== null
      )
    : [];

  const hourlyPaidHolidayTimes = history.hourlyPaidHolidayTimes
    ? history.hourlyPaidHolidayTimes.filter(
        (item): item is NonNullable<typeof item> => item !== null
      )
    : [];

  return (
    <>
      <tr data-testid="attendance-history-row" className="bg-white transition hover:bg-slate-50/70">
        <td className={`${cellClassName} w-14`}>
          <button
            data-testid="attendance-history-toggle"
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label={open ? "詳細を閉じる" : "詳細を開く"}
            aria-expanded={open}
          >
            {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        </td>
        <Cell>{formatDisplayDate(history.workDate)}</Cell>
        <Cell>{formatWorkTime(history)}</Cell>
        <Cell>{history.goDirectlyFlag ? "◯" : "-"}</Cell>
        <Cell>{history.returnDirectlyFlag ? "◯" : "-"}</Cell>
        <Cell>{history.paidHolidayFlag ? "◯" : "-"}</Cell>
        <Cell>{history.specialHolidayFlag ? "◯" : "-"}</Cell>
        <Cell>
          {history.substituteHolidayDate
            ? formatDisplayDate(history.substituteHolidayDate)
            : "-"}
        </Cell>
        <td className={`${cellClassName} min-w-[220px] whitespace-normal break-words`}>
          {history.remarks || "-"}
        </td>
        <Cell>{formatDisplayDateTime(history.createdAt)}</Cell>
        <td className={`${cellClassName} min-w-[160px] break-all`}>
          {history.staffId}
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50/70">
          <td colSpan={11} className={expandedTableCellClassName}>
            <div className="space-y-5 py-2">
              <DetailSection
                title="休憩"
                rows={rests.map((rest) => ({
                  startTime: rest.startTime,
                  endTime: rest.endTime,
                }))}
              />
              {hourlyPaidHolidayEnabled && (
                <DetailSection
                  title="時間単位休暇"
                  rows={hourlyPaidHolidayTimes.map((holiday) => ({
                    startTime: holiday.startTime,
                    endTime: holiday.endTime,
                  }))}
                />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className={cellClassName}>{children}</td>;
}

function DetailSection({
  title,
  rows,
}: {
  title: string;
  rows: { startTime: string | null | undefined; endTime: string | null | undefined }[];
}) {
  return (
    <section className="space-y-2">
      <SubsectionTitle className="m-0 text-sm font-semibold text-slate-900">{title}</SubsectionTitle>
      {rows.length === 0 ? (
        <p className="m-0 text-sm text-slate-500">登録はありません</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-[280px] w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-500">
                  開始
                </th>
                <th className="border-b border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-500">
                  終了
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="border-b border-slate-200 px-4 py-2 text-sm text-slate-700 last:border-b-0">
                    {formatTime(row.startTime)}
                  </td>
                  <td className="border-b border-slate-200 px-4 py-2 text-sm text-slate-700 last:border-b-0">
                    {formatTime(row.endTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatTime(value: string | null | undefined) {
  return value
    ? new AttendanceDateTime().setDateString(value).toTimeFormat()
    : "(なし)";
}

function formatDisplayDate(value: string) {
  return new AttendanceDateTime().setDateString(value).toDisplayDateFormat();
}

function formatDisplayDateTime(value: string) {
  return new AttendanceDateTime()
    .setDateString(value)
    .toDisplayDateTimeFormat();
}

function formatWorkTime(history: AttendanceHistory) {
  if (!history.startTime && !history.endTime) {
    return "-";
  }

  const startTime = history.startTime ? formatTime(history.startTime) : "";
  const endTime = history.endTime ? formatTime(history.endTime) : "";

  return `${startTime} 〜 ${endTime}`;
}
