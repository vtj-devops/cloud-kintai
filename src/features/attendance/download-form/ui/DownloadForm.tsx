import { AuthContext } from "@app/providers/auth/AuthContext";
import { AttendanceDate } from "@entities/attendance/lib/AttendanceDate";
import useCloseDates from "@entities/attendance/model/useCloseDates";
import {
  StaffType,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { STANDARD_PADDING } from "@shared/config/uiDimensions";
import { AppButton } from "@shared/ui/button";
import dayjs from "dayjs";
import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AggregateExportButton from "./AggregateExportButton";
import ExportButton from "./ExportButton";
import StaffSelector from "./StaffSelector";

export type Inputs = {
  startDate: dayjs.Dayjs | undefined;
  endDate: dayjs.Dayjs | undefined;
  staffs: StaffType[];
};

const formatInputDate = (value: dayjs.Dayjs) => value.format("YYYY-MM-DD");

export default function DownloadForm() {
  const navigate = useNavigate();
  const [selectedStaff, setSelectedStaff] = useState<StaffType[]>([]);
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    staffs,
    loading: staffLoading,
    error: staffError,
  } = useStaffs({
    isAuthenticated,
  });
  const {
    closeDates,
    loading: closeDateLoading,
    error: closeDateError,
  } = useCloseDates();
  const [startDate, setStartDate] = useState(formatInputDate(dayjs()));
  const [endDate, setEndDate] = useState(formatInputDate(dayjs()));

  const workDates = useMemo(() => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
      return [];
    }

    const dates: string[] = [];
    let date = start;
    while (date.isBefore(end) || date.isSame(end, "day")) {
      dates.push(date.format(AttendanceDate.DataFormat));
      date = date.add(1, "day");
    }
    return dates;
  }, [startDate, endDate]);

  const selectedCloseDate = useMemo(() => {
    const matched = closeDates.find(
      (closeDate) =>
        formatInputDate(dayjs(closeDate.startDate)) === startDate &&
        formatInputDate(dayjs(closeDate.endDate)) === endDate,
    );
    return matched?.closeDate ?? "";
  }, [closeDates, endDate, startDate]);

  if (staffLoading || closeDateLoading) {
    return (
      <div className="flex justify-center py-8 text-sm text-slate-500">
        読み込み中...
      </div>
    );
  }

  if (staffError || closeDateError) {
    return (
      <div className="rounded-[18px] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-900">
        エラーが発生しました
      </div>
    );
  }

  return (
    <div
      className="flex w-full min-w-0 flex-col gap-4 overflow-x-hidden"
      style={{ paddingBottom: STANDARD_PADDING.CARD }}
    >
      <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[1.05rem] font-bold text-slate-900">
            ダウンロード
          </div>
          <div className="mt-0.5 text-[0.92rem] leading-7 text-slate-500">
            期間と対象スタッフを選択して、勤怠データを出力できます。
          </div>
        </div>
        <div className="self-end sm:self-center">
          <AppButton
            variant="outline"
            tone="secondary"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="min-w-0 rounded-full"
            aria-label={
              isExpanded
                ? "ダウンロード要素を折りたたむ"
                : "ダウンロード要素を展開する"
            }
            aria-expanded={isExpanded}
            aria-controls="attendance-download-panel"
            endIcon={
              isExpanded ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )
            }
          >
            {isExpanded ? "折りたたむ" : "展開する"}
          </AppButton>
        </div>
      </div>

      {isExpanded && (
        <div id="attendance-download-panel" className="w-full">
          <div className="mx-auto flex w-full max-w-[880px] min-w-0 flex-col gap-6 px-1 sm:px-2 md:px-0">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    開始日
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full rounded-[18px] border border-slate-300/70 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                  />
                </div>
                <div className="hidden self-center pb-[11px] text-slate-400 sm:block">
                  〜
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    終了日
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="w-full rounded-[18px] border border-slate-300/70 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex max-w-[560px] flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    集計対象月から:
                  </span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={selectedCloseDate}
                      onChange={(event) => {
                        const closeDate = closeDates.find(
                          (item) => item.closeDate === event.target.value,
                        );
                        if (!closeDate) return;
                        setStartDate(
                          formatInputDate(dayjs(closeDate.startDate)),
                        );
                        setEndDate(formatInputDate(dayjs(closeDate.endDate)));
                      }}
                      className="min-w-0 flex-1 rounded-[18px] border border-slate-300/70 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    >
                      <option value="">対象月を選択</option>
                      {closeDates
                        .toSorted((a, b) =>
                          dayjs(b.closeDate).diff(dayjs(a.closeDate)),
                        )
                        .map((closeDate, index) => (
                          <option key={index} value={closeDate.closeDate}>
                            {dayjs(closeDate.closeDate).format("YYYY/MM")}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/master/job_term")}
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-slate-300/70 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.18)] transition hover:bg-slate-50"
                    >
                      <AddCircleOutlineOutlinedIcon fontSize="small" />
                      新規
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <StaffSelector
              staffs={staffs}
              selectedStaff={selectedStaff}
              setSelectedStaff={setSelectedStaff}
            />

            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <ExportButton
                workDates={workDates}
                selectedStaff={selectedStaff}
                fullWidth
              />
              <AggregateExportButton
                workDates={workDates}
                selectedStaff={selectedStaff}
                fullWidth
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
