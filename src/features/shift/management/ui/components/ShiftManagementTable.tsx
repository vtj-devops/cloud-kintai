import { Dayjs } from "dayjs";
import React from "react";

import { ShiftState } from "../../lib/generateMockShifts";
import {
  AGG_COL_WIDTH,
  COMPANY_HOLIDAY_BG,
  DAY_COL_WIDTH,
  HISTORY_COL_WIDTH,
  HOLIDAY_BG,
  SATURDAY_BG,
  STAFF_COL_WIDTH,
  SUMMARY_LEFTS,
} from "../ShiftManagementBoard.styles";
import ShiftManagementSummaryRow from "./ShiftManagementSummaryRow";
import { ShiftManagementTableRow } from "./ShiftManagementTableRow";

type Props = {
  days: Dayjs[];
  groupedShiftStaffs: {
    groupId?: string;
    groupName?: string;
    staffs: { id: string; name: string }[];
  }[];
  holidaySet: Set<string>;
  companyHolidaySet: Set<string>;
  holidayNameMap: Map<string, string>;
  companyHolidayNameMap: Map<string, string>;
  selectedStaffIds: Set<string>;
  selectedDayKeys: Set<string>;
  onStaffCheckboxChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    staffId: string,
  ) => void;
  onDayCheckboxChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    dayKey: string,
  ) => void;
  displayShifts: Map<string, Record<string, ShiftState>>;
  dailyCounts: Map<string, number>;
  plannedDailyCounts: Map<string, number | null>;
  onOpenShiftEditDialog: (
    target: { staffId: string; staffName: string; dateKey: string },
    currentState: ShiftState,
  ) => void;
};

export const ShiftManagementTable: React.FC<Props> = ({
  days,
  groupedShiftStaffs,
  holidaySet,
  companyHolidaySet,
  holidayNameMap,
  companyHolidayNameMap,
  selectedStaffIds,
  selectedDayKeys,
  onStaffCheckboxChange,
  onDayCheckboxChange,
  displayShifts,
  dailyCounts,
  plannedDailyCounts,
  onOpenShiftEditDialog,
}) => {
  const getHeaderCellBg = (d: Dayjs) => {
    const dateKey = d.format("YYYY-MM-DD");
    const day = d.day();
    if (holidaySet.has(dateKey) || day === 0) return HOLIDAY_BG;
    if (companyHolidaySet.has(dateKey)) return COMPANY_HOLIDAY_BG;
    if (day === 6) return SATURDAY_BG;
    return "transparent";
  };

  return (
    <div className="max-h-[calc(100vh-280px)] overflow-auto rounded-xl border border-gray-100 shadow-sm bg-white">
      <table className="w-full border-separate border-spacing-0 table-fixed">
        <thead className="sticky top-0 z-[10] bg-white">
          <tr>
            <th
              className="sticky left-0 z-[11] bg-white border-r-2 border-gray-100 text-sm font-bold text-gray-700 text-left px-3 py-2"
              style={{ width: `${STAFF_COL_WIDTH}px` }}
            >
              スタッフ名
            </th>
            <th
              className="sticky z-[11] bg-white border-r border-gray-100 text-sm font-bold text-gray-700 text-left px-3 py-2"
              style={{
                left: `${SUMMARY_LEFTS.aggregate}px`,
                width: `${AGG_COL_WIDTH}px`,
              }}
            >
              集計(出勤/休暇)
            </th>
            <th
              className="sticky z-[11] bg-white border-r-2 border-gray-100 text-sm font-bold text-gray-700 text-left px-3 py-2"
              style={{
                left: `${SUMMARY_LEFTS.changeHistory}px`,
                width: `${HISTORY_COL_WIDTH}px`,
              }}
            >
              変更履歴
            </th>
            {days.map((d) => {
              const dateKey = d.format("YYYY-MM-DD");
              const holidayName = holidayNameMap.get(dateKey);
              const companyHolidayName = companyHolidayNameMap.get(dateKey);
              const holidayText = holidayName || companyHolidayName || "";

              return (
                <th
                  key={dateKey}
                  className="p-1 border-r border-gray-50 align-top"
                  style={{
                    backgroundColor: getHeaderCellBg(d),
                    width: `${DAY_COL_WIDTH}px`,
                  }}
                  title={holidayText}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedDayKeys.has(dateKey)}
                      onChange={(e) => onDayCheckboxChange(e, dateKey)}
                    />
                    <span
                      className={`text-[10px] font-bold ${
                        holidayName ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      {d.format("D")}
                    </span>
                    <span
                      className={`text-[9px] font-medium ${
                        holidayName ? "text-red-500" : "text-gray-400"
                      }`}
                    >
                      {["日", "月", "火", "水", "木", "金", "土"][d.day()]}
                    </span>
                    {holidayText && (
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          holidayName ? "bg-red-500" : "bg-blue-400"
                        }`}
                      />
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <ShiftManagementSummaryRow
            label="合計出勤人数"
            days={days}
            selectedDayKeys={selectedDayKeys}
            dayColumnWidth={DAY_COL_WIDTH}
            renderValue={(dayKey) => (
              <div className="flex flex-row gap-1 justify-center items-center">
                <span className="text-sm font-bold text-gray-700">
                  {dailyCounts.get(dayKey) || 0}
                </span>
                {plannedDailyCounts.get(dayKey) !== null && (
                  <span className="text-[10px] text-gray-400">
                    / {plannedDailyCounts.get(dayKey)}
                  </span>
                )}
              </div>
            )}
            labelCellClassName="border-r-2 border-gray-100 font-bold"
          />
          {groupedShiftStaffs.map((group: any) => (
            <React.Fragment key={group.groupId || "no-group"}>
              {group.groupName && (
                <tr>
                  <td
                    colSpan={3 + days.length}
                    className="sticky left-0 z-[1] bg-gray-50 px-3 py-1 text-[11px] font-bold text-gray-500"
                  >
                    {group.groupName}
                  </td>
                </tr>
              )}
              {group.staffs.map((staff: any) => (
                <ShiftManagementTableRow
                  key={staff.id}
                  staff={staff}
                  days={days}
                  staffShifts={displayShifts.get(staff.id)}
                  isSelected={selectedStaffIds.has(staff.id)}
                  selectedDayKeys={selectedDayKeys}
                  onStaffCheckboxChange={onStaffCheckboxChange}
                  onOpenShiftEditDialog={onOpenShiftEditDialog}
                />
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
