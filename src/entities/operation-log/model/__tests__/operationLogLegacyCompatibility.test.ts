import type { OperationLog } from "@shared/api/graphql/types";

import {
  buildSafeResourceKeyFilter,
  extractInvalidResourceKeyItemCount,
  hasNullableResourceKeyError,
  normalizeLegacyOperationLog,
  parseOperationLogJsonLike,
} from "../operationLogLegacyCompatibility";

const baseLog: OperationLog = {
  __typename: "OperationLog",
  id: "log-1",
  action: "attendance.update",
  timestamp: "2026-04-01T00:00:00.000Z",
  resource: "attendance",
  resourceId: "attendance-1",
  resourceKey: "attendance#attendance-1",
  logFormatVersion: 1,
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

describe("operationLogLegacyCompatibility", () => {
  it("detects nullable resourceKey GraphQL errors", () => {
    expect(
      hasNullableResourceKeyError([
        {
          message:
            "Cannot return null for non-nullable type: 'String' within parent 'OperationLog'",
        },
      ]),
    ).toBe(true);
  });

  it("returns false for no errors", () => {
    expect(hasNullableResourceKeyError([])).toBe(false);
    expect(hasNullableResourceKeyError(undefined)).toBe(false);
  });

  it("normalizes legacy log fields", () => {
    const normalized = normalizeLegacyOperationLog({
      ...baseLog,
      resourceKey: "",
      details: { summary: "x" } as unknown as string,
      metadata: { source: "legacy" } as unknown as string,
    });

    expect(normalized.resourceKey).toBe("attendance#attendance-1");
    expect(normalized.details).toBe('{"summary":"x"}');
    expect(normalized.metadata).toBe('{"source":"legacy"}');
  });

  it("parses JSON-like values from string and object", () => {
    expect(parseOperationLogJsonLike('{"x":1}')).toEqual({ x: 1 });
    expect(parseOperationLogJsonLike({ x: 1 })).toEqual({ x: 1 });
    expect(parseOperationLogJsonLike("invalid json")).toBeNull();
  });

  it("parses null/undefined as null", () => {
    expect(parseOperationLogJsonLike(null)).toBeNull();
    expect(parseOperationLogJsonLike(undefined)).toBeNull();
  });
});

describe("extractInvalidResourceKeyItemCount", () => {
  it("returns 0 when no errors", () => {
    expect(extractInvalidResourceKeyItemCount(undefined)).toBe(0);
    expect(extractInvalidResourceKeyItemCount([])).toBe(0);
  });

  it("counts unique item indices with resourceKey errors", () => {
    const errors = [
      { message: "/listOperationLogs/items[0]/resourceKey" },
      { message: "/listOperationLogs/items[2]/resourceKey" },
      { message: "/listOperationLogs/items[0]/resourceKey" },
    ];
    expect(extractInvalidResourceKeyItemCount(errors)).toBe(2);
  });

  it("ignores errors without matching pattern", () => {
    expect(extractInvalidResourceKeyItemCount([{ message: "some other error" }])).toBe(0);
  });
});

describe("buildSafeResourceKeyFilter", () => {
  it("filter が null のとき VALID_RESOURCE_KEY_FILTER を返す", () => {
    const result = buildSafeResourceKeyFilter(null);
    expect(result).toHaveProperty("resourceKey");
  });

  it("filter が undefined のとき VALID_RESOURCE_KEY_FILTER を返す", () => {
    const result = buildSafeResourceKeyFilter(undefined);
    expect(result).toHaveProperty("resourceKey");
  });

  it("filter があるとき and 条件を返す", () => {
    const filter = { staffId: { eq: "s-1" } };
    const result = buildSafeResourceKeyFilter(filter as never);
    expect(result).toHaveProperty("and");
  });
});
