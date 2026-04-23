import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: jest.fn(),
  },
}));

const mockGraphql = graphqlClient.graphql as jest.Mock;

describe("graphqlBaseQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("success cases", () => {
    it("returns data on successful query", async () => {
      mockGraphql.mockResolvedValue({ data: { user: { id: "1" } } });
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { user { id } }" });

      expect(result).toEqual({ data: { user: { id: "1" } } });
    });

    it("returns null data when result.data is undefined", async () => {
      mockGraphql.mockResolvedValue({ data: undefined });
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { noop }" });

      expect(result).toEqual({ data: null });
    });

    it("passes variables to graphqlClient", async () => {
      mockGraphql.mockResolvedValue({ data: {} });
      const fn = graphqlBaseQuery();
      await fn({ document: "query ($id: ID!) { item(id: $id) }", variables: { id: "123" } });

      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { id: "123" } }),
      );
    });

    it("uses defaultAuthMode when authMode not specified", async () => {
      mockGraphql.mockResolvedValue({ data: {} });
      const fn = graphqlBaseQuery({ defaultAuthMode: "iam" });
      await fn({ document: "query { noop }" });

      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({ authMode: "iam" }),
      );
    });

    it("overrides authMode per request", async () => {
      mockGraphql.mockResolvedValue({ data: {} });
      const fn = graphqlBaseQuery({ defaultAuthMode: "userPool" });
      await fn({ document: "query { noop }", authMode: "apiKey" });

      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({ authMode: "apiKey" }),
      );
    });

    it("defaults to userPool authMode when no defaultAuthMode provided", async () => {
      mockGraphql.mockResolvedValue({ data: {} });
      const fn = graphqlBaseQuery();
      await fn({ document: "query { noop }" });

      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({ authMode: "userPool" }),
      );
    });
  });

  describe("GraphQL errors in response", () => {
    it("returns error when result.errors is present", async () => {
      mockGraphql.mockResolvedValue({
        data: null,
        errors: [{ message: "Field not found" }],
      });
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { bad }" });

      expect(result).toEqual({
        error: {
          message: "GraphQL request failed",
          details: expect.arrayContaining([
            expect.objectContaining({ message: "Field not found" }),
          ]),
        },
      });
    });

    it("returns error with path when error has path", async () => {
      mockGraphql.mockResolvedValue({
        data: null,
        errors: [{ message: "Not found", path: ["user", "id"] }],
      });
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { user { id } }" }) as {
        error: { details: unknown[] };
      };

      expect((result.error.details as Array<Record<string, unknown>>)[0].path).toEqual(["user", "id"]);
    });

    it("returns error with errorType when present", async () => {
      mockGraphql.mockResolvedValue({
        data: null,
        errors: [{ message: "Unauthorized", errorType: "Unauthorized" }],
      });
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { secret }" }) as {
        error: { details: unknown[] };
      };

      expect((result.error.details as Array<Record<string, unknown>>)[0].errorType).toBe("Unauthorized");
    });

    it("does not return error when errors array is empty", async () => {
      mockGraphql.mockResolvedValue({ data: { user: { id: "1" } }, errors: [] });
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { user { id } }" });

      expect(result).toEqual({ data: { user: { id: "1" } } });
    });
  });

  describe("thrown error handling", () => {
    it("returns error with message when Error is thrown", async () => {
      mockGraphql.mockRejectedValue(new Error("Network error"));
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { noop }" });

      expect(result).toEqual({
        error: expect.objectContaining({
          message: "Network error",
          details: expect.objectContaining({ message: "Network error" }),
        }),
      });
    });

    it("includes error name in details", async () => {
      mockGraphql.mockRejectedValue(new TypeError("Type mismatch"));
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { noop }" }) as {
        error: { details: Record<string, unknown> };
      };

      expect(result.error.details.name).toBe("TypeError");
    });

    it("includes statusCode in details when present", async () => {
      const err = Object.assign(new Error("Forbidden"), { statusCode: 403 });
      mockGraphql.mockRejectedValue(err);
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { noop }" }) as {
        error: { details: Record<string, unknown> };
      };

      expect(result.error.details.statusCode).toBe(403);
    });

    it("returns error for non-Error thrown values", async () => {
      mockGraphql.mockRejectedValue({ code: "CUSTOM_ERROR", value: 42 });
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { noop }" }) as {
        error: { message: string; details: unknown };
      };

      expect(result.error.message).toBe("Unknown error");
      expect(result.error.details).toBeDefined();
    });

    it("returns fallback message for thrown string", async () => {
      mockGraphql.mockRejectedValue("string error");
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { noop }" }) as {
        error: { message: string };
      };

      expect(result.error.message).toBe("Unknown error");
    });
  });

  describe("serializeValue edge cases via error details", () => {
    it("serializes nested objects in GraphQL error extensions", async () => {
      mockGraphql.mockResolvedValue({
        data: null,
        errors: [
          {
            message: "Error",
            extensions: { code: "NOT_FOUND", extra: { nested: true } },
          },
        ],
      });
      const fn = graphqlBaseQuery();
      const result = await fn({ document: "query { noop }" }) as {
        error: { details: Array<Record<string, unknown>> };
      };

      const ext = result.error.details[0].extensions as Record<string, unknown>;
      expect(ext.code).toBe("NOT_FOUND");
    });
  });
});
