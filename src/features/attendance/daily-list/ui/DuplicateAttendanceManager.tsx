import {
  useDeleteAttendanceMutation,
  useLazyGetAttendanceByIdQuery,
} from "@entities/attendance/api/attendanceApi";
import {
  AttendanceDaily,
  DuplicateAttendanceDaily,
} from "@entities/attendance/model/useAttendanceDaily";
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { Attendance } from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { AppButton } from "@shared/ui/button";
import dayjs from "dayjs";
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import * as MESSAGE_CODE from "@/errors";

const diffWrapperSx = { whiteSpace: "pre-wrap" } as const;
const diffHighlightSx = {
  backgroundColor: "rgba(255, 87, 34, 0.22)",
  borderRadius: 0.5,
  px: 0.5,
} as const;
const duplicateBadgeChipSx = { fontWeight: 600 } as const;
const tableContainerSx = { width: "100%", overflowX: "auto" } as const;
const recordIdsCellSx = {
  display: { xs: "none", md: "table-cell" },
  whiteSpace: "nowrap",
} as const;
const duplicateErrorBoxSx = {
  pb: 2,
  border: "1px solid",
  borderColor: "error.main",
  borderRadius: 2,
  p: 2,
  backgroundColor: "rgba(255, 205, 210, 0.16)",
} as const;
const sectionTitleSx = { mb: 1 } as const;
const alertMb2Sx = { mb: 2 } as const;
const colStaffSx = { width: "30%" } as const;
const colDateSx = { width: "25%" } as const;
const colCountSx = { width: "15%" } as const;
const colActionSx = { width: "12%" } as const;
const dialogHeaderSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: 1.5,
  gap: 1,
} as const;
const colItemLabelSx = { width: "16%" } as const;

type ConfirmFieldRow = {
  label: string;
  value: (record: Attendance) => string;
  render: (record: Attendance) => string;
};

type DuplicateAttendanceManagerProps = {
  duplicates: DuplicateAttendanceDaily[];
  staffNameMap: Record<string, string>;
};

type DuplicateAttendanceBadgeProps = {
  row: AttendanceDaily;
  duplicateInfoByStaff: Record<string, DuplicateAttendanceDaily[]>;
};

export function DuplicateAttendanceBadge({
  row,
  duplicateInfoByStaff,
}: DuplicateAttendanceBadgeProps) {
  const duplicates = duplicateInfoByStaff[row.sub];
  if (!duplicates || duplicates.length === 0) {
    return null;
  }

  const detail = duplicates
    .map((duplicate) => {
      return `${dayjs(duplicate.workDate).format("YYYY/MM/DD")}: ${duplicate.ids.join(", ")}`;
    })
    .join("\n");

  return (
    <Tooltip title={detail || "重複データがあります"} arrow placement="top">
      <Chip size="small" color="warning" label="重複" sx={duplicateBadgeChipSx} />
    </Tooltip>
  );
}

