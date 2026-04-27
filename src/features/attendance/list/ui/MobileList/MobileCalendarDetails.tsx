import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceStatus } from "@entities/attendance/lib/AttendanceState";
import { SubsectionTitle } from "@shared/ui/typography";
import dayjs from "dayjs";
import { CSSProperties, useContext } from "react";

import { useMobileCalendarUI } from "./mobileCalendarContext";
import {
  getAssumedLunchRestRange,
  getRestTimes,
  getSelectedDateLabel,
  getSummaryText,
  getSystemCommentTexts,
} from "./mobileCalendarDetailsUtils";
import { formatTimeRange, getStatusBadgeMeta, HolidayInfo } from "./mobileCalendarUtils";

const SelectedDateStatusBadge = ({
  selectedDateStatus,
}: {
  selectedDateStatus: AttendanceStatus;
}) => {
  const statusBadgeMeta = getStatusBadgeMeta(selectedDateStatus);

  return (
    <span
      className="mobile-calendar__detail-status"
      style={
        {
          "--detail-status-bg": statusBadgeMeta.backgroundColor,
          "--detail-status-color": statusBadgeMeta.color,
        } as CSSProperties
      }
    >
      {statusBadgeMeta.label}
    </span>
  );
};

const HolidayInfoCard = ({ holidayInfo }: { holidayInfo: HolidayInfo }) => {
  return (
    <div className="mobile-calendar__info-card">
      <p className="mobile-calendar__info-card-label">
        {holidayInfo.type === "holiday" ? "国民の祝日" : "会社休日"}
      </p>
      <p className="mobile-calendar__info-card-text">{holidayInfo.name}</p>
    </div>
  );
};

export const SelectedDateDetails = () => {
  const { getLunchRestStartTime, getLunchRestEndTime } = useContext(AppConfigContext);
  const {
    selectedDate,
    selectedAttendance,
    selectedDateStatus,
    getHolidayInfo,
    onEditSelectedDate,
    onCloseSelectedDate,
  } = useMobileCalendarUI();
  if (!selectedDate) return null;

  const holidayInfo = getHolidayInfo(dayjs(selectedDate));
  const isSelectedDateToday = dayjs(selectedDate).isSame(dayjs(), "day");
  const isPastSelectedDate = dayjs(selectedDate).isBefore(dayjs(), "day");
  const isTodayNoAttendance =
    !selectedAttendance && isSelectedDateToday;
  const restTimes = getRestTimes(selectedAttendance);
  const assumedLunchRest = getAssumedLunchRestRange({
    selectedDate,
    selectedAttendance,
    restCount: restTimes.length,
    lunchRestStartTime: getLunchRestStartTime(),
    lunchRestEndTime: getLunchRestEndTime(),
  });
  const workTimeText = selectedAttendance?.startTime
    ? formatTimeRange(selectedAttendance.startTime, selectedAttendance?.endTime)
    : selectedAttendance?.endTime
      ? dayjs(selectedAttendance.endTime).format("HH:mm")
      : "";
  const summaryText = getSummaryText(selectedAttendance);
  const systemCommentTexts = getSystemCommentTexts(selectedAttendance);

  return (
    <div className="mobile-calendar__details">
      <div className="mobile-calendar__details-root">
        <div className="mobile-calendar__details-header">
          <SubsectionTitle className="mobile-calendar__details-title">{getSelectedDateLabel(selectedDate)}</SubsectionTitle>
          {isPastSelectedDate && (
            <SelectedDateStatusBadge selectedDateStatus={selectedDateStatus} />
          )}
        </div>

        <div className="mobile-calendar__details-body">
          {holidayInfo && <HolidayInfoCard holidayInfo={holidayInfo} />}

          {isTodayNoAttendance && (
            <div className="mobile-calendar__info-card">
              <p className="mobile-calendar__empty-message">
                本日の勤務データはまだ記録されていません
              </p>
            </div>
          )}

          {workTimeText && (
            <div>
              <p className="mobile-calendar__section-label">勤務時間</p>
              <p>{workTimeText}</p>
            </div>
          )}

          {(restTimes.length > 0 || assumedLunchRest) && (
            <div>
              <p className="mobile-calendar__section-label">休憩時間</p>
              {restTimes.map((rest, idx) => (
                <p key={idx}>{formatTimeRange(rest.startTime, rest.endTime)}</p>
              ))}
              {assumedLunchRest && (
                <p>
                  ({formatTimeRange(assumedLunchRest.startTime, assumedLunchRest.endTime)})
                </p>
              )}
            </div>
          )}

          {summaryText && (
            <div>
              <p className="mobile-calendar__section-label">摘要</p>
              <p>{summaryText}</p>
            </div>
          )}

          {systemCommentTexts.length > 0 && (
            <div>
              <p className="mobile-calendar__error-label">システムコメント</p>
              {systemCommentTexts.map((comment, idx) => (
                <p key={idx} className="mobile-calendar__error-text">
                  {comment}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="mobile-calendar__details-actions">
          <button
            type="button"
            onClick={onEditSelectedDate}
            className="mobile-calendar__action-btn mobile-calendar__action-btn--primary"
          >
            編集
          </button>
          <button
            type="button"
            onClick={onCloseSelectedDate}
            className="mobile-calendar__action-btn mobile-calendar__action-btn--secondary"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
