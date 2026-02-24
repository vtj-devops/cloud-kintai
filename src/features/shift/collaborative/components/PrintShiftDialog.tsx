import PrintIcon from "@mui/icons-material/Print";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import PropTypes from "prop-types";
import { memo, useCallback, useMemo, useState } from "react";

import { ShiftState } from "../types/collaborative.types";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface PrintShiftDialogProps {
  open: boolean;
  onClose: () => void;
  days: Dayjs[];
  staffs: Array<{
    id: string;
    familyName?: string;
    givenName?: string;
  }>;
  shiftDataMap: Map<
    string,
    Map<
      string,
      {
        state: ShiftState;
        isLocked: boolean;
      }
    >
  >;
  targetMonth: string;
}

/**
 * 印刷設定ダイアログコンポーネント
 * @description
 * シフト調整テーブルの印刷オプションを設定し、
 * 印刷プレビューを表示するダイアログ
 */
const PrintShiftDialogComponent = ({
  open,
  onClose,
  days,
  staffs,
  shiftDataMap,
  targetMonth,
}: PrintShiftDialogProps) => {
  // 印刷設定状態
  const [startDate, setStartDate] = useState<string>(
    dayjs(targetMonth).format("YYYY-MM-DD"),
  );
  const [endDate, setEndDate] = useState<string>(
    dayjs(targetMonth).endOf("month").format("YYYY-MM-DD"),
  );
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(
    new Set(staffs.map((s) => s.id)),
  );
  const [includeLegend, setIncludeLegend] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [_orientation, _setOrientation] = useState<"portrait" | "landscape">(
    "landscape",
  );

  // フィルタリングされた日付の計算
  const filteredDays = useMemo(() => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    return days.filter(
      (day) => day.isSameOrAfter(start) && day.isSameOrBefore(end),
    );
  }, [days, startDate, endDate]);

  // フィルタリングされたスタッフの計算
  const filteredStaffs = useMemo(
    () => staffs.filter((staff) => selectedStaffIds.has(staff.id)),
    [staffs, selectedStaffIds],
  );

  // スタッフ選択の切り替え
  const handleStaffToggle = useCallback((staffId: string) => {
    setSelectedStaffIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  }, []);

  // 全スタッフ選択
  const handleSelectAllStaffs = useCallback(() => {
    if (selectedStaffIds.size === staffs.length) {
      setSelectedStaffIds(new Set());
    } else {
      setSelectedStaffIds(new Set(staffs.map((s) => s.id)));
    }
  }, [staffs, selectedStaffIds.size]);

  // 印刷実行
  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("ポップアップが許可されていません");
      return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>シフト調整表 - ${dayjs(targetMonth).format("YYYY年M月")}</title>
            <style>
              @page {
                size: landscape;
                margin: 0.5in;
              }
              
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                .print-container {
                  page-break-after: always;
                }
                .no-break {
                  page-break-inside: avoid;
                }
              }
              
              body {
                font-family: "Arial", sans-serif;
                color: #333;
                background-color: white;
              }
              
              .print-container {
                padding: 20px;
                page-break-after: auto;
              }
              
              .title {
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              
              .subtitle {
                text-align: center;
                font-size: 12px;
                color: #666;
                margin-bottom: 20px;
              }
              
              table {
                border-collapse: collapse;
                border: 1px solid #333;
                font-size: 12px;
                width: 100%;
              }
              
              th, td {
                border: 1px solid #ccc;
                padding: 4px 8px;
                text-align: center;
              }
              
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              
              thead tr {
                background-color: #f5f5f5;
              }
              
              tbody tr:nth-child(even) {
                background-color: #fafafa;
              }
              
              .staff-name {
                text-align: left;
                font-weight: 500;
                width: 120px;
                white-space: nowrap;
              }
              
              .shift-cell {
                width: 32px;
                font-weight: bold;
                font-size: 14px;
              }
              
              .weekend {
                background-color: #ffe0e0;
              }
              
              .legend {
                margin-top: 20px;
                border-top: 1px solid #ccc;
                padding-top: 15px;
              }
              
              .legend-title {
                font-weight: bold;
                margin-bottom: 10px;
                font-size: 12px;
              }
              
              .legend-items {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                font-size: 11px;
              }
              
              .legend-item {
                display: flex;
                align-items: center;
                gap: 5px;
              }
              
              .legend-badge {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                border: 1px solid #ccc;
                border-radius: 2px;
                font-size: 11px;
              }
              
              .footer {
                margin-top: 20px;
                border-top: 1px solid #ccc;
                padding-top: 10px;
                font-size: 10px;
                color: #999;
                text-align: right;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="title">シフト調整表</div>
              <div class="subtitle">${dayjs(targetMonth).format("YYYY年M月")}</div>
              
              <table>
                <thead>
                  <tr>
                    <th class="staff-name">スタッフ名</th>
                    ${filteredDays
                      .map((day) => {
                        const weekday = [
                          "日",
                          "月",
                          "火",
                          "水",
                          "木",
                          "金",
                          "土",
                        ][day.day()];
                        const isWeekend = day.day() === 0 || day.day() === 6;
                        return `
                          <th class="shift-cell ${isWeekend ? "weekend" : ""}">
                            <div>${day.format("D")}</div>
                            <div style="font-size: 9px; color: #666;">(${weekday})</div>
                          </th>
                        `;
                      })
                      .join("")}
                  </tr>
                </thead>
                <tbody>
                  ${filteredStaffs
                    .map((staff) => {
                      const staffName =
                        `${staff.familyName || ""}${staff.givenName || ""}`.trim() ||
                        staff.id;
                      return `
                        <tr>
                          <td class="staff-name">${staffName}</td>
                          ${filteredDays
                            .map((day) => {
                              const dayKey = day.format("DD");
                              const state =
                                shiftDataMap.get(staff.id)?.get(dayKey)
                                  ?.state || "empty";
                              const stateConfig = {
                                work: { label: "○", color: "#4caf50" },
                                fixedOff: { label: "固", color: "#f44336" },
                                requestedOff: { label: "希", color: "#ff9800" },
                                auto: { label: "△", color: "#2196f3" },
                                empty: { label: "-", color: "#9e9e9e" },
                              }[state as ShiftState];

                              return `
                                <td class="shift-cell" style="background-color: ${stateConfig.color}20; color: ${stateConfig.color};">
                                  ${stateConfig.label}
                                </td>
                              `;
                            })
                            .join("")}
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
              
              ${
                includeLegend
                  ? `
                <div class="legend">
                  <div class="legend-title">凡例</div>
                  <div class="legend-items">
                    <div class="legend-item">
                      <div class="legend-badge" style="background-color: #4caf5020; color: #4caf50; border-color: #4caf50;">○</div>
                      <span>出勤</span>
                    </div>
                    <div class="legend-item">
                      <div class="legend-badge" style="background-color: #f4433620; color: #f44336; border-color: #f44336;">固</div>
                      <span>固定休</span>
                    </div>
                    <div class="legend-item">
                      <div class="legend-badge" style="background-color: #ff980020; color: #ff9800; border-color: #ff9800;">希</div>
                      <span>希望休</span>
                    </div>
                    <div class="legend-item">
                      <div class="legend-badge" style="background-color: #2196f320; color: #2196f3; border-color: #2196f3;">△</div>
                      <span>自動調整枠</span>
                    </div>
                    <div class="legend-item">
                      <div class="legend-badge" style="background-color: #9e9e9e20; color: #9e9e9e; border-color: #9e9e9e;">-</div>
                      <span>未入力</span>
                    </div>
                  </div>
                </div>
              `
                  : ""
              }
              
              ${
                includeTimestamp
                  ? `<div class="footer">出力日時: ${dayjs().format("YYYY年M月D日 HH:mm")}</div>`
                  : ""
              }
            </div>
          </body>
        </html>
      `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }, [
    shiftDataMap,
    filteredDays,
    filteredStaffs,
    targetMonth,
    includeLegend,
    includeTimestamp,
  ]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>シフト調整表を印刷</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* 印刷設定セクション */}
        <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 2 }}>
            印刷設定
          </Typography>

          <Stack spacing={2}>
            {/* 日付範囲 */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
              <TextField
                label="開始日"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="終了日"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <Typography variant="caption" color="text.secondary">
                (選択: {filteredDays.length}日)
              </Typography>
            </Box>

            {/* スタッフ選択 */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedStaffIds.size === staffs.length}
                    indeterminate={
                      selectedStaffIds.size > 0 &&
                      selectedStaffIds.size < staffs.length
                    }
                    onChange={handleSelectAllStaffs}
                  />
                }
                label={`全スタッフを選択 (${selectedStaffIds.size}/${staffs.length})`}
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 1,
                  mt: 1,
                }}
              >
                {staffs.map((staff) => (
                  <FormControlLabel
                    key={staff.id}
                    control={
                      <Checkbox
                        checked={selectedStaffIds.has(staff.id)}
                        onChange={() => handleStaffToggle(staff.id)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="caption">
                        {`${staff.familyName || ""}${staff.givenName || ""}`.trim() ||
                          staff.id}
                      </Typography>
                    }
                  />
                ))}
              </Box>
            </Box>

            {/* その他のオプション */}
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeLegend}
                    onChange={(e) => setIncludeLegend(e.target.checked)}
                  />
                }
                label="凡例を含める"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeTimestamp}
                    onChange={(e) => setIncludeTimestamp(e.target.checked)}
                  />
                }
                label="出力日時を含める"
              />
            </FormGroup>

            {/* 用紙設定 */}
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                用紙向き: 横
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* プレビュー情報 */}
        <Typography variant="caption" color="text.secondary">
          プレビュー: {filteredDays.length}日間 × {filteredStaffs.length}名
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          キャンセル
        </Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
          disabled={filteredDays.length === 0 || filteredStaffs.length === 0}
        >
          印刷プレビューを表示
        </Button>
      </DialogActions>
    </Dialog>
  );
};

PrintShiftDialogComponent.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  days: PropTypes.arrayOf(PropTypes.any).isRequired,
  staffs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      familyName: PropTypes.string,
      givenName: PropTypes.string,
    }),
  ).isRequired,
  shiftDataMap: PropTypes.instanceOf(Map).isRequired,
  targetMonth: PropTypes.string.isRequired,
};

export const PrintShiftDialog = memo(PrintShiftDialogComponent);

PrintShiftDialog.displayName = "PrintShiftDialog";

(PrintShiftDialog as React.ComponentType<PrintShiftDialogProps>).propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  days: PropTypes.arrayOf(PropTypes.any).isRequired,
  staffs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      familyName: PropTypes.string,
      givenName: PropTypes.string,
    }),
  ).isRequired,
  shiftDataMap: PropTypes.instanceOf(Map).isRequired,
  targetMonth: PropTypes.string.isRequired,
};
