import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { PageContent } from "@shared/ui/layout";
import Page from "@shared/ui/page/Page";
import dayjs from "dayjs";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AuthContext } from "@/context/AuthContext";
import AdminShiftSettingsDialog from "@/features/admin-config-shift/AdminShiftSettingsDialog";
import { usePageLeaveGuard } from "@/hooks/usePageLeaveGuard";

import { CollaborativeHeader } from "../../../features/shift/collaborative/components/CollaborativeHeader";
import { KeyboardShortcutsHelp } from "../../../features/shift/collaborative/components/KeyboardShortcutsHelp";
import { usePresenceNotifications } from "../../../features/shift/collaborative/components/PresenceNotification";
import { PrintShiftDialog } from "../../../features/shift/collaborative/components/PrintShiftDialog";
import { ProgressPanel } from "../../../features/shift/collaborative/components/ProgressPanel";
import {
  ShiftCell,
  type ShiftCellProps,
} from "../../../features/shift/collaborative/components/ShiftCell";
import { ShiftCellPanel } from "../../../features/shift/collaborative/components/ShiftCellPanel";
import { ShiftSuggestionsPanel } from "../../../features/shift/collaborative/components/ShiftSuggestionsPanel";
import { SyncPanel } from "../../../features/shift/collaborative/components/SyncPanel";
import { InfoBadge } from "../../../features/shift/collaborative/components/ui/Badges";
import { InlineAlert } from "../../../features/shift/collaborative/components/ui/InlineAlert";
import { PageLoadingBar } from "../../../features/shift/collaborative/components/ui/PageLoadingBar";
import { UndoRedoToolbar } from "../../../features/shift/collaborative/components/UndoRedoToolbar";
import { VirtualizedShiftTable } from "../../../features/shift/collaborative/components/VirtualizedShiftTable";
import { useCollaborativePageState } from "../../../features/shift/collaborative/hooks/useCollaborativePageState";
import { useKeyboardShortcuts } from "../../../features/shift/collaborative/hooks/useKeyboardShortcuts";
import { usePrintShift } from "../../../features/shift/collaborative/hooks/usePrintShift";
import { CollaborativeShiftProvider } from "../../../features/shift/collaborative/providers/CollaborativeShiftProvider";
import type { DataSyncStatus } from "../../../features/shift/collaborative/types/collaborative.types";

const isWeekend = (day: dayjs.Dayjs): boolean =>
  day.day() === 0 || day.day() === 6;

interface ShiftCollaborativePageInnerProps {
  staffs: ReturnType<typeof useStaffs>["staffs"];
  staffNameMap: Map<string, string>;
  targetMonth: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const ShiftCollaborativePageInner = memo<ShiftCollaborativePageInnerProps>(
  ({
    staffs,
    staffNameMap,
    targetMonth,
    onPrevMonth,
    onNextMonth,
  }: ShiftCollaborativePageInnerProps) => {
    const { cognitoUser } = useContext(AuthContext);
    const {
      state,
      isCellBeingEdited,
      getCellEditor,
      focusedCell,
      isCellSelected,
      registerCell,
      handleCellClick,
      handleCellMouseDown,
      handleCellMouseEnter,
      handleMouseUp,
      handleSync: _handleSync,
      clearSyncError: _clearSyncError,
      progress,
      calculateDailyCount,
      getEventsForDay,
      selectedCells,
      selectionCount,
      hasLocked,
      hasUnlocked,
      clearSelection,
      handleChangeState,
      handleLockCells,
      handleUnlockCells,
      handleLockStaffRow,
      handleUnlockStaffRow,
      handleLockMonth,
      handleUnlockMonth,
      handleApplySuggestion,
      violations,
      isAnalyzing,
      analyzeShifts,
      showHelp,
      setShowHelp,
      isAdmin,
      currentMonth,
      days,
      staffIds,
      isBatchUpdating,
      addComment,
      getCommentsByCell,
      getCellHistory,
      handleEscape,
      handleSelectAll,
      navigate,
      hasEditLockForSelected,
      isOthersEditingSelected,
      editLockError,
      clearEditLockError,
      handleAcquireEditLock,
      handleReleaseEditLock,
      handleForceReleaseLock,
    } = useCollaborativePageState(targetMonth);

    const currentUserId = useMemo(() => {
      if (!cognitoUser?.id) return "";
      const currentStaff = staffs.find(
        (staff) => staff.cognitoUserId === cognitoUser.id,
      );
      return currentStaff?.id ?? "";
    }, [cognitoUser, staffs]);

    const { addNotification } = usePresenceNotifications();

    const { isPrintDialogOpen, openPrintDialog, closePrintDialog } =
      usePrintShift();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
      if (!state.lastRemoteUpdate) return;
      const staffName =
        staffNameMap.get(state.lastRemoteUpdate.staffId) ??
        state.lastRemoteUpdate.staffId;
      addNotification("data-synced", "", { staffName, date: "" });
    }, [state.lastRemoteUpdate, staffNameMap, addNotification]);

