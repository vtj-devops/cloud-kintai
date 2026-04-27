import { AppConfigDataManager } from "../AppConfigDataManager";

const mockGraphql = jest.fn();

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: (...args: unknown[]) => mockGraphql(...args) },
}));

jest.mock("@shared/api/graphql/documents/mutations", () => ({
  createAppConfig: "createAppConfig",
  updateAppConfig: "updateAppConfig",
}));

jest.mock("@shared/api/graphql/documents/queries", () => ({
  listAppConfigs: "listAppConfigs",
}));

const MOCK_CONFIG = {
  id: "config1",
  name: "default",
  version: 1,
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("AppConfigDataManager", () => {
  let manager: AppConfigDataManager;

  beforeEach(() => {
    manager = new AppConfigDataManager();
    mockGraphql.mockReset();
  });

  describe("fetch", () => {
    it("正常系: AppConfig を返す", async () => {
      mockGraphql.mockResolvedValue({
        data: { listAppConfigs: { items: [MOCK_CONFIG] } },
      });
      const result = await manager.fetch();
      expect(result).toEqual(MOCK_CONFIG);
    });

    it("0件の場合は null を返す", async () => {
      mockGraphql.mockResolvedValue({
        data: { listAppConfigs: { items: [] } },
      });
      const result = await manager.fetch();
      expect(result).toBeNull();
    });

    it("2件以上の場合はエラー", async () => {
      mockGraphql.mockResolvedValue({
        data: { listAppConfigs: { items: [MOCK_CONFIG, { ...MOCK_CONFIG, id: "config2" }] } },
      });
      await expect(manager.fetch()).rejects.toThrow("Multiple app configs found");
    });

    it("errors がある場合はエラー", async () => {
      mockGraphql.mockResolvedValue({
        errors: [{ message: "network error" }],
        data: null,
      });
      await expect(manager.fetch()).rejects.toThrow("network error");
    });

    it("listAppConfigs が null の場合はエラー", async () => {
      mockGraphql.mockResolvedValue({ data: { listAppConfigs: null } });
      await expect(manager.fetch()).rejects.toThrow("Failed to fetch app config");
    });

    it("name 引数をクエリに渡す", async () => {
      mockGraphql.mockResolvedValue({
        data: { listAppConfigs: { items: [MOCK_CONFIG] } },
      });
      await manager.fetch("custom-name");
      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { filter: { name: { eq: "custom-name" } } },
        }),
      );
    });
  });

  describe("create", () => {
    it("正常系: 新しい AppConfig を返す", async () => {
      const created = { ...MOCK_CONFIG, id: "new-config" };
      mockGraphql.mockResolvedValue({ data: { createAppConfig: created } });

      const result = await manager.create({ name: "default" });
      expect(result).toEqual(created);
    });

    it("errors がある場合はエラー", async () => {
      mockGraphql.mockResolvedValue({ errors: [{ message: "create failed" }], data: null });
      await expect(manager.create({ name: "default" })).rejects.toThrow("create failed");
    });

    it("createAppConfig が null の場合はエラー", async () => {
      mockGraphql.mockResolvedValue({ data: { createAppConfig: null } });
      await expect(manager.create({ name: "default" })).rejects.toThrow(
        "Failed to create app config",
      );
    });
  });

  describe("update", () => {
    it("正常系: 更新された AppConfig を返す", async () => {
      const updated = { ...MOCK_CONFIG, version: 2 };
      // fetch を先に返す、次に update を返す
      mockGraphql
        .mockResolvedValueOnce({ data: { listAppConfigs: { items: [MOCK_CONFIG] } } })
        .mockResolvedValueOnce({ data: { updateAppConfig: updated } });

      const result = await manager.update({ name: "default" });
      expect(result).toEqual(updated);
    });

    it("version が次の値でリクエストされる", async () => {
      mockGraphql
        .mockResolvedValueOnce({ data: { listAppConfigs: { items: [MOCK_CONFIG] } } })
        .mockResolvedValueOnce({ data: { updateAppConfig: { ...MOCK_CONFIG, version: 2 } } });

      await manager.update({ name: "default" });
      const updateCall = mockGraphql.mock.calls[1][0];
      expect(updateCall.variables.input.version).toBe(2);
    });

    it("errors がある場合はエラー", async () => {
      mockGraphql
        .mockResolvedValueOnce({ data: { listAppConfigs: { items: [MOCK_CONFIG] } } })
        .mockResolvedValueOnce({ errors: [{ message: "update failed" }], data: null });
      await expect(manager.update({ name: "default" })).rejects.toThrow("update failed");
    });

    it("updateAppConfig が null の場合はエラー", async () => {
      mockGraphql
        .mockResolvedValueOnce({ data: { listAppConfigs: { items: [MOCK_CONFIG] } } })
        .mockResolvedValueOnce({ data: { updateAppConfig: null } });
      await expect(manager.update({ name: "default" })).rejects.toThrow(
        "Failed to update app config",
      );
    });
  });
});
