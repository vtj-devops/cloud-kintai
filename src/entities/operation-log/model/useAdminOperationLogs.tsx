import {
  ModelOperationLogFilterInput,
  OperationLog,
} from "@shared/api/graphql/types";
import dayjs from "dayjs";
import { useCallback, useState } from "react";

import fetchOperationLogs from "./fetchOperationLogsAdmin";

const toError = (err: unknown) => {
  if (err instanceof Error) {
    return err;
  }

  if (typeof err === "string") {
    return new Error(err);
  }

  if (err && typeof err === "object") {
    const record = err as Record<string, unknown>;
    const message = record.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return new Error(message);
    }

    const errors = record.errors;
    if (Array.isArray(errors)) {
      const first = errors[0] as { message?: unknown } | undefined;
      if (
        typeof first?.message === "string" &&
        first.message.trim().length > 0
      ) {
        return new Error(first.message);
      }
    }
  }

  return new Error("ログの取得に失敗しました。");
};

export default function useAdminOperationLogs(
  initialLimit = 30,
  filter?: ModelOperationLogFilterInput | null,
) {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [excludedInvalidRecords, setExcludedInvalidRecords] = useState(false);
  const [excludedInvalidRecordCount, setExcludedInvalidRecordCount] =
    useState(0);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOperationLogs(null, initialLimit, filter);
      // ensure newest-first order by timestamp
      const sorted = res.items.toSorted((a, b) => {
        // Use timestamp when available, otherwise fall back to createdAt.
        const ta = dayjs(a.timestamp ?? a.createdAt).valueOf() || 0;
        const tb = dayjs(b.timestamp ?? b.createdAt).valueOf() || 0;
        return tb - ta;
      });
      setLogs(sorted);
      setExcludedInvalidRecords(Boolean(res.excludedInvalidRecords));
      setExcludedInvalidRecordCount(res.excludedInvalidRecordCount ?? 0);
      setNextToken(res.nextToken ?? null);
      return res.items;
    } catch (err) {
      setError(toError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filter, initialLimit]);

  const loadMore = useCallback(async () => {
    if (!nextToken) return [] as OperationLog[];
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOperationLogs(nextToken, initialLimit, filter);
      setExcludedInvalidRecords(
        (prev) => prev || Boolean(res.excludedInvalidRecords),
      );
      setExcludedInvalidRecordCount(
        (prev) => prev + (res.excludedInvalidRecordCount ?? 0),
      );
      setLogs((prev) => {
        const merged = [...prev, ...res.items];
        // sort merged list newest-first; prefer timestamp, then createdAt
        return merged.toSorted((a, b) => {
          const ta = dayjs(a.timestamp ?? a.createdAt).valueOf() || 0;
          const tb = dayjs(b.timestamp ?? b.createdAt).valueOf() || 0;
          return tb - ta;
        });
      });
      setNextToken(res.nextToken ?? null);
      return res.items;
    } catch (err) {
      setError(toError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filter, nextToken, initialLimit]);

  return {
    logs,
    excludedInvalidRecords,
    excludedInvalidRecordCount,
    loading,
    error,
    nextToken,
    loadInitial,
    loadMore,
  };
}
