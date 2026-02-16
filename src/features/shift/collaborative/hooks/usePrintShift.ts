import { useCallback, useRef, useState } from "react";

/**
 * 印刷用フック
 * @description
 * シフト調整テーブルの印刷機能を管理
 */
export const usePrintShift = () => {
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const printWindowRef = useRef<Window | null>(null);

  /**
   * 印刷ダイアログを開く
   */
  const openPrintDialog = useCallback(() => {
    setIsPrintDialogOpen(true);
  }, []);

  /**
   * 印刷ダイアログを閉じる
   */
  const closePrintDialog = useCallback(() => {
    setIsPrintDialogOpen(false);
  }, []);

  /**
   * HTML文字列の印刷
   */
  const printHtml = useCallback(
    (html: string, _title: string = "シフト調整表") => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        console.error("Print window could not be opened");
        return;
      }

      printWindowRef.current = printWindow;

      // HTML文字列を出力ウィンドウに書き込む
      printWindow.document.write(html);
      printWindow.document.close();

      // ウィンドウが読み込まれた後に印刷を実行
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };

      // ウィンドウが閉じられたらリファレンスをクリア
      printWindow.onunload = () => {
        printWindowRef.current = null;
      };
    },
    [],
  );

  /**
   * 印刷前のバリデーション
   */
  const validatePrintData = useCallback(
    (
      days: unknown[],
      staffs: unknown[],
      shiftDataMap: Map<unknown, unknown>,
    ): boolean => {
      if (!Array.isArray(days) || days.length === 0) {
        console.error("No days data available");
        return false;
      }

      if (!Array.isArray(staffs) || staffs.length === 0) {
        console.error("No staffs data available");
        return false;
      }

      if (!shiftDataMap || !(shiftDataMap instanceof Map)) {
        console.error("Invalid shift data map");
        return false;
      }

      return true;
    },
    [],
  );

  return {
    isPrintDialogOpen,
    openPrintDialog,
    closePrintDialog,
    printHtml,
    validatePrintData,
  };
};