export function DuplicateAttendanceManager({
  duplicates,
  staffNameMap,
}: DuplicateAttendanceManagerProps) {
  const dispatch = useDispatch();
  const [triggerGetAttendanceById] = useLazyGetAttendanceByIdQuery();
  const [deleteAttendance] = useDeleteAttendanceMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTargetStaffId, setConfirmTargetStaffId] = useState<string | null>(
    null,
  );
  const [confirmTargetName, setConfirmTargetName] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmRecords, setConfirmRecords] = useState<Attendance[]>([]);
  const [selectionMode, setSelectionMode] = useState<"record" | "field">(
    "record",
  );
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(
    null,
  );
  const [fieldSelections, setFieldSelections] = useState<Record<string, number>>(
    {},
  );
  const [lastFieldRowIndex, setLastFieldRowIndex] = useState<number | null>(null);
  const [lastFieldRecordIndex, setLastFieldRecordIndex] = useState<number | null>(
    null,
  );

  const confirmFieldRows = useMemo<ConfirmFieldRow[]>(() => {
    const formatTime = (value?: string | null) =>
      value ? dayjs(value).format("HH:mm") : "-";
    const formatDate = (value?: string | null) =>
      value ? dayjs(value).format("YYYY/MM/DD") : "-";
    const formatBool = (value?: boolean | null) => (value ? "○" : "-");
    const formatRests = (rests?: Attendance["rests"]) => {
      const items = (rests ?? []).filter(Boolean).map((rest) => {
        const start = rest?.startTime ? dayjs(rest.startTime).format("HH:mm") : "-";
        const end = rest?.endTime ? dayjs(rest.endTime).format("HH:mm") : "-";
        return `${start}-${end}`;
      });
      return items.length ? items.join(" / ") : "-";
    };
    const formatHourlyTimes = (
      hourlyTimes?: Attendance["hourlyPaidHolidayTimes"],
    ) => {
      const items = (hourlyTimes ?? []).filter(Boolean).map((time) => {
        const start = time?.startTime ? dayjs(time.startTime).format("HH:mm") : "-";
        const end = time?.endTime ? dayjs(time.endTime).format("HH:mm") : "-";
        return `${start}-${end}`;
      });
      return items.length ? items.join(" / ") : "-";
    };
    const formatChangeRequests = (
      changeRequests?: Attendance["changeRequests"],
    ) => {
      const items = (changeRequests ?? []).filter(Boolean).map((request, idx) => {
        const start = request?.startTime
          ? dayjs(request.startTime).format("HH:mm")
          : "-";
        const end = request?.endTime ? dayjs(request.endTime).format("HH:mm") : "-";
        const completed = request?.completed ? "済" : "未";
        return `#${idx + 1}: ${start}-${end} / ${completed}`;
      });
      return items.length ? items.join(" | ") : "-";
    };
    const formatSystemComments = (
      systemComments?: Attendance["systemComments"],
    ) => {
      const items = (systemComments ?? [])
        .filter(Boolean)
        .map((comment) => comment?.comment);
      return items.length ? items.join(" | ") : "-";
    };
    const row = (label: string, value: (record: Attendance) => string) => ({
      label,
      value,
      render: value,
    });

    return [
      row("対象日", (record) =>
        record.workDate ? formatDate(record.workDate) : "-",
      ),
      row("スタッフID", (record) => record.staffId || "-"),
      row("出勤", (record) => formatTime(record.startTime)),
      row("退勤", (record) => formatTime(record.endTime)),
      row("直行", (record) => formatBool(record.goDirectlyFlag)),
      row("直帰", (record) => formatBool(record.returnDirectlyFlag)),
      row("欠勤", (record) => formatBool(record.absentFlag)),
      row("休憩", (record) => formatRests(record.rests)),
      row("時間有休", (record) => formatHourlyTimes(record.hourlyPaidHolidayTimes)),
      row("備考", (record) => record.remarks || "-"),
      row("有給", (record) => formatBool(record.paidHolidayFlag)),
      row("特別休暇", (record) => formatBool(record.specialHolidayFlag)),
      row("指定休日", (record) => formatBool(record.isDeemedHoliday)),
      row("時間有休(時間)", (record) =>
        typeof record.hourlyPaidHolidayHours === "number"
          ? `${record.hourlyPaidHolidayHours}h`
          : "-",
      ),
      row("振替日", (record) => formatDate(record.substituteHolidayDate)),
      row("変更申請", (record) => formatChangeRequests(record.changeRequests)),
      row("システムコメント", (record) =>
        formatSystemComments(record.systemComments),
      ),
      row("改訂番号", (record) =>
        typeof record.revision === "number" ? `${record.revision}` : "-",
      ),
      row("作成日時", (record) =>
        record.createdAt ? dayjs(record.createdAt).format("YYYY/MM/DD HH:mm") : "-",
      ),
      row("更新日時", (record) =>
        record.updatedAt ? dayjs(record.updatedAt).format("YYYY/MM/DD HH:mm") : "-",
      ),
      row("ID", (record) => record.id || "-"),
    ];
  }, []);

  const renderInlineDiff = useCallback((base: string, target: string) => {
    if (base === target) {
      return target || "-";
    }

    const a = base ?? "";
    const b = target ?? "";
    let prefix = 0;
    while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
      prefix += 1;
    }

    let suffix = 0;
    while (
      suffix < a.length - prefix &&
      suffix < b.length - prefix &&
      a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
    ) {
      suffix += 1;
    }

    const sameStart = b.slice(0, prefix);
    const diffMid = b.slice(prefix, b.length - suffix);
    const sameEnd = b.slice(b.length - suffix);

    return (
      <Box component="span" sx={diffWrapperSx}>
        {sameStart}
        {diffMid ? (
          <Box component="span" sx={diffHighlightSx}>
            {diffMid || " "}
          </Box>
        ) : null}
        {sameEnd}
      </Box>
    );
  }, []);

  const handleOpenConfirm = useCallback(
    async (staffId: string) => {
      setSelectionMode("record");
      setSelectedRecordIndex(null);
      setFieldSelections({});
      setConfirmTargetStaffId(staffId);
      setConfirmTargetName(staffNameMap[staffId] ?? staffId);
      setConfirmOpen(true);
      setConfirmLoading(true);
      setLastFieldRowIndex(null);
      setLastFieldRecordIndex(null);

      const targetIds = duplicates
        .filter((duplicate) => duplicate.staffId === staffId)
        .flatMap((duplicate) => duplicate.ids);
      const uniqueIds = Array.from(new Set(targetIds)).filter(Boolean);

      try {
        const records = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const response = await triggerGetAttendanceById({ id }).unwrap();
              return response ?? null;
            } catch (error) {
              console.error(error);
              return null;
            }
          }),
        );

        const validRecords = records
          .filter((record): record is Attendance => Boolean(record))
          .toSorted((a, b) => {
            const aTime = dayjs(
              `${a.workDate} ${a.startTime || "00:00"}`,
            ).valueOf();
            const bTime = dayjs(
              `${b.workDate} ${b.startTime || "00:00"}`,
            ).valueOf();
            return aTime - bTime;
          });
        setConfirmRecords(validRecords);
      } catch (error) {
        dispatch(
          pushNotification({
            tone: "error",
            message: MESSAGE_CODE.E00001,
          }),
        );
        console.error(error);
      } finally {
        setConfirmLoading(false);
      }
    },
    [dispatch, duplicates, staffNameMap, triggerGetAttendanceById],
  );

  const handleOpenConfirmClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const staffId = event.currentTarget.dataset.staffId;
      if (staffId) {
        void handleOpenConfirm(staffId);
      }
    },
    [handleOpenConfirm],
  );

  const handleCloseConfirm = useCallback(() => {
    setConfirmOpen(false);
    setConfirmRecords([]);
    setSelectedRecordIndex(null);
    setFieldSelections({});
    setLastFieldRowIndex(null);
    setLastFieldRecordIndex(null);
  }, []);

  const handleChangeSelectionMode = useCallback(
    (_: unknown, next: "record" | "field" | null) => {
      if (!next) {
        return;
      }
      setSelectionMode(next);
      setSelectedRecordIndex(null);
      setFieldSelections({});
      setLastFieldRowIndex(null);
      setLastFieldRecordIndex(null);
    },
    [],
  );

  const handleSelectRecord = useCallback(
    (index: number) => {
      if (selectionMode !== "record") {
        return;
      }
      setSelectedRecordIndex((previous) => (previous === index ? null : index));
    },
    [selectionMode],
  );

  const handleRecordHeaderClick = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      if (selectionMode !== "record") {
        return;
      }
      const idx = Number(event.currentTarget.dataset.recordIndex);
      handleSelectRecord(idx);
    },
    [handleSelectRecord, selectionMode],
  );

  const handleSelectField = useCallback(
    (label: string, index: number, rowIndex: number, isShift: boolean) => {
      if (selectionMode !== "field") {
        return;
      }

      setFieldSelections((previous) => {
        if (
          isShift &&
          lastFieldRowIndex !== null &&
          lastFieldRecordIndex === index
        ) {
          const next = { ...previous };
          const start = Math.min(lastFieldRowIndex, rowIndex);
          const end = Math.max(lastFieldRowIndex, rowIndex);
          confirmFieldRows.slice(start, end + 1).forEach((row) => {
            next[row.label] = index;
          });
          return next;
        }

        const current = previous[label];
        if (current === index) {
          const { [label]: _removed, ...rest } = previous;
          return rest;
        }

        return { ...previous, [label]: index };
      });

      setLastFieldRowIndex(rowIndex);
      setLastFieldRecordIndex(index);
    },
    [
      confirmFieldRows,
      lastFieldRecordIndex,
      lastFieldRowIndex,
      selectionMode,
    ],
  );

  const handleBodyCellClick = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>) => {
      const idx = Number(event.currentTarget.dataset.recordIndex);
      const rowIndex = Number(event.currentTarget.dataset.rowIndex);
      const fieldLabel = event.currentTarget.dataset.fieldLabel ?? "";

      if (selectionMode === "record") {
        handleSelectRecord(idx);
      } else if (selectionMode === "field") {
        handleSelectField(fieldLabel, idx, rowIndex, event.shiftKey);
      }
    },
    [handleSelectField, handleSelectRecord, selectionMode],
  );

  const handleDeleteDuplicates = useCallback(async () => {
    if (selectedRecordIndex === null) {
      return;
    }

    const selected = confirmRecords[selectedRecordIndex];
    const toDelete = confirmRecords
      .filter((_, index) => index !== selectedRecordIndex)
      .map((record) => record.id)
      .filter(Boolean) as string[];

    if (toDelete.length === 0) {
      return;
    }

    const ok = window.confirm(
      `選択したデータのみを残し、他の重複レコードを削除します。対象件数: ${toDelete.length}\n削除対象ID: ${toDelete.join(", ")}\nこの操作は取り消せません。実行しますか？`,
    );
    if (!ok) {
      return;
    }

    setConfirmLoading(true);
    try {
      for (const id of toDelete) {
        try {
          await deleteAttendance({ id }).unwrap();
        } catch (error) {
          console.error("Failed to delete attendance:", id, error);
          dispatch(
            pushNotification({
              tone: "error",
              message: MESSAGE_CODE.E00001,
            }),
          );
        }
      }

      setConfirmRecords(selected ? [selected] : []);
      dispatch(
        pushNotification({
          tone: "success",
          message: `選択したデータのみ残しました（残件数: ${selected ? 1 : 0}）`,
        }),
      );
    } finally {
      setConfirmLoading(false);
    }
  }, [confirmRecords, deleteAttendance, dispatch, selectedRecordIndex]);

  if (duplicates.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={duplicateErrorBoxSx}>
        <Typography variant="h6" sx={sectionTitleSx}>
          重複データが検出されたスタッフ ({duplicates.length})
        </Typography>
        <Alert severity="error" sx={alertMb2Sx}>
          同一日付に重複した勤怠データがあります。早急にデータ統合を実施してください。
        </Alert>
        <TableContainer sx={tableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={colStaffSx}>スタッフ</TableCell>
                <TableCell sx={colDateSx}>対象日</TableCell>
                <TableCell sx={colCountSx}>重複件数</TableCell>
                <TableCell sx={recordIdsCellSx}>レコードID一覧</TableCell>
                <TableCell sx={colActionSx} align="right">
                  確認
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {duplicates.map((duplicate, index) => (
                <TableRow
                  key={`${duplicate.staffId}-${duplicate.workDate}-${index}`}
                >
                  <TableCell>{duplicate.staffName || duplicate.staffId}</TableCell>
                  <TableCell>
                    {duplicate.workDate
                      ? dayjs(duplicate.workDate).format("YYYY/MM/DD")
                      : "-"}
                  </TableCell>
                  <TableCell>{duplicate.ids.length}</TableCell>
                  <TableCell sx={recordIdsCellSx}>
                    {duplicate.ids.join(", ") || "-"}
                  </TableCell>
                  <TableCell align="right">
                    <AppButton
                      variant="solid"
                      tone="danger"
                      size="sm"
                      data-staff-id={duplicate.staffId}
                      onClick={handleOpenConfirmClick}
                    >
                      確認
                    </AppButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={confirmOpen} onClose={handleCloseConfirm} maxWidth="md" fullWidth>
        <DialogTitle>
          重複データ確認 - {confirmTargetName || confirmTargetStaffId}
        </DialogTitle>
        <DialogContent dividers>
          {confirmLoading ? (
            <Typography>読み込み中...</Typography>
          ) : confirmRecords.length === 0 ? (
            <Typography color="text.secondary">
              該当の重複データを取得できませんでした。
            </Typography>
          ) : (
            <>
              <Box sx={dialogHeaderSx}>
                <Typography variant="body2" color="text.secondary">
                  選択モードを切り替えて、レコード単位または項目単位で採用候補をマークできます。
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={selectionMode}
                  onChange={handleChangeSelectionMode}
                >
                  <ToggleButton value="record">レコード単位</ToggleButton>
                  <ToggleButton value="field">項目単位</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <TableContainer sx={tableContainerSx}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={colItemLabelSx}>項目</TableCell>
                      {confirmRecords.map((record, idx) => {
                        const isSelected =
                          selectionMode === "record" && selectedRecordIndex === idx;
                        const selectable = selectionMode === "record";
                        return (
                          <TableCell
                            key={record.id}
                            sx={{
                              minWidth: 140,
                              cursor: selectable ? "pointer" : "default",
                              fontWeight: isSelected ? 700 : 400,
                              border: isSelected
                                ? "2px solid rgba(25,118,210,0.6)"
                                : undefined,
                              backgroundColor: isSelected
                                ? "rgba(25,118,210,0.08)"
                                : undefined,
                            }}
                            data-record-index={idx}
                            onClick={handleRecordHeaderClick}
                          >
                            #{idx + 1} ({record.id})
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {confirmFieldRows.map((row, rowIndex) => {
                      const values = confirmRecords.map((record) => row.value(record));
                      const unique = new Set(values);
                      const hasDiff = unique.size > 1;
                      const diffSx = hasDiff
                        ? {
                            backgroundColor: "rgba(255,205,210,0.35)",
                            fontWeight: 700,
                          }
                        : undefined;
                      const base = values[0] ?? "";

                      return (
                        <TableRow key={row.label}>
                          <TableCell sx={{ fontWeight: hasDiff ? 700 : 600, ...diffSx }}>
                            {row.label}
                          </TableCell>
                          {confirmRecords.map((record, idx) => {
                            const current = values[idx] ?? "";
                            const content = hasDiff
                              ? renderInlineDiff(base, current)
                              : row.render(record);
                            const recordSelected =
                              selectionMode === "record" && selectedRecordIndex === idx;
                            const isFieldSelected =
                              selectionMode === "field" &&
                              fieldSelections[row.label] === idx;
                            const isFieldMode = selectionMode === "field";
                            const isRecordMode = selectionMode === "record";
                            const selectable = isFieldMode || isRecordMode;

                            return (
                              <TableCell
                                key={`${row.label}-${record.id}`}
                                sx={{
                                  ...diffSx,
                                  cursor: selectable ? "pointer" : "default",
                                  border:
                                    isFieldSelected || recordSelected
                                      ? "2px solid rgba(25,118,210,0.6)"
                                      : undefined,
                                  backgroundColor:
                                    isFieldSelected || recordSelected
                                      ? "rgba(25,118,210,0.08)"
                                      : undefined,
                                }}
                                data-record-index={idx}
                                data-row-index={rowIndex}
                                data-field-label={row.label}
                                onClick={handleBodyCellClick}
                              >
                                {content}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {selectionMode === "record" && selectedRecordIndex !== null && (
            <AppButton variant="outline" tone="danger" onClick={handleDeleteDuplicates}>
              選択したデータを残す
            </AppButton>
          )}
          <AppButton variant="ghost" tone="neutral" onClick={handleCloseConfirm}>
            閉じる
          </AppButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
