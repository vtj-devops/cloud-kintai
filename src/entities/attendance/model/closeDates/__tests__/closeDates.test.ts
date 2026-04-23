import { graphqlClient } from "@shared/api/amplify/graphqlClient";

import createCloseDateData from "../createCloseDateData";
import deleteCloseDateData from "../deleteCloseDateData";
import fetchCloseDates from "../fetchCloseDates";
import updateCloseDateData from "../updateCloseDateData";

const mockedGraphql = graphqlClient.graphql as jest.Mock;

// ---------------------------------------------------------------------------
// fetchCloseDates
// ---------------------------------------------------------------------------
describe("fetchCloseDates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("closeDates のリストを返す", async () => {
    const mockItems = [
      {
        id: "1",
        closeDate: "2024-01-31",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    ];
    mockedGraphql.mockResolvedValueOnce({
      data: { listCloseDates: { items: mockItems, nextToken: null } },
    });

    const result = await fetchCloseDates();

    expect(result).toEqual(mockItems);
    expect(mockedGraphql).toHaveBeenCalledWith(
      expect.objectContaining({ authMode: "userPool" }),
    );
  });

  it("nextToken がある場合はページネーションで全件取得する", async () => {
    const page1 = [
      {
        id: "1",
        closeDate: "2024-01-31",
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    ];
    const page2 = [
      {
        id: "2",
        closeDate: "2024-02-29",
        startDate: "2024-02-01",
        endDate: "2024-02-29",
      },
    ];

    mockedGraphql
      .mockResolvedValueOnce({
        data: { listCloseDates: { items: page1, nextToken: "token123" } },
      })
      .mockResolvedValueOnce({
        data: { listCloseDates: { items: page2, nextToken: null } },
      });

    const result = await fetchCloseDates();

    expect(result).toHaveLength(2);
    expect(result).toEqual([...page1, ...page2]);
    expect(mockedGraphql).toHaveBeenCalledTimes(2);
  });

  it("null アイテムをフィルタリングする", async () => {
    const mockItems = [
      { id: "1", closeDate: "2024-01-31" },
      null,
      { id: "2", closeDate: "2024-02-29" },
    ];
    mockedGraphql.mockResolvedValueOnce({
      data: { listCloseDates: { items: mockItems, nextToken: null } },
    });

    const result = await fetchCloseDates();

    expect(result).toHaveLength(2);
  });

  it("GraphQL errors が返された場合は例外をスローする", async () => {
    mockedGraphql.mockResolvedValueOnce({
      errors: [{ message: "GraphQL fetch error" }],
    });

    await expect(fetchCloseDates()).rejects.toThrow("GraphQL fetch error");
  });

  it("data が返されない場合は例外をスローする", async () => {
    mockedGraphql.mockResolvedValueOnce({ data: { listCloseDates: null } });

    await expect(fetchCloseDates()).rejects.toThrow("No data returned");
  });
});

// ---------------------------------------------------------------------------
// createCloseDateData
// ---------------------------------------------------------------------------
describe("createCloseDateData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("作成した CloseDate を返す", async () => {
    const mockCloseDate = {
      id: "new-1",
      closeDate: "2024-01-31",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    };
    mockedGraphql.mockResolvedValueOnce({
      data: { createCloseDate: mockCloseDate },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createCloseDateData({} as any);

    expect(result).toEqual(mockCloseDate);
    expect(mockedGraphql).toHaveBeenCalledWith(
      expect.objectContaining({ authMode: "userPool" }),
    );
  });

  it("input を variables に含めて呼び出す", async () => {
    const input = {
      closeDate: "2024-01-31",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    };
    mockedGraphql.mockResolvedValueOnce({
      data: { createCloseDate: { id: "1", ...input } },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createCloseDateData(input as any);

    expect(mockedGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { input },
      }),
    );
  });

  it("GraphQL errors が返された場合は例外をスローする", async () => {
    mockedGraphql.mockResolvedValueOnce({
      errors: [{ message: "Create error" }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(createCloseDateData({} as any)).rejects.toThrow("Create error");
  });

  it("data がない場合は例外をスローする", async () => {
    mockedGraphql.mockResolvedValueOnce({
      data: { createCloseDate: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(createCloseDateData({} as any)).rejects.toThrow(
      "No data returned",
    );
  });
});

// ---------------------------------------------------------------------------
// updateCloseDateData
// ---------------------------------------------------------------------------
describe("updateCloseDateData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("更新した CloseDate を返す", async () => {
    const mockCloseDate = {
      id: "1",
      closeDate: "2024-01-28",
      startDate: "2024-01-01",
      endDate: "2024-01-28",
      version: 2,
    };
    mockedGraphql.mockResolvedValueOnce({
      data: { updateCloseDate: mockCloseDate },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await updateCloseDateData({ input: { id: "1" } as any });

    expect(result).toEqual(mockCloseDate);
    expect(mockedGraphql).toHaveBeenCalledWith(
      expect.objectContaining({ authMode: "userPool" }),
    );
  });

  it("condition を variables に含めて送信する", async () => {
    const mockCloseDate = { id: "1", closeDate: "2024-01-28", version: 2 };
    mockedGraphql.mockResolvedValueOnce({
      data: { updateCloseDate: mockCloseDate },
    });
    const condition = { version: { eq: 1 } };

    await updateCloseDateData({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: { id: "1", closeDate: "2024-01-28" } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      condition: condition as any,
    });

    expect(mockedGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ condition }),
      }),
    );
  });

  it("condition が未指定のとき variables.condition は undefined になる", async () => {
    const mockCloseDate = { id: "1", closeDate: "2024-01-28", version: 2 };
    mockedGraphql.mockResolvedValueOnce({
      data: { updateCloseDate: mockCloseDate },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateCloseDateData({ input: { id: "1", closeDate: "2024-01-28" } as any });

    expect(mockedGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ condition: undefined }),
      }),
    );
  });

  it("GraphQL errors が返された場合は例外をスローする", async () => {
    mockedGraphql.mockResolvedValueOnce({
      errors: [{ message: "Update error" }],
    });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateCloseDateData({ input: { id: "1" } as any }),
    ).rejects.toThrow("Update error");
  });

  it("data がない場合は例外をスローする", async () => {
    mockedGraphql.mockResolvedValueOnce({
      data: { updateCloseDate: null },
    });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateCloseDateData({ input: { id: "1" } as any }),
    ).rejects.toThrow("No data returned");
  });
});

// ---------------------------------------------------------------------------
// deleteCloseDateData
// ---------------------------------------------------------------------------
describe("deleteCloseDateData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("削除した CloseDate を返す", async () => {
    const mockCloseDate = {
      id: "del-1",
      closeDate: "2024-01-31",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    };
    mockedGraphql.mockResolvedValueOnce({
      data: { deleteCloseDate: mockCloseDate },
    });

    const result = await deleteCloseDateData({ id: "del-1" });

    expect(result).toEqual(mockCloseDate);
    expect(mockedGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        authMode: "userPool",
        variables: { input: { id: "del-1" } },
      }),
    );
  });

  it("GraphQL errors が返された場合は例外をスローする", async () => {
    mockedGraphql.mockResolvedValueOnce({
      errors: [{ message: "Delete error" }],
    });

    await expect(deleteCloseDateData({ id: "del-1" })).rejects.toThrow(
      "Delete error",
    );
  });

  it("data がない場合は例外をスローする", async () => {
    mockedGraphql.mockResolvedValueOnce({
      data: { deleteCloseDate: null },
    });

    await expect(deleteCloseDateData({ id: "del-1" })).rejects.toThrow(
      "No data returned",
    );
  });
});
