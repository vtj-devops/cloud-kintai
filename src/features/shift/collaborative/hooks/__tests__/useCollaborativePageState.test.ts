import { act, renderHook } from "@testing-library/react";

import { useCollaborativePageState } from "../useCollaborativePageState";

const mockUseCollaborativeShift = jest.fn();
const mockUseShiftCalendar = jest.fn();
const mockUseSelectionState = jest.fn();
const mockUseShiftSuggestions = jest.fn();
const mockUseShiftMetrics = jest.fn();
const mockGraphql = jest.fn();

jest.mock("../../context/CollaborativeShiftContext", () => ({
  useCollaborativeShift: () => mockUseCollaborativeShift(),
}));

jest.mock("../useShiftCalendar", () => ({
  useShiftCalendar: (...args: unknown[]) => mockUseShiftCalendar(...args),
}));

jest.mock("../useSelectionState", () => ({
  useSelectionState: (...args: unknown[]) => mockUseSelectionState(...args),
}));

jest.mock("../useShiftSuggestions", () => ({
  useShiftSuggestions: (...args: unknown[]) => mockUseShiftSuggestions(...args),
}));

jest.mock("../useShiftMetrics", () => ({
  useShiftMetrics: (...args: unknown[]) => mockUseShiftMetrics(...args),
}));

jest.mock("@entities/calendar/api/calendarApi", () => ({
  useGetCompanyHolidayCalendarsQuery: () => ({ data: [] }),
  useGetEventCalendarsQuery: () => ({ data: [] }),
  useGetHolidayCalendarsQuery: () => ({ data: [] }),
}));

jest.mock("@/shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: (...args: unknown[]) => mockGraphql(...args),
  },
}));

