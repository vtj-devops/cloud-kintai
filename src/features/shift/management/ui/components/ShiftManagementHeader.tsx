import AppButton from "@shared/ui/button/AppButton";
import dayjs, { Dayjs } from "dayjs";
import { Loader2, Settings } from "lucide-react";
import React from "react";

type Props = {
  monthStart: Dayjs;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  scenario: string;
  isAutoSaving: boolean;
  isAutoSavePending: boolean;
  lastChangedAt: Date | null;
  lastSavedAt: Date | null;
  hasBulkSelection: boolean;
  selectedCellCount: number;
  onOpenBulkEditDialog: () => void;
  onOpenSettings?: () => void;
};

const Chip: React.FC<{
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "outlined";
  className?: string;
}> = ({ label, onClick, icon, variant = "default", className = "" }) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap";
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800 border border-green-200",
    outlined: "bg-transparent border border-gray-300 text-gray-700",
  };

  const clickableClasses = onClick
    ? "cursor-pointer hover:bg-gray-200 active:bg-gray-300"
    : "";

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${clickableClasses} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      {icon}
      {label}
    </div>
  );
};

export const ShiftManagementHeader: React.FC<Props> = ({
  monthStart,
  onPrevMonth,
  onNextMonth,
  scenario,
  isAutoSaving,
  isAutoSavePending,
  lastChangedAt,
  lastSavedAt,
  hasBulkSelection,
  selectedCellCount,
  onOpenBulkEditDialog,
  onOpenSettings,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip label="前月" onClick={onPrevMonth} />
        <Chip label={monthStart.format("YYYY年 M月")} />
        <Chip label="翌月" onClick={onNextMonth} />

        {scenario === "actual" && (
          <div className="flex flex-wrap items-center gap-2 ml-2 sm:ml-4">
            {isAutoSaving && (
              <Chip
                icon={<Loader2 className="h-3 w-3 animate-spin" />}
                label="保存中..."
              />
            )}
            {isAutoSavePending && !isAutoSaving && (
              <Chip
                label={`保存待ち${
                  lastChangedAt
                    ? ` (${dayjs(lastChangedAt).format("M/D HH:mm:ss")})`
                    : ""
                }`}
                variant="outlined"
              />
            )}
            {!isAutoSaving && !isAutoSavePending && lastSavedAt && (
              <Chip
                label={`最終保存: ${dayjs(lastSavedAt).format("M/D HH:mm:ss")}`}
                variant="success"
              />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onOpenSettings && (
          <AppButton
            variant="outline"
            tone="secondary"
            size="sm"
            onClick={onOpenSettings}
            aria-label="シフト設定を開く"
            startIcon={<Settings className="h-4 w-4" />}
            className="min-w-0"
          >
            <span>設定</span>
          </AppButton>
        )}
        <div className="relative">
          <AppButton
            variant="solid"
            tone="primary"
            disabled={!hasBulkSelection}
            onClick={onOpenBulkEditDialog}
          >
            選択した項目を変更
          </AppButton>
          {hasBulkSelection && (
            <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white border-2 border-white ring-1 ring-blue-600/20">
              {selectedCellCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
