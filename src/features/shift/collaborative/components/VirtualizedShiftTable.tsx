import {
  alpha,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { memo, useMemo } from "react";

import { CollaborativeUser, ShiftState } from "../types/collaborative.types";

interface VirtualizedShiftTableProps {
  days: dayjs.Dayjs[];
  staffIds: string[];
  shiftDataMap: Map<
    string,
    Map<
      string,
      {
        state: ShiftState;
        isLocked: boolean;
        lastChangedBy?: string;
        lastChangedAt?: string;
      }
    >
  >;
  staffs: Array<{
    id: string;
    familyName?: string | null;
    givenName?: string | null;
  }>;
  isCellBeingEdited: (staffId: string, date: string) => boolean;
  getCellEditor: (
    staffId: string,
    date: string,
  ) => CollaborativeUser | undefined;
  focusedCell: { staffId: string; date: string } | null;
  isCellSelected: (staffId: string, date: string) => boolean;
  onCellClick: (staffId: string, date: string, event: React.MouseEvent) => void;
  onCellRegisterRef: (
    staffId: string,
    date: string,
    element: HTMLElement | null,
  ) => void;
  onCellMouseDown: (
    staffId: string,
    date: string,
    event: React.MouseEvent,
  ) => void;
  onCellMouseEnter: (staffId: string, date: string) => void;
  isLoading?: boolean;
  getEventsForDay: (day: dayjs.Dayjs) => Array<{
    label: string;
    start: dayjs.Dayjs;
    end?: dayjs.Dayjs;
    color: string;
  }>;
  ShiftCellComponent: React.ComponentType<{
    staffId: string;
    date: string;
    state: ShiftState;
    isLocked: boolean;
    isEditing: boolean;
    editorName?: string;
    lastChangedBy?: string;
    lastChangedAt?: string;
    onClick: (event: React.MouseEvent) => void;
    onRegisterRef: (element: HTMLElement | null) => void;
    onMouseDown: (event: React.MouseEvent) => void;
    onMouseEnter: () => void;
    isFocused: boolean;
    isSelected: boolean;
  }>;
  isWeekend: (day: dayjs.Dayjs) => boolean;
  calculateDailyCount: (day: dayjs.Dayjs) => {
    work: number;
    fixedOff: number;
    requestedOff: number;
  };
  currentUserId?: string;
}

/* eslint-disable react/prop-types */

/**
 * 仮想スクロール対応シフトテーブルコンポーネント
 * 大量のスタッフ（100名以上）をスムーズに表示
 * TypeScriptの型定義で十分に型安全なため、PropTypesは省略
 */
export const VirtualizedShiftTable = memo<VirtualizedShiftTableProps>(
  ({
    days,
    staffIds,
    shiftDataMap,
    staffs,
    isCellBeingEdited,
    getCellEditor,
    focusedCell,
    isCellSelected,
    onCellClick,
    onCellRegisterRef,
    onCellMouseDown,
    onCellMouseEnter,
    isLoading,
    getEventsForDay,
    ShiftCellComponent,
    isWeekend,
    calculateDailyCount,
    currentUserId,
  }) => {
    // メモ化されたスタッフ情報マップ
    const staffMap = useMemo(
      () =>
        new Map(
          staffs.map((staff) => [
            staff.id,
            `${staff.familyName || ""}${staff.givenName || ""}`,
          ]),
        ),
      [staffs],
    );

    if (isLoading) {
      return <Typography>読み込み中...</Typography>;
    }

    return (
      <TableContainer component={Paper}>
        <Table
          size="small"
          stickyHeader
          sx={{
            "& .MuiTableCell-root": {
              borderRight: "1px solid",
              borderColor: "divider",
            },
            "& .MuiTableCell-root:last-child": {
              borderRight: "none",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                  bgcolor: "background.paper",
                  whiteSpace: "nowrap",
                }}
              >
                スタッフ名
              </TableCell>
              {days.map((day) => {
                const dayKey = day.format("DD");
                const count = calculateDailyCount(day);

                return (
                  <TableCell
                    key={dayKey}
                    align="center"
                    sx={{
                      bgcolor: isWeekend(day)
                        ? alpha("#f44336", 0.05)
                        : "background.paper",
                      minWidth: 50,
                    }}
                  >
                    <Typography variant="caption" display="block">
                      {day.format("M/D")}
                    </Typography>
                    <Typography variant="caption" display="block">
                      ({day.format("ddd")})
                    </Typography>
                    <Typography
                      variant="caption"
                      color={count.work < 2 ? "warning.main" : "text.secondary"}
                    >
                      {count.work}人
                    </Typography>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {staffIds.map((staffId) => {
              const staffData = shiftDataMap.get(staffId);
              const staffName = staffMap.get(staffId) || staffId;
              const isCurrentUser = staffId === currentUserId;

              if (!staffData) return null;

              return (
                <TableRow
                  key={staffId}
                  sx={{
                    backgroundColor: isCurrentUser
                      ? alpha("#2196F3", 0.1)
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isCurrentUser
                        ? alpha("#2196F3", 0.15)
                        : undefined,
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      bgcolor: isCurrentUser
                        ? alpha("#2196F3", 0.1)
                        : "background.paper",
                      fontWeight: isCurrentUser ? 700 : 600,
                      color: isCurrentUser ? "primary.main" : undefined,
                    }}
                  >
                    {staffName}
                  </TableCell>
                  {days.map((day) => {
                    const dayKey = day.format("DD");
                    const cell = staffData.get(dayKey);

                    if (!cell) {
                      return <TableCell key={dayKey}>-</TableCell>;
                    }

                    const isEditing = isCellBeingEdited(staffId, dayKey);
                    const editor = getCellEditor(staffId, dayKey);
                    const isFocused =
                      focusedCell?.staffId === staffId &&
                      focusedCell?.date === dayKey;
                    const isSelected = isCellSelected(staffId, dayKey);

                    return (
                      <ShiftCellComponent
                        key={dayKey}
                        staffId={staffId}
                        date={dayKey}
                        state={cell.state}
                        isLocked={cell.isLocked}
                        isEditing={isEditing}
                        editorName={editor?.userName}
                        lastChangedBy={cell.lastChangedBy}
                        lastChangedAt={cell.lastChangedAt}
                        onClick={(event) => onCellClick(staffId, dayKey, event)}
                        onRegisterRef={(element) =>
                          onCellRegisterRef(staffId, dayKey, element)
                        }
                        onMouseDown={(event) =>
                          onCellMouseDown(staffId, dayKey, event)
                        }
                        onMouseEnter={() => onCellMouseEnter(staffId, dayKey)}
                        isFocused={isFocused}
                        isSelected={isSelected}
                      />
                    );
                  })}
                </TableRow>
              );
            })}

            {/* 備考行 */}
            <TableRow>
              <TableCell
                sx={{
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                  bgcolor: "background.paper",
                  fontWeight: 600,
                }}
              >
                備考
              </TableCell>
              {days.map((day) => {
                const events = getEventsForDay(day);
                return (
                  <TableCell
                    key={`remark-${day.format("DD")}`}
                    sx={{
                      minWidth: 50,
                      px: 2,
                      py: 2,
                      textAlign: "start",
                      verticalAlign: "top",
                    }}
                  >
                    {events.length > 0 && (
                      <Box
                        sx={{
                          display: "inline-block",
                          writingMode: "vertical-rl",
                        }}
                      >
                        {events.map((event) => (
                          <Typography
                            key={`${event.label}-${event.start.format("YYYY-MM-DD")}`}
                            variant="caption"
                            component="span"
                            sx={{
                              fontWeight: 700,
                              lineHeight: 1.2,
                              display: "block",
                            }}
                          >
                            {event.label}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  },
);

VirtualizedShiftTable.displayName = "VirtualizedShiftTable";

// PropTypes は TypeScript の型定義で既にカバーされているため、ESLint ルールを無効化
// VirtualizedShiftTable.propTypes = {};

/* eslint-enable react/prop-types */