describe("useCollaborativePageState", () => {
  const mockUpdateShift = jest.fn();
  const mockBatchUpdateShifts = jest.fn();
  const mockStartEditingCell = jest.fn();
  const mockStopEditingCell = jest.fn();
  const mockUpdateUserActivity = jest.fn();

  const buildState = ({
    isOnline = true,
    connectionState = "connected",
    hasEditLock = true,
    shiftDataMap = new Map([
      ["staff-1", new Map([["01", { state: "work", isLocked: false }]])],
    ]),
  } = {}) => ({
    state: {
      shiftDataMap,
      activeUsers: [],
      editingCells: new Map(),
      pendingChanges: new Map(),
      selectedCells: new Set(),
      isLoading: false,
      isSyncing: false,
      lastSyncedAt: 0,
      lastAutoSyncedAt: 0,
      dataStatus: "idle",
      error: null,
      connectionState,
      isOnline,
      lastRemoteUpdate: null,
    },
    updateShift: mockUpdateShift,
    batchUpdateShifts: mockBatchUpdateShifts,
    isBatchUpdating: false,
    startEditingCell: mockStartEditingCell,
    stopEditingCell: mockStopEditingCell,
    isCellBeingEdited: jest.fn(() => false),
    hasEditLock: jest.fn(() => hasEditLock),
    getCellEditor: jest.fn(),
    forceReleaseCell: jest.fn(),
    getAllEditingCells: jest.fn(() => []),
    refreshLocks: jest.fn(),
    triggerSync: jest.fn(),
    clearSyncError: jest.fn(),
    updateUserActivity: mockUpdateUserActivity,
    retryPendingChanges: jest.fn(),
    getCellHistory: jest.fn(() => []),
    getAllCellHistory: jest.fn(() => []),
    addComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    getCommentsByCell: jest.fn(() => []),
    replyToComment: jest.fn(),
    deleteCommentReply: jest.fn(),
    getStaffCellHistory: jest.fn(() => []),
  });

  beforeEach(() => {
    mockUpdateShift.mockReset();
    mockBatchUpdateShifts.mockReset();
    mockStartEditingCell.mockReset();
    mockStopEditingCell.mockReset();
    mockUpdateUserActivity.mockReset();
    mockGraphql.mockReset();
    mockGraphql.mockReturnValue(new Promise(() => undefined));

    mockUseShiftCalendar.mockReturnValue({
      days: [],
      dateKeys: ["01", "02"],
      eventCalendar: [],
    });

    mockUseShiftSuggestions.mockReturnValue({
      violations: [],
      isAnalyzing: false,
      analyzeShifts: jest.fn(),
    });

    mockUseShiftMetrics.mockReturnValue({
      calculateDailyCount: jest.fn(() => ({
        work: 0,
        fixedOff: 0,
        requestedOff: 0,
        plannedCapacity: 0,
      })),
      progress: {
        confirmedCount: 0,
        confirmedPercent: 0,
        needsAdjustmentCount: 0,
        adjustmentPercent: 0,
        emptyCount: 0,
      },
    });

    mockUseSelectionState.mockReturnValue({
      focusedCell: { staffId: "staff-1", date: "01" },
      registerCell: jest.fn(),
      focusCell: jest.fn(),
      navigate: jest.fn(),
      clearFocus: jest.fn(),
      selectedCells: [],
      selectionCount: 0,
      isCellSelected: jest.fn(() => false),
      selectCell: jest.fn(),
      toggleCell: jest.fn(),
      selectRange: jest.fn(),
      startDragSelect: jest.fn(),
      updateDragSelect: jest.fn(),
      endDragSelect: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
      isDragging: false,
    });

    mockUseCollaborativeShift.mockReturnValue(buildState());
  });

  it("通信断中は単一セル更新をブロックする", async () => {
    mockUseCollaborativeShift.mockReturnValue(
      buildState({ isOnline: false, connectionState: "connected" }),
    );

    const { result } = renderHook(() => useCollaborativePageState("2026-02"));

    await act(async () => {
      result.current.handleChangeState("fixedOff");
      await Promise.resolve();
    });

    expect(mockUpdateShift).not.toHaveBeenCalled();
    expect(mockStopEditingCell).not.toHaveBeenCalled();
    expect(result.current.editLockError).toBe(
      "通信が切断されています。再接続後に編集を再開してください。",
    );
  });

  it("接続断状態ではロック取得をブロックする", async () => {
    mockUseCollaborativeShift.mockReturnValue(
      buildState({
        isOnline: true,
        connectionState: "disconnected",
        hasEditLock: false,
      }),
    );

    const { result } = renderHook(() => useCollaborativePageState("2026-02"));

    await act(async () => {
      result.current.handleAcquireEditLock();
    });

    expect(mockStartEditingCell).not.toHaveBeenCalled();
    expect(result.current.editLockError).toBe(
      "通信が切断されています。再接続後に編集を再開してください。",
    );
  });

  it("単一セルの状態変更成功後に編集ロックを解除する", async () => {
    mockUpdateShift.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCollaborativePageState("2026-02"));

    await act(async () => {
      result.current.handleChangeState("fixedOff");
      await Promise.resolve();
    });

    expect(mockUpdateUserActivity).toHaveBeenCalled();
    expect(mockUpdateShift).toHaveBeenCalledWith({
      staffId: "staff-1",
      date: "01",
      newState: "fixedOff",
    });
    expect(mockStopEditingCell).toHaveBeenCalledWith("staff-1", "01");
  });

  it("一括状態変更成功後に更新対象セルの編集ロックを解除する", async () => {
    mockBatchUpdateShifts.mockResolvedValue(undefined);
    mockUseSelectionState.mockReturnValue({
      focusedCell: { staffId: "staff-1", date: "01" },
      registerCell: jest.fn(),
      focusCell: jest.fn(),
      navigate: jest.fn(),
      clearFocus: jest.fn(),
      selectedCells: [
        { staffId: "staff-1", date: "01" },
        { staffId: "staff-2", date: "02" },
      ],
      selectionCount: 2,
      isCellSelected: jest.fn(() => false),
      selectCell: jest.fn(),
      toggleCell: jest.fn(),
      selectRange: jest.fn(),
      startDragSelect: jest.fn(),
      updateDragSelect: jest.fn(),
      endDragSelect: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
      isDragging: false,
    });
    mockUseCollaborativeShift.mockReturnValue(
      buildState({
        shiftDataMap: new Map([
          ["staff-1", new Map([["01", { state: "work", isLocked: false }]])],
          ["staff-2", new Map([["02", { state: "work", isLocked: false }]])],
        ]),
      }),
    );

    const { result } = renderHook(() => useCollaborativePageState("2026-02"));

    await act(async () => {
      result.current.handleChangeState("fixedOff");
      await Promise.resolve();
    });

    expect(mockBatchUpdateShifts).toHaveBeenCalledWith([
      { staffId: "staff-1", date: "01", newState: "fixedOff" },
      { staffId: "staff-2", date: "02", newState: "fixedOff" },
    ]);
    expect(mockStopEditingCell).toHaveBeenNthCalledWith(1, "staff-1", "01");
    expect(mockStopEditingCell).toHaveBeenNthCalledWith(2, "staff-2", "02");
  });

  it("状態変更失敗時は編集ロックを解除しない", async () => {
    mockUpdateShift.mockRejectedValue(new Error("update failed"));
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      const { result } = renderHook(() => useCollaborativePageState("2026-02"));

      await act(async () => {
        result.current.handleChangeState("fixedOff");
        await Promise.resolve();
      });

      expect(mockUpdateShift).toHaveBeenCalled();
      expect(mockStopEditingCell).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("編集ロック未取得時は状態変更も解除も行わない", async () => {
    mockUseCollaborativeShift.mockReturnValue(
      buildState({ hasEditLock: false }),
    );

    const { result } = renderHook(() => useCollaborativePageState("2026-02"));

    await act(async () => {
      result.current.handleChangeState("fixedOff");
      await Promise.resolve();
    });

    expect(mockUpdateShift).not.toHaveBeenCalled();
    expect(mockStopEditingCell).not.toHaveBeenCalled();
    expect(result.current.editLockError).toBe(
      "編集前にロックを取得してください。",
    );
  });
});
