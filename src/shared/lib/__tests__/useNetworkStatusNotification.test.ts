import {
  dismissNotification,
  pushNotification,
} from "@shared/lib/store/notificationSlice";
import { renderHook } from "@testing-library/react";

import { useNetworkStatusNotification } from "../useNetworkStatusNotification";
import { useOnlineStatus } from "../useOnlineStatus";

jest.mock("@app/hooks", () => ({
  useAppDispatchV2: jest.fn(),
}));

jest.mock("../useOnlineStatus", () => ({
  useOnlineStatus: jest.fn(),
}));

describe("useNetworkStatusNotification", () => {
  const dispatch = jest.fn();
  const mockUseOnlineStatus = useOnlineStatus as jest.MockedFunction<
    typeof useOnlineStatus
  >;

  beforeEach(() => {
    jest.resetAllMocks();
    const { useAppDispatchV2 } = jest.requireMock("@app/hooks");
    useAppDispatchV2.mockReturnValue(dispatch);
  });

  it("初回オンライン時は通知しない", () => {
    mockUseOnlineStatus.mockReturnValue(true);

    renderHook(() => useNetworkStatusNotification());

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("初回オフライン時は error 通知を dispatch する", () => {
    mockUseOnlineStatus.mockReturnValue(false);

    renderHook(() => useNetworkStatusNotification());

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: pushNotification({
          id: "network-status-offline",
          dedupeKey: "network-status-offline",
          tone: "error",
          message: "オフラインです。ネットワーク接続を確認してください。",
        }).type,
        payload: expect.objectContaining({
          id: "network-status-offline",
          dedupeKey: "network-status-offline",
          tone: "error",
          message: "オフラインです。ネットワーク接続を確認してください。",
          placement: "top-right",
          autoHideMs: null,
          source: "global",
        }),
      }),
    );
  });

  it("online から offline への遷移で success を閉じて error 通知を出す", () => {
    mockUseOnlineStatus.mockReturnValue(true);

    const { rerender } = renderHook(() => useNetworkStatusNotification());

    dispatch.mockClear();
    mockUseOnlineStatus.mockReturnValue(false);
    rerender();

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      dismissNotification("network-status-online"),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: pushNotification({
          id: "network-status-offline",
          dedupeKey: "network-status-offline",
          tone: "error",
          message: "オフラインです。ネットワーク接続を確認してください。",
        }).type,
        payload: expect.objectContaining({
          id: "network-status-offline",
          dedupeKey: "network-status-offline",
          tone: "error",
          message: "オフラインです。ネットワーク接続を確認してください。",
        }),
      }),
    );
  });

  it("offline から online への遷移で error を閉じて success 通知を出す", () => {
    mockUseOnlineStatus.mockReturnValue(false);

    const { rerender } = renderHook(() => useNetworkStatusNotification());

    dispatch.mockClear();
    mockUseOnlineStatus.mockReturnValue(true);
    rerender();

    expect(dispatch).toHaveBeenNthCalledWith(
      1,
      dismissNotification("network-status-offline"),
    );
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: pushNotification({
          id: "network-status-online",
          dedupeKey: "network-status-online",
          tone: "success",
          message: "ネットワークに再接続しました。",
        }).type,
        payload: expect.objectContaining({
          id: "network-status-online",
          dedupeKey: "network-status-online",
          tone: "success",
          message: "ネットワークに再接続しました。",
          placement: "top-right",
          autoHideMs: 5000,
          source: "global",
        }),
      }),
    );
  });

  it("同じ状態が続く場合は追加通知しない", () => {
    mockUseOnlineStatus.mockReturnValue(true);

    const { rerender } = renderHook(() => useNetworkStatusNotification());

    dispatch.mockClear();
    rerender();

    expect(dispatch).not.toHaveBeenCalled();
  });
});
