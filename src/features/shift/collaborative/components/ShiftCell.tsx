import LockIcon from "@mui/icons-material/Lock";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";
import PropTypes, { type Validator } from "prop-types";
import React, { type CSSProperties, type FC, memo, type MouseEvent } from "react";

import type {
  ShiftCellEditLockOwner,
  ShiftState,
} from "../types/collaborative.types";

export const shiftStateConfig: Record<
  ShiftState,
  { label: string; text: string; textClassName: string }
> = {
  work: { label: "○", text: "出勤", textClassName: "text-emerald-700" },
  fixedOff: { label: "固", text: "固定休", textClassName: "text-rose-600" },
  requestedOff: {
    label: "希",
    text: "希望休",
    textClassName: "text-amber-500",
  },
  auto: { label: "△", text: "自動調整枠", textClassName: "text-sky-600" },
  empty: { label: "-", text: "未入力", textClassName: "text-slate-400" },
};

export const SHIFT_CELL_SIZE = 50;
export const SHIFT_CELL_BASE_STYLE: CSSProperties = {
  position: "relative",
  cursor: "pointer",
  minWidth: SHIFT_CELL_SIZE,
  maxWidth: SHIFT_CELL_SIZE,
  textAlign: "center",
  padding: "4px",
  userSelect: "none",
};

export interface ShiftCellProps {
  staffId: string;
  date: string;
  state: ShiftState;
  isLocked: boolean;
  isEditing: boolean;
  editLockOwner?: ShiftCellEditLockOwner;
  editorName?: string;
  editorColor?: string;
  lastChangedBy?: string;
  lastChangedAt?: string;
  onClick: (event: MouseEvent) => void;
  onRegisterRef?: (element: HTMLElement | null) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onMouseEnter?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  isFocused?: boolean;
  isSelected?: boolean;
}

export const ShiftCellBase: FC<ShiftCellProps> = ({
  state,
  isLocked,
  isEditing,
  editLockOwner = null,
  editorName,
  editorColor,
  lastChangedBy,
  lastChangedAt,
  onClick,
  onRegisterRef,
  onMouseDown,
  onMouseEnter,
  onContextMenu,
  isFocused = false,
  isSelected = false,
}: ShiftCellProps) => {
  const config = shiftStateConfig[state];
  const isPending = false;
  const isSelfEditing = editLockOwner === "self";
  const isOtherEditing = editLockOwner === "other" && isEditing;
  const tooltipTitle = isLocked ? (
    <div className="text-xs leading-5 text-slate-900">
      <div className="font-semibold">確定済み</div>
      {lastChangedBy && (
        <div className="text-slate-600">確定者: {lastChangedBy}</div>
      )}
      {lastChangedAt && (
        <div className="text-slate-500">
          {dayjs(lastChangedAt).format("YYYY/MM/DD HH:mm")}
        </div>
      )}
    </div>
  ) : isSelfEditing ? (
    "編集中（ロック取得中）"
  ) : isOtherEditing ? (
    `${editorName}が編集中`
  ) : (
    <div className="text-xs leading-5 text-slate-900">
      <div>{config.text}</div>
    </div>
  );

  const themeColor = editorColor || "#2196f3";
  const selfEditingColor = "#2196f3";

  const backgroundColor = isLocked
    ? "rgba(148, 163, 184, 0.12)"
    : isSelfEditing
      ? alpha(selfEditingColor, 0.14)
      : isOtherEditing
    ? alpha(themeColor, 0.1)
    : isPending
      ? alpha("#ff9800", 0.1)
      : isSelected
        ? alpha("#9c27b0", 0.15)
        : "#ffffff";
  const borderColor = isLocked
    ? "rgba(100, 116, 139, 0.5)"
    : isSelfEditing
      ? selfEditingColor
      : isOtherEditing
    ? themeColor
    : isFocused
      ? "#9c27b0"
      : "rgba(226,232,240,0.7)";

  const editorTab =
    !isLocked && isEditing && editorName ? (
      <div
        className="absolute right-[-2px] top-[-2px] z-10 flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold text-white shadow-sm"
        style={{ backgroundColor: isSelfEditing ? selfEditingColor : themeColor }}
      >
        {editorName.charAt(0)}
      </div>
    ) : null;

  return (
    <td
      ref={onRegisterRef}
      tabIndex={0}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onContextMenu={onContextMenu}
      className="group relative outline-none transition-colors"
      style={{
        ...SHIFT_CELL_BASE_STYLE,
        backgroundColor,
        border: `2px solid ${borderColor}`,
        boxShadow:
          isSelfEditing && !isLocked
            ? `inset 0 0 0 1px ${alpha(selfEditingColor, 0.2)}`
            : "none",
      }}
      onMouseLeave={(event) => {
        if (!isLocked && !isOtherEditing && !isSelfEditing && !isPending && !isSelected) {
          event.currentTarget.style.backgroundColor = "#ffffff";
        }
      }}
      onMouseOver={(event) => {
        if (!isLocked && !isOtherEditing && !isSelfEditing && !isPending && !isSelected) {
          event.currentTarget.style.backgroundColor = alpha("#2196f3", 0.05);
        }
      }}
      onFocus={(event) => {
        event.currentTarget.style.borderColor = "#9c27b0";
      }}
      onBlur={(event) => {
        event.currentTarget.style.borderColor = borderColor;
      }}
    >
      {isLocked && (
        <div
          className="absolute right-0 top-0 z-10 flex h-4 w-4 items-center justify-center rounded-bl-sm bg-slate-500 text-white"
          aria-hidden="true"
        >
          <LockIcon sx={{ fontSize: 10 }} />
        </div>
      )}
      <div
        className="flex items-center justify-center gap-0.5"
        style={{ opacity: isLocked ? 0.65 : 1 }}
      >
        {editorTab}
        <span className={`text-sm font-semibold ${config.textClassName}`}>
          {config.label}
        </span>
        {isPending && <span className="h-1 w-1 rounded-full bg-amber-500" />}
      </div>
      {typeof tooltipTitle === "string" ? (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium leading-5 text-slate-900 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.35)] group-hover:block group-focus:block">
          {tooltipTitle}
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-48 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-slate-900 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.35)] group-hover:block group-focus:block">
          {tooltipTitle}
        </div>
      )}
    </td>
  );
};

ShiftCellBase.propTypes = {
  state: PropTypes.oneOf(["work", "fixedOff", "requestedOff", "auto", "empty"] as const)
    .isRequired as Validator<ShiftState>,
  isLocked: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  editLockOwner: PropTypes.oneOf(["self", "other", null] as const) as Validator<
    ShiftCellEditLockOwner | null | undefined
  >,
  editorName: PropTypes.string,
  editorColor: PropTypes.string,
  lastChangedBy: PropTypes.string,
  lastChangedAt: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  onRegisterRef: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onContextMenu: PropTypes.func,
  isFocused: PropTypes.bool,
  isSelected: PropTypes.bool,
};

export const ShiftCell = memo(ShiftCellBase);
