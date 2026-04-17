import type { CellChangeSource } from "../types/collaborative.types";

export const CELL_CHANGE_SOURCE_LABELS: Record<CellChangeSource, string> = {
  manual: "手動",
  batch: "一括",
  "conflict-resolution": "競合解決",
  remote: "他ユーザー",
  "db-history": "履歴",
};

export const CELL_CHANGE_SOURCE_COLORS: Record<
  CellChangeSource,
  "default" | "primary" | "secondary" | "warning" | "info" | "error"
> = {
  manual: "primary",
  batch: "secondary",
  "conflict-resolution": "error",
  remote: "default",
  "db-history": "default",
};
