import createOperationLogData from "../createOperationLogData";

const mockGraphql = jest.fn();

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: (...args: unknown[]) => mockGraphql(...args) },
}));

jest.mock("@shared/api/graphql/documents/mutations", () => ({
  createOperationLog: "createOperationLog",
}));

const BASE_INPUT = {
  staffId: "s1",
  resource: "attendance",
  resourceKey: "2024-03-01",
  action: "CREATE",
  timestamp: "2024-03-01T09:00:00Z",
  logFormatVersion: 1,
};

describe("createOperationLogData", () => {
  beforeEach(() => {
    mockGraphql.mockReset();
  });

  it("正常系: OperationLog を返す", async () => {
    const log = { id: "log1", ...BASE_INPUT };
    mockGraphql.mockResolvedValue({ data: { createOperationLog: log } });

    const result = await createOperationLogData(BASE_INPUT);
    expect(result).toEqual(log);
  });

  it("staffId が未設定の場合はバリデーションエラー", async () => {
    const { staffId: _, ...input } = BASE_INPUT;
    await expect(
      createOperationLogData(input as typeof BASE_INPUT),
    ).rejects.toThrow("staffId");
  });

  it("resource が未設定の場合はバリデーションエラー", async () => {
    const { resource: _, ...input } = BASE_INPUT;
    await expect(
      createOperationLogData(input as typeof BASE_INPUT),
    ).rejects.toThrow("resource");
  });

  it("resourceKey が未設定の場合はバリデーションエラー", async () => {
    const { resourceKey: _, ...input } = BASE_INPUT;
    await expect(
      createOperationLogData(input as typeof BASE_INPUT),
    ).rejects.toThrow("resourceKey");
  });

  it("action が未設定の場合はバリデーションエラー", async () => {
    const { action: _, ...input } = BASE_INPUT;
    await expect(
      createOperationLogData(input as typeof BASE_INPUT),
    ).rejects.toThrow("action");
  });

  it("timestamp が未設定の場合はバリデーションエラー", async () => {
    const { timestamp: _, ...input } = BASE_INPUT;
    await expect(
      createOperationLogData(input as typeof BASE_INPUT),
    ).rejects.toThrow("timestamp");
  });

  it("metadata から clientTimezone を自動抽出する", async () => {
    const log = { id: "log1", ...BASE_INPUT };
    mockGraphql.mockResolvedValue({ data: { createOperationLog: log } });

    await createOperationLogData({
      ...BASE_INPUT,
      metadata: JSON.stringify({ clientTimezone: "Asia/Tokyo" }),
    });

    const inputSent = mockGraphql.mock.calls[0][0].variables.input;
    expect(inputSent.clientTimezone).toBe("Asia/Tokyo");
  });

  it("details から appVersion を自動抽出する", async () => {
    const log = { id: "log1", ...BASE_INPUT };
    mockGraphql.mockResolvedValue({ data: { createOperationLog: log } });

    await createOperationLogData({
      ...BASE_INPUT,
      details: JSON.stringify({ appVersion: "1.2.3" }),
    });

    const inputSent = mockGraphql.mock.calls[0][0].variables.input;
    expect(inputSent.appVersion).toBe("1.2.3");
  });

  it("不明フィールドエラー時はリトライしてフィールドを除外する", async () => {
    const log = { id: "log1", ...BASE_INPUT };
    mockGraphql
      .mockResolvedValueOnce({
        errors: [
          {
            message:
              "contains a field not in 'CreateOperationLogInput' clientTimezone",
          },
        ],
        data: null,
      })
      .mockResolvedValueOnce({ data: { createOperationLog: log } });

    const result = await createOperationLogData({
      ...BASE_INPUT,
      metadata: JSON.stringify({ clientTimezone: "Asia/Tokyo" }),
    });

    expect(result).toEqual(log);
    expect(mockGraphql).toHaveBeenCalledTimes(2);
    const retryInput = mockGraphql.mock.calls[1][0].variables.input;
    expect(retryInput.clientTimezone).toBeUndefined();
  });

  it("通常のエラーはリトライせずにスロー", async () => {
    mockGraphql.mockResolvedValue({
      errors: [{ message: "Generic error" }],
      data: null,
    });

    await expect(createOperationLogData(BASE_INPUT)).rejects.toThrow();
  });
});
