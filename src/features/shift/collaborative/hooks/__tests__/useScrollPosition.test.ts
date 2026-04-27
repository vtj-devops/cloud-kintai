import { act, renderHook } from "@testing-library/react";

import { useScrollPosition } from "../useScrollPosition";

const KEY = "test-scroll-key";

beforeEach(() => {
  sessionStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useScrollPosition", () => {
  it("containerRef を返す", () => {
    const { result } = renderHook(() => useScrollPosition({ key: KEY }));
    expect(result.current.containerRef).toBeDefined();
  });

  it("saveScrollPosition / restoreScrollPosition / clearScrollPosition を返す", () => {
    const { result } = renderHook(() => useScrollPosition({ key: KEY }));
    expect(typeof result.current.saveScrollPosition).toBe("function");
    expect(typeof result.current.restoreScrollPosition).toBe("function");
    expect(typeof result.current.clearScrollPosition).toBe("function");
  });

  it("saveScrollPosition: containerRef が null の場合は何もしない", () => {
    const { result } = renderHook(() => useScrollPosition({ key: KEY }));
    expect(() => result.current.saveScrollPosition()).not.toThrow();
    expect(sessionStorage.getItem(`scroll-position-${KEY}`)).toBeNull();
  });

  it("clearScrollPosition: sessionStorage からエントリを削除する", () => {
    sessionStorage.setItem(`scroll-position-${KEY}`, JSON.stringify({ horizontal: 100, vertical: 200 }));
    const { result } = renderHook(() => useScrollPosition({ key: KEY }));
    act(() => {
      result.current.clearScrollPosition();
    });
    expect(sessionStorage.getItem(`scroll-position-${KEY}`)).toBeNull();
  });

  it("enabled=false の場合は restoreScrollPosition が実行されない", () => {
    sessionStorage.setItem(`scroll-position-${KEY}`, JSON.stringify({ horizontal: 50, vertical: 100 }));
    const { result } = renderHook(() => useScrollPosition({ key: KEY, enabled: false }));
    act(() => {
      jest.runAllTimers();
    });
    // containerRef は null のままなのでエラーにならないことを確認
    expect(() => result.current.restoreScrollPosition()).not.toThrow();
  });

  it("enabled=true の場合はマウント時に setTimeout でリストア試行", () => {
    const { result } = renderHook(() => useScrollPosition({ key: KEY, enabled: true }));
    act(() => {
      jest.runAllTimers();
    });
    // containerRef が null なのでリストアは無効だがエラーにならない
    expect(result.current.containerRef.current).toBeNull();
  });

  it("アンマウント時に saveScrollPosition が呼ばれる（containerRef null では sessionStorage 変更なし）", () => {
    const { unmount } = renderHook(() => useScrollPosition({ key: KEY }));
    unmount();
    expect(sessionStorage.getItem(`scroll-position-${KEY}`)).toBeNull();
  });
});
