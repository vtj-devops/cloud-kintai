import { act, renderHook } from "@testing-library/react";

import { useOnlineStatus } from "../useOnlineStatus";

describe("useOnlineStatus", () => {
  const originalOnLineDescriptor = Object.getOwnPropertyDescriptor(
    window.navigator,
    "onLine",
  );

  const setNavigatorOnLine = (value: boolean) => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value,
    });
  };

  afterEach(() => {
    if (originalOnLineDescriptor) {
      Object.defineProperty(window.navigator, "onLine", originalOnLineDescriptor);
      return;
    }

    Reflect.deleteProperty(window.navigator, "onLine");
  });

  it("初期値として navigator.onLine を反映する", () => {
    setNavigatorOnLine(false);

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  it("online イベントで true に更新する", () => {
    setNavigatorOnLine(false);

    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  it("offline イベントで false に更新する", () => {
    setNavigatorOnLine(true);

    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  it("アンマウント時にイベントリスナーを解除する", () => {
    const addEventListenerSpy = jest.spyOn(window, "addEventListener");
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useOnlineStatus());

    const onlineHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "online",
    )?.[1];
    const offlineHandler = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === "offline",
    )?.[1];

    unmount();

    expect(onlineHandler).toBeDefined();
    expect(offlineHandler).toBeDefined();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", onlineHandler);
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      offlineHandler,
    );

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
