/**
 * @file performanceMetrics.ts
 * @description アプリケーションのパフォーマンスメトリクスを計測・追跡するユーティリティ。
 * バンドルサイズとランタイムパフォーマンスの両方をカバー。
 */

/**
 * パフォーマンスメトリクス
 */
export type PerformanceMetrics = {
  // Core Web Vitals
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift

  // Additional metrics
  TTFB: number | null; // Time to First Byte
  FCP: number | null; // First Contentful Paint
  domContentLoaded: number | null;
  loadTime: number | null;
};

type MetricCallback = (metrics: PerformanceMetrics) => void;

class PerformanceMetricsCollector {
  private metrics: PerformanceMetrics = {
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    FCP: null,
    domContentLoaded: null,
    loadTime: null,
  };

  private callbacks: MetricCallback[] = [];

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // Core Web Vitals の計測
    this.measureLCP();
    this.measureFID();
    this.measureCLS();

    // Navigation Timing API を使用したメトリクス計測
    if ("PerformanceObserver" in window) {
      this.measureNavigationTiming();
    }
  }

  /**
   * Largest Contentful Paint を計測
   */
  private measureLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
        this.metrics.LCP = lastEntry.startTime;
        this.notifyCallbacks();
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch {
      // ブラウザが PerformanceObserver をサポートしていない場合
    }
  }

  /**
   * First Input Delay を計測
   */
  private measureFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const entry = entries[0];
          this.metrics.FID = (entry as PerformanceEventTiming).duration;
          this.notifyCallbacks();
        }
      });

      observer.observe({ entryTypes: ["first-input"] });
    } catch {
      // ブラウザが PerformanceObserver をサポートしていない場合
    }
  }

  /**
   * Cumulative Layout Shift を計測
   */
  private measureCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!("hadRecentInput" in entry) || !entry.hadRecentInput) {
            clsValue += (entry as PerformanceEntry & { value: number }).value;
            this.metrics.CLS = clsValue;
            this.notifyCallbacks();
          }
        }
      });

      observer.observe({ entryTypes: ["layout-shift"] });
    } catch {
      // ブラウザが PerformanceObserver をサポートしていない場合
    }
  }

  /**
   * Navigation Timing API を使用したメトリクスを計測
   */
  private measureNavigationTiming() {
    window.addEventListener("load", () => {
      const perfData = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;

      if (perfData) {
        this.metrics.TTFB = perfData.responseStart - perfData.requestStart;
        this.metrics.FCP =
          performance.getEntriesByName("first-contentful-paint").at(0)
            ?.startTime ?? null;
        this.metrics.domContentLoaded = perfData.domContentLoadedEventEnd;
        this.metrics.loadTime = perfData.loadEventEnd;
        this.notifyCallbacks();
      }
    });
  }

  /**
   * 計測結果をコールバックで通知
   */
  private notifyCallbacks() {
    this.callbacks.forEach((callback) => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error("Error in performance metric callback:", error);
      }
    });
  }

  /**
   * 現在のメトリクスを取得
   */
  getMetrics(): Readonly<PerformanceMetrics> {
    return Object.freeze({ ...this.metrics });
  }

  /**
   * メトリクス変更時のコールバックを登録
   */
  onMetricsChange(callback: MetricCallback): () => void {
    this.callbacks.push(callback);

    // アンサブスクライブ関数を返す
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks = this.callbacks.toSpliced(index, 1);
      }
    };
  }

  /**
   * メトリクスをコンソールに出力
   */
  logMetrics() {
    console.table({
      "Largest Contentful Paint (ms)": this.metrics.LCP,
      "First Input Delay (ms)": this.metrics.FID,
      "Cumulative Layout Shift": this.metrics.CLS,
      "Time to First Byte (ms)": this.metrics.TTFB,
      "First Contentful Paint (ms)": this.metrics.FCP,
      "DOM Content Loaded (ms)": this.metrics.domContentLoaded,
      "Load Time (ms)": this.metrics.loadTime,
    });
  }

  /**
   * メトリクスを JSON 形式でエクスポート
   */
  export(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// グローバルインスタンス
let instance: PerformanceMetricsCollector | null = null;

/**
 * パフォーマンスメトリクス収集インスタンスを取得
 */
export function getPerformanceMetricsCollector(): PerformanceMetricsCollector {
  if (!instance) {
    instance = new PerformanceMetricsCollector();
  }
  return instance;
}

/**
 * 現在のパフォーマンスメトリクスを取得
 */
export function getMetrics(): Readonly<PerformanceMetrics> {
  return getPerformanceMetricsCollector().getMetrics();
}

/**
 * パフォーマンスメトリクスを開発環境のコンソールに出力
 */
export function logPerformanceMetrics() {
  if (process.env.NODE_ENV !== "production") {
    getPerformanceMetricsCollector().logMetrics();
  }
}
