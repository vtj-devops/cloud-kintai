import { executePaginatedQuery } from "../paginatedQuery";

type Item = { id: string };

const makeBaseQuery = (pages: Array<{ items: (Item | null)[]; nextToken: string | null }>) => {
  let callCount = 0;
  return jest.fn().mockImplementation(() => {
    const page = pages[callCount++];
    return Promise.resolve({ data: { connection: page } });
  });
};

const connectionExtractor = (data: unknown) =>
  (data as { connection: { items: (Item | null)[]; nextToken: string | null } } | null)?.connection;

describe("executePaginatedQuery", () => {
  it("単一ページのデータを返す", async () => {
    const items = [{ id: "1" }, { id: "2" }];
    const baseQuery = makeBaseQuery([{ items, nextToken: null }]);

    const result = await executePaginatedQuery<Item>({
      baseQuery,
      document: "query",
      connectionExtractor,
      errorMessage: "Failed",
    });

    expect(result).toEqual({ data: items });
    expect(baseQuery).toHaveBeenCalledTimes(1);
    expect(baseQuery).toHaveBeenCalledWith({ document: "query", variables: { nextToken: null } });
  });

  it("nextToken によるページネーションで全件取得する", async () => {
    const item1 = { id: "1" };
    const item2 = { id: "2" };
    const baseQuery = makeBaseQuery([
      { items: [item1], nextToken: "token-1" },
      { items: [item2], nextToken: null },
    ]);

    const result = await executePaginatedQuery<Item>({
      baseQuery,
      document: "query",
      connectionExtractor,
      errorMessage: "Failed",
    });

    expect(result).toEqual({ data: [item1, item2] });
    expect(baseQuery).toHaveBeenCalledTimes(2);
    expect(baseQuery).toHaveBeenNthCalledWith(2, {
      document: "query",
      variables: { nextToken: "token-1" },
    });
  });

  it("追加の variables を nextToken と結合して渡す", async () => {
    const items = [{ id: "1" }];
    const baseQuery = makeBaseQuery([{ items, nextToken: null }]);

    await executePaginatedQuery<Item>({
      baseQuery,
      document: "query",
      variables: { limit: 100, filter: "active" },
      connectionExtractor,
      errorMessage: "Failed",
    });

    expect(baseQuery).toHaveBeenCalledWith({
      document: "query",
      variables: { limit: 100, filter: "active", nextToken: null },
    });
  });

  it("null・undefined アイテムをフィルタリングする", async () => {
    const item = { id: "1" };
    const baseQuery = makeBaseQuery([{ items: [null, item, null], nextToken: null }]);

    const result = await executePaginatedQuery<Item>({
      baseQuery,
      document: "query",
      connectionExtractor,
      errorMessage: "Failed",
    });

    expect(result).toEqual({ data: [item] });
  });

  it("空のアイテムリストを返す", async () => {
    const baseQuery = makeBaseQuery([{ items: [], nextToken: null }]);

    const result = await executePaginatedQuery<Item>({
      baseQuery,
      document: "query",
      connectionExtractor,
      errorMessage: "Failed",
    });

    expect(result).toEqual({ data: [] });
  });

  it("baseQuery がエラーを返した場合にエラーを返す", async () => {
    const baseQuery = jest.fn().mockResolvedValue({ error: { message: "Network error" } });

    const result = await executePaginatedQuery<Item>({
      baseQuery,
      document: "query",
      connectionExtractor,
      errorMessage: "Failed",
    });

    expect(result).toEqual({ error: { message: "Network error" } });
  });

  it("connectionExtractor が null を返した場合に errorMessage でエラーを返す", async () => {
    const baseQuery = jest.fn().mockResolvedValue({ data: { connection: null } });

    const result = await executePaginatedQuery<Item>({
      baseQuery,
      document: "query",
      connectionExtractor: () => null,
      errorMessage: "Failed to fetch items",
    });

    expect(result).toEqual({ error: { message: "Failed to fetch items" } });
  });

  it("途中ページでエラーが発生した場合にエラーを返す", async () => {
    const baseQuery = jest
      .fn()
      .mockResolvedValueOnce({ data: { connection: { items: [{ id: "1" }], nextToken: "t" } } })
      .mockResolvedValueOnce({ error: { message: "Page 2 error" } });

    const result = await executePaginatedQuery<Item>({
      baseQuery,
      document: "query",
      connectionExtractor,
      errorMessage: "Failed",
    });

    expect(result).toEqual({ error: { message: "Page 2 error" } });
  });
});
