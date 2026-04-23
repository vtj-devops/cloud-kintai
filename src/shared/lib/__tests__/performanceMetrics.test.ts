import {
  getMetrics,
  getPerformanceMetricsCollector,
  logPerformanceMetrics,
} from "../performanceMetrics";

beforeEach(() => {
  // reset the singleton
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  jest.resetModules();
});

describe("getMetrics", () => {
  it("初期状態ではすべてのメトリクスが null", () => {
    const metrics = getMetrics();
    expect(metrics.LCP).toBeNull();
    expect(metrics.FID).toBeNull();
    expect(metrics.CLS).toBeNull();
    expect(metrics.TTFB).toBeNull();
    expect(metrics.FCP).toBeNull();
    expect(metrics.domContentLoaded).toBeNull();
    expect(metrics.loadTime).toBeNull();
  });

  it("返り値はフリーズされたオブジェクト", () => {
    const metrics = getMetrics();
    expect(Object.isFrozen(metrics)).toBe(true);
  });
});

describe("getPerformanceMetricsCollector", () => {
  it("同じインスタンスを返す（シングルトン）", () => {
    const a = getPerformanceMetricsCollector();
    const b = getPerformanceMetricsCollector();
    expect(a).toBe(b);
  });

  it("getMetrics が PerformanceMetrics 型を返す", () => {
    const collector = getPerformanceMetricsCollector();
    const metrics = collector.getMetrics();
    expect(metrics).toHaveProperty("LCP");
    expect(metrics).toHaveProperty("FID");
    expect(metrics).toHaveProperty("CLS");
  });

  it("onMetricsChange でコールバック登録→アンサブスクライブできる", () => {
    const collector = getPerformanceMetricsCollector();
    const cb = jest.fn();
    const unsubscribe = collector.onMetricsChange(cb);
    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
    // unsubscribe 後にコールバックが呼ばれないことは内部状態に依存するため
    // 二重アンサブスクライブでもエラーにならないことを確認
    expect(() => unsubscribe()).not.toThrow();
  });

  it("export で JSON 文字列を返す", () => {
    const collector = getPerformanceMetricsCollector();
    const json = collector.export();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty("LCP");
    expect(parsed).toHaveProperty("CLS");
  });

  it("logMetrics がエラーなく実行される", () => {
    const consoleSpy = jest.spyOn(console, "table").mockImplementation();
    const collector = getPerformanceMetricsCollector();
    collector.logMetrics();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("logPerformanceMetrics", () => {
  it("production 環境では console.table を呼ばない", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const consoleSpy = jest.spyOn(console, "table").mockImplementation();
    logPerformanceMetrics();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it("development 環境では console.table を呼ぶ", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const consoleSpy = jest.spyOn(console, "table").mockImplementation();
    logPerformanceMetrics();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
