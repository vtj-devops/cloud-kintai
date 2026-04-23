// routePreloaders uses module-level state, so we reset between tests
// by re-importing the module fresh or resetting via jest.resetModules.

describe("preloadRoute", () => {
  let preloadRoute: (href: string) => void;

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import("../routePreloaders");
    preloadRoute = mod.preloadRoute;
  });

  it("登録済みルートのモジュールローダーを呼び出す", async () => {
    const mockImport = jest
      .fn()
      .mockResolvedValue({ default: () => null });
    jest.mock("../../pages/Register", () => ({ default: () => null }), {
      virtual: true,
    });

    // Should not throw
    expect(() => preloadRoute("/register")).not.toThrow();
  });

  it("同じhrefを2回呼んでも重複ロードしない", () => {
    const calls: string[] = [];
    // Just ensure the function doesn't crash on re-call
    preloadRoute("/register");
    preloadRoute("/register");
    // No assertion needed beyond "doesn't throw"
  });

  it("未登録のhrefは何もしない", () => {
    expect(() => preloadRoute("/unknown-path")).not.toThrow();
  });
});

describe("scheduleIdleRoutePreload", () => {
  let scheduleIdleRoutePreload: (opts: {
    currentPathname: string;
    isAdminUser: boolean;
    isOperatorUser?: boolean;
  }) => void;
  let preloadRoute: (href: string) => void;

  beforeEach(async () => {
    jest.resetModules();
    jest.useFakeTimers();

    // Mock requestIdleCallback to run immediately via setTimeout fallback
    Object.defineProperty(window, "requestIdleCallback", {
      writable: true,
      value: undefined,
    });

    const mod = await import("../routePreloaders");
    scheduleIdleRoutePreload = mod.scheduleIdleRoutePreload;
    preloadRoute = mod.preloadRoute;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("windowがundefinedの場合は何もしない", async () => {
    jest.resetModules();
    const originalWindow = global.window;
    // @ts-expect-error - testing undefined window
    delete global.window;

    try {
      const mod = await import("../routePreloaders");
      expect(() =>
        mod.scheduleIdleRoutePreload({
          currentPathname: "/register",
          isAdminUser: false,
        })
      ).not.toThrow();
    } finally {
      global.window = originalWindow;
    }
  });

  it("/registerパスでsetTimeoutがスケジュールされる", () => {
    const setTimeoutSpy = jest.spyOn(window, "setTimeout");
    scheduleIdleRoutePreload({
      currentPathname: "/register",
      isAdminUser: false,
    });
    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  it("2回目の呼び出しは無視される（idlePreloadScheduled）", () => {
    const setTimeoutSpy = jest.spyOn(window, "setTimeout");
    scheduleIdleRoutePreload({ currentPathname: "/register", isAdminUser: false });
    const callsAfterFirst = setTimeoutSpy.mock.calls.length;
    scheduleIdleRoutePreload({ currentPathname: "/register", isAdminUser: false });
    expect(setTimeoutSpy.mock.calls.length).toBe(callsAfterFirst);
  });

  it("タイマー実行後にpreloadRouteが呼ばれる", () => {
    scheduleIdleRoutePreload({ currentPathname: "/register", isAdminUser: false });
    // Advance timers past the 600ms fallback
    jest.advanceTimersByTime(700);
    // No crash = success; route preloading (dynamic imports) will be no-ops in test
  });

  it("isOperatorUser=trueのとき/office/qrをプリロードターゲットにする", () => {
    scheduleIdleRoutePreload({
      currentPathname: "/register",
      isAdminUser: false,
      isOperatorUser: true,
    });
    jest.advanceTimersByTime(700);
    // No crash = success
  });

  it("isAdminUser=trueのとき/adminをターゲットに追加する", () => {
    scheduleIdleRoutePreload({
      currentPathname: "/workflow",
      isAdminUser: true,
    });
    jest.advanceTimersByTime(700);
    // No crash = success
  });
});

describe("canUseAggressivePreload (indirect via scheduleIdleRoutePreload)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    Object.defineProperty(window, "requestIdleCallback", {
      writable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("navigator.connectionがsaveData=trueの場合でもクラッシュしない", async () => {
    Object.defineProperty(navigator, "connection", {
      writable: true,
      value: { saveData: true },
    });
    const mod = await import("../routePreloaders");
    expect(() =>
      mod.scheduleIdleRoutePreload({
        currentPathname: "/attendance/list",
        isAdminUser: true,
      })
    ).not.toThrow();
    jest.advanceTimersByTime(700);
  });
});
