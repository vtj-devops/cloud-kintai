import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 自動保存フックのオプション
 */
export interface UseAutoSaveOptions<T> {
  /**
   * データを保存する関数
   */
  saveFn: (data: T) => Promise<void>;

  /**
   * データの変更を検知するために比較する値
   */
  data: T;

  /**
   * 自動保存を有効にするかどうか (デフォルト: true)
   */
  enabled?: boolean;

  /**
   * debounce の遅延時間（ミリ秒、デフォルト: 2000）
   */
  delay?: number;

  /**
   * データの等価性を判定する関数（デフォルト: JSON.stringify による比較）
   */
  isEqual?: (prev: T, next: T) => boolean;

  /**
   * 保存成功時のコールバック
   */
  onSaveSuccess?: () => void;

  /**
   * 保存失敗時のコールバック
   */
  onSaveError?: (error: Error) => void;
}

/**
 * 自動保存フックの戻り値
 */
export interface UseAutoSaveReturn {
  /**
   * 現在保存中かどうか
   */
  isSaving: boolean;

  /**
   * 最後に保存が成功した日時
   */
  lastSavedAt: Date | null;

  /**
   * 保存待ちの変更があるかどうか
   */
  isPending: boolean;

  /**
   * 最後に変更を検知した日時
   */
  lastChangedAt: Date | null;

  /**
   * 即座に保存を実行する
   */
  saveNow: () => Promise<void>;

  /**
   * 最後のエラー
   */
  lastError: Error | null;
}

const defaultIsEqual = <T>(prev: T, next: T): boolean => {
  try {
    return JSON.stringify(prev) === JSON.stringify(next);
  } catch {
    return prev === next;
  }
};

/**
 * データの変更を自動的に保存する汎用フック
 *
 * @example
 * ```tsx
 * const { isSaving, lastSavedAt, isPending } = useAutoSave({
 *   saveFn: async (data) => {
 *     await saveToServer(data);
 *   },
 *   data: formData,
 *   delay: 2000,
 *   onSaveSuccess: () => {
 *     showSnackbar('保存しました');
 *   },
 *   onSaveError: (error) => {
 *     showSnackbar(`保存に失敗しました: ${error.message}`);
 *   },
 * });
 * ```
 */
export function useAutoSave<T>({
  saveFn,
  data,
  enabled = true,
  delay = 2000,
  isEqual = defaultIsEqual,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [lastChangedAt, setLastChangedAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<T | null>(null);
  const isFirstRenderRef = useRef(true);
  const isFirstEnabledRef = useRef(true);
  const savingPromiseRef = useRef<Promise<void> | null>(null);
  const isSavingRef = useRef(false);
  const saveFnRef = useRef(saveFn);
  const onSaveSuccessRef = useRef(onSaveSuccess);
  const onSaveErrorRef = useRef(onSaveError);

  // 最新のコールバックを保持
  useEffect(() => {
    saveFnRef.current = saveFn;
    onSaveSuccessRef.current = onSaveSuccess;
    onSaveErrorRef.current = onSaveError;
  }, [saveFn, onSaveSuccess, onSaveError]);

  const save = useCallback(async (dataToSave: T) => {
    if (isSavingRef.current) {
      // 既に保存中の場合は、その処理が終わるまで待つ
      if (savingPromiseRef.current) {
        await savingPromiseRef.current;
      }
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setIsPending(false);
    setLastError(null);

    const savingPromise = (async () => {
      try {
        await saveFnRef.current(dataToSave);
        lastSavedDataRef.current = dataToSave;
        setLastSavedAt(new Date());
        onSaveSuccessRef.current?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLastError(err);
        onSaveErrorRef.current?.(err);
        throw err;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
        savingPromiseRef.current = null;
      }
    })();

    savingPromiseRef.current = savingPromise;
    return savingPromise;
  }, []);

  const saveNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await save(data);
  }, [data, save]);

  useEffect(() => {
    // 初回レンダリング時は保存しない
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      lastSavedDataRef.current = data;
      return;
    }

    // 無効化されている場合は何もしない
    if (!enabled) {
      return;
    }

    // enabled が最初に true になった時は、現在のデータを基準値として保存するだけ
    if (isFirstEnabledRef.current) {
      isFirstEnabledRef.current = false;
      lastSavedDataRef.current = data;
      return;
    }

    // データが変更されていない場合は何もしない
    if (
      lastSavedDataRef.current !== null &&
      isEqual(lastSavedDataRef.current, data)
    ) {
      return;
    }

    // 既存のタイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 保存待ち状態にする
    setIsPending(true);
    setLastChangedAt(new Date());

    // debounce タイマーをセット
    timerRef.current = setTimeout(() => {
      void save(data).catch(() => undefined);
    }, delay);

    // クリーンアップ
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [data, delay, enabled, isEqual]);

  return {
    isSaving,
    lastSavedAt,
    isPending,
    lastChangedAt,
    saveNow,
    lastError,
  };
}