    const [suggestionsDrawerOpen, setSuggestionsDrawerOpen] =
      useState<boolean>(false);

    // 選択セルの編集ロック保持者一覧
    const cellEditLockHolders = useMemo(() => {
      const cells =
        selectionCount > 0
          ? Array.from(selectedCells)
          : focusedCell
            ? [{ staffId: focusedCell.staffId, date: focusedCell.date }]
            : [];
      return cells
        .map(({ staffId, date }) => {
          const editor = getCellEditor(staffId, date);
          if (!editor) return null;
          return {
            staffId,
            date,
            editorName: editor.userName,
            editorColor: editor.color,
            isSelf: editor.userId === currentUserId,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);
    }, [
      selectionCount,
      selectedCells,
      focusedCell,
      getCellEditor,
      currentUserId,
    ]);

    const cellHistory = useMemo(() => {
      if (selectionCount === 1 && selectedCells.length === 1) {
        return getCellHistory(
          `${selectedCells[0].staffId}#${selectedCells[0].date}`,
        );
      }
      if (focusedCell) {
        return getCellHistory(`${focusedCell.staffId}#${focusedCell.date}`);
      }
      return [];
    }, [selectionCount, selectedCells, focusedCell, getCellHistory]);

    const suggestionsBadgeCount = useMemo(
      () =>
        violations.filter(
          (violation) =>
            violation.severity === "error" || violation.severity === "warning",
        ).length,
      [violations],
    );

    const handleAddCommentsToSelectedCells = useCallback(
      async (content: string) => {
        const cellCount = Math.min(selectionCount, 10);
        let addedCount = 0;

        const staffIds = Array.from(state.shiftDataMap.keys());
        for (const staffId of staffIds) {
          if (addedCount >= cellCount) break;

          const staffData = state.shiftDataMap.get(staffId);
          if (!staffData) continue;

          for (const dateKey of staffData.keys()) {
            if (addedCount >= cellCount) break;

            if (isCellSelected(staffId, dateKey)) {
              try {
                const cellKey = `${staffId}#${dateKey}`;
                await addComment(cellKey, content, []);
                addedCount++;
              } catch (error) {
                console.error("Failed to add comment:", error);
              }
            }
          }
        }
      },
      [state.shiftDataMap, isCellSelected, addComment, selectionCount],
    );

    const ShiftCellWithComments = useMemo(() => {
      const ShiftCellWithCommentsComponent = ({
        staffId,
        date,
        ...restProps
      }: ShiftCellProps) => {
        return <ShiftCell {...restProps} staffId={staffId} date={date} />;
      };
      Object.defineProperty(ShiftCellWithCommentsComponent, "displayName", {
        value: "ShiftCellWithComments",
      });
      return ShiftCellWithCommentsComponent;
    }, []) as React.FC<ShiftCellProps>;

    const formattedLastSyncedAt =
      state.lastAutoSyncedAt > 0
        ? dayjs(state.lastAutoSyncedAt).format("YYYY/MM/DD HH:mm:ss")
        : "未同期";

    const dataSyncStatusConfigLabel: Record<DataSyncStatus, string> = {
      idle: "未同期",
      saving: "保存中",
      syncing: "同期中",
      saved: "保存完了",
      synced: "同期完了",
      error: "エラー",
    };

    const syncStatusLabel = dataSyncStatusConfigLabel[state.dataStatus];

    const syncButtonColor: "default" | "primary" | "success" | "error" =
      state.dataStatus === "error"
        ? "error"
        : state.dataStatus === "synced" || state.dataStatus === "saved"
          ? "success"
          : state.dataStatus === "syncing"
            ? "primary"
            : "default";

    const syncTooltipTitle = (
      <div className="text-xs leading-5">
        <div>同期状態: {syncStatusLabel}</div>
        <div>最後に自動同期された日時: {formattedLastSyncedAt}</div>
        <div>{state.isSyncing ? "同期中です" : "最新状態を取得"}</div>
      </div>
    );

    useKeyboardShortcuts({
      enabled: true,
      onNavigate: navigate,
      onChangeState: handleChangeState,
      onSelectAll: handleSelectAll,
      onShowHelp: () => setShowHelp(true),
      onEscape: handleEscape,
    });
    const { dialog } = usePageLeaveGuard({
      isDirty: state.pendingChanges.size > 0,
      isBusy: state.dataStatus === "saving" || state.dataStatus === "syncing",
    });

    return (
      <Page title="シフト調整(共同)" width="full" showDefaultHeader={false}>
        {dialog}
        <PageContent
          width="full"
          className="px-1.5 py-1 sm:px-2.5"
          onMouseUp={handleMouseUp}
        >
          <CollaborativeHeader
            currentMonth={currentMonth}
            activeUsers={state.activeUsers}
            editingCells={state.editingCells}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          <UndoRedoToolbar
            onShowHelp={() => setShowHelp(true)}
            onPrint={openPrintDialog}
            onSync={() => {
              void _handleSync();
            }}
            syncTooltip={syncTooltipTitle}
            syncColor={syncButtonColor}
            isSyncing={state.isSyncing}
            onShowSuggestions={() => setSuggestionsDrawerOpen(true)}
            suggestionsBadgeCount={suggestionsBadgeCount}
          />

          <SyncPanel syncError={state.error} onClearError={_clearSyncError} />

          {!state.isOnline || state.connectionState === "disconnected" ? (
            <InlineAlert tone="warning" icon={<InfoBadge />} className="mb-3">
              通信が切断されています。再接続後に編集を再開してください。
            </InlineAlert>
          ) : null}

          {editLockError ? (
            <InlineAlert
              tone="warning"
              icon={<InfoBadge />}
              className="mb-3"
              onClose={clearEditLockError}
            >
              {editLockError}
            </InlineAlert>
          ) : null}

          <ProgressPanel progress={progress} totalDays={days.length} />

          <VirtualizedShiftTable
            days={days}
            staffIds={staffIds}
            shiftDataMap={state.shiftDataMap}
            isLoading={state.isLoading}
            staffs={staffs.map((staff) => ({
              id: staff.id,
              familyName: staff.familyName ?? undefined,
              givenName: staff.givenName ?? undefined,
            }))}
            focusedCell={focusedCell}
            isCellSelected={isCellSelected}
            isCellBeingEdited={isCellBeingEdited}
            getCellEditor={getCellEditor}
            onCellClick={handleCellClick}
            onCellRegisterRef={registerCell}
            onCellMouseDown={handleCellMouseDown}
            onCellMouseEnter={handleCellMouseEnter}
            calculateDailyCount={(day) => calculateDailyCount(day.format("DD"))}
            getEventsForDay={getEventsForDay}
            ShiftCellComponent={ShiftCellWithComments}
            isWeekend={isWeekend}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onLockStaffRow={handleLockStaffRow}
            onUnlockStaffRow={handleUnlockStaffRow}
            onLockMonth={handleLockMonth}
            onUnlockMonth={handleUnlockMonth}
            currentMonth={currentMonth.format("YYYY年M月")}
          />

          <ShiftCellPanel
            selectionCount={selectionCount}
            selectedCells={
              selectionCount > 0
                ? selectedCells
                : focusedCell
                  ? [{ staffId: focusedCell.staffId, date: focusedCell.date }]
                  : []
            }
            comments={
              focusedCell
                ? getCommentsByCell(
                    `${focusedCell.staffId}#${focusedCell.date}`,
                  )
                : []
            }
            cellHistory={cellHistory}
            onClear={clearSelection}
            onChangeState={handleChangeState}
            onLock={handleLockCells}
            onUnlock={handleUnlockCells}
            onAddComments={handleAddCommentsToSelectedCells}
            canUnlock={isAdmin}
            showLock={hasUnlocked && isAdmin}
            showUnlock={hasLocked}
            isUpdating={isBatchUpdating}
            cellEditLockHolders={cellEditLockHolders}
            hasEditLockForSelected={hasEditLockForSelected}
            isOthersEditingSelected={isOthersEditingSelected}
            onAcquireEditLock={handleAcquireEditLock}
            onReleaseEditLock={handleReleaseEditLock}
            onForceReleaseLock={handleForceReleaseLock}
          />

          <KeyboardShortcutsHelp
            open={showHelp}
            onClose={() => setShowHelp(false)}
          />

          <PrintShiftDialog
            open={isPrintDialogOpen}
            onClose={closePrintDialog}
            days={days}
            staffs={staffs
              .filter(
                (staff) =>
                  staff.enabled &&
                  (staff as unknown as Record<string, unknown>).workType ===
                    "shift",
              )
              .map((staff) => ({
                id: staff.id,
                familyName: staff.familyName ?? undefined,
                givenName: staff.givenName ?? undefined,
              }))}
            shiftDataMap={state.shiftDataMap}
            targetMonth={targetMonth}
          />

          <AdminShiftSettingsDialog
            open={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        </PageContent>

        <ShiftSuggestionsPanel
          open={suggestionsDrawerOpen}
          onClose={() => setSuggestionsDrawerOpen(false)}
          violations={violations}
          isAnalyzing={isAnalyzing}
          onApplyAction={handleApplySuggestion}
          onRefresh={analyzeShifts}
        />
      </Page>
    );
  },
);

ShiftCollaborativePageInner.displayName = "ShiftCollaborativePageInner";

export default function ShiftCollaborativePage() {
  const { authStatus, cognitoUser } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs, loading: staffsLoading } = useStaffs({ isAuthenticated });

  const [targetMonth, setTargetMonth] = useState(() =>
    dayjs().format("YYYY-MM"),
  );

  const handlePrevMonth = useCallback(() => {
    setTargetMonth((prev) =>
      dayjs(prev).subtract(1, "month").format("YYYY-MM"),
    );
  }, []);

  const handleNextMonth = useCallback(() => {
    setTargetMonth((prev) => dayjs(prev).add(1, "month").format("YYYY-MM"));
  }, []);

  const currentUserId = useMemo(() => {
    if (!cognitoUser?.id) return "";
    const currentStaff = staffs.find(
      (staff) => staff.cognitoUserId === cognitoUser.id,
    );
    return currentStaff?.id ?? "";
  }, [cognitoUser, staffs]);

  const currentUserName = useMemo(() => {
    if (!cognitoUser?.id) return "Current User";
    const currentStaff = staffs.find(
      (staff) => staff.cognitoUserId === cognitoUser.id,
    );
    return currentStaff
      ? `${currentStaff.familyName || ""}${currentStaff.givenName || ""}`
      : "Current User";
  }, [cognitoUser, staffs]);

  const staffNameMap = useMemo(
    () =>
      new Map(
        staffs.map((staff) => [
          staff.id,
          `${staff.familyName || ""}${staff.givenName || ""}`.trim() ||
            staff.id,
        ]),
      ),
    [staffs],
  );

  const staffIds = useMemo(
    () =>
      staffs
        .filter(
          (staff) =>
            staff.enabled &&
            (staff as unknown as Record<string, unknown>).workType === "shift",
        )
        .map((staff) => staff.id),
    [staffs],
  );

  const shiftRequestId = staffIds[0] ?? "";

  if (staffsLoading) {
    return <PageLoadingBar />;
  }

  if (staffIds.length === 0) {
    return (
      <Page title="シフト調整(共同)" width="full" showDefaultHeader={false}>
        <PageContent width="full" className="px-1.5 py-1 sm:px-2.5">
          <div className="rounded-[28px] border border-emerald-500/15 bg-[linear-gradient(135deg,rgba(247,252,248,0.98)_0%,rgba(236,253,245,0.92)_58%,rgba(255,255,255,0.98)_100%)] p-4 shadow-[0_28px_60px_-42px_rgba(15,23,42,0.35)] md:p-5">
            <InlineAlert tone="info" icon={<InfoBadge />}>
              スタッフデータが見つかりません
            </InlineAlert>
          </div>
        </PageContent>
      </Page>
    );
  }

  return (
    <CollaborativeShiftProvider
      staffIds={staffIds}
      targetMonth={targetMonth}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      shiftRequestId={shiftRequestId}
      staffNameMap={staffNameMap}
    >
      <ShiftCollaborativePageInner
        staffs={staffs}
        staffNameMap={staffNameMap}
        targetMonth={targetMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />
    </CollaborativeShiftProvider>
  );
}
