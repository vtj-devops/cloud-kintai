import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import AttendanceOperationLogHistory from "@features/attendance/edit/ui/AttendanceOperationLogHistory";
import { SectionTitle } from "@shared/ui/typography";
import { type MouseEvent, useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
    >
      <path
        d="M3.333 10a6.667 6.667 0 1 0 2-4.714L3.333 7.143"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.333 3.81v3.333h3.334"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 6.667V10l2.5 1.667"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function EditAttendanceHistoryList() {
  const { getValues, attendance } = useContext(AttendanceEditContext);
  const [open, setOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const readOnly = searchParams.get("readOnly") === "true";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (readOnly) setOpen(true);
  }, [readOnly]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  if (!getValues) return null;

  return (
    <div>
      <button
        type="button"
        onClick={handleClickOpen}
        className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={!attendance}
      >
        <HistoryIcon />
        変更履歴
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendance-history-dialog-title"
          onClick={handleBackdropClick}
        >
          <div className="flex max-h-[min(90vh,960px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_80px_-48px_rgba(15,23,42,0.45)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <SectionTitle
                id="attendance-history-dialog-title"
                className="m-0 text-lg font-semibold text-slate-900"
              >
                変更履歴
              </SectionTitle>
            </div>
            <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-5">
              <AttendanceOperationLogHistory attendance={attendance} />
            </div>
            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                autoFocus
                className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
