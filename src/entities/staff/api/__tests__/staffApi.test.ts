import { logOperationEvent } from "@entities/operation-log/model/canonicalOperationLog";
import { configureStore } from "@reduxjs/toolkit";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";

import { staffApi } from "../staffApi";

jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: { graphql: jest.fn() },
}));

jest.mock("@entities/operation-log/model/canonicalOperationLog", () => ({
  logOperationEvent: jest.fn().mockResolvedValue(undefined),
}));

const mockGraphql = graphqlClient.graphql as jest.Mock;
const mockLogOperationEvent = logOperationEvent as jest.Mock;

const createTestStore = () =>
  configureStore({
    reducer: { [staffApi.reducerPath]: staffApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(staffApi.middleware),
  });

const makeStaff = (overrides = {}) => ({
  __typename: "Staff" as const,
  id: "staff-1",
  cognitoUserId: "cognito-1",
  familyName: "テスト",
  givenName: "太郎",
  mailAddress: "test@example.com",
  owner: false,
  role: "STAFF" as const,
  enabled: true,
  status: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  usageStartDate: null,
  notifications: null,
  workType: null,
  ...overrides,
});

describe("staffApi endpoints", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockLogOperationEvent.mockResolvedValue(undefined);
  });

  // ─── getStaffs ────────────────────────────────────────────────────────

  describe("getStaffs", () => {
    it("正常にスタッフリストを取得する", async () => {
      const staff = makeStaff();
      mockGraphql.mockResolvedValueOnce({
        data: {
          listStaff: { items: [staff], nextToken: null },
        },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.getStaffs.initiate(),
      );

      expect(result.data).toEqual([staff]);
    });

    it("nextTokenによるページネーションで全件取得する", async () => {
      const staff1 = makeStaff({ id: "staff-1" });
      const staff2 = makeStaff({ id: "staff-2", givenName: "次郎" });

      mockGraphql
        .mockResolvedValueOnce({
          data: { listStaff: { items: [staff1], nextToken: "token-1" } },
        })
        .mockResolvedValueOnce({
          data: { listStaff: { items: [staff2], nextToken: null } },
        });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.getStaffs.initiate(),
      );

      expect(result.data).toHaveLength(2);
      expect(result.data).toEqual([staff1, staff2]);
    });

    it("null アイテムをフィルタリングする", async () => {
      const staff = makeStaff();
      mockGraphql.mockResolvedValueOnce({
        data: {
          listStaff: { items: [null, staff, undefined], nextToken: null },
        },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.getStaffs.initiate(),
      );

      expect(result.data).toEqual([staff]);
    });

    it("connection が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { listStaff: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.getStaffs.initiate(),
      );

      expect(result.error).toMatchObject({
        message: "Failed to fetch staffs",
      });
    });

    it("GraphQL エラー時にエラーを返す", async () => {
      mockGraphql.mockRejectedValueOnce(new Error("Network error"));

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.getStaffs.initiate(),
      );

      expect(result.error).toBeDefined();
    });

    it("空のスタッフリストを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { listStaff: { items: [], nextToken: null } },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.getStaffs.initiate(),
      );

      expect(result.data).toEqual([]);
    });
  });

  // ─── createStaff ──────────────────────────────────────────────────────

  describe("createStaff", () => {
    const createInput = {
      cognitoUserId: "cognito-new",
      familyName: "新規",
      givenName: "スタッフ",
      mailAddress: "new@example.com",
      owner: false,
      role: "STAFF" as const,
      enabled: true,
      status: "CONFIRMED",
    };

    it("正常にスタッフを作成し操作ログを記録する", async () => {
      const created = makeStaff({ id: "staff-new", ...createInput });
      mockGraphql.mockResolvedValueOnce({
        data: { createStaff: created },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.createStaff.initiate(createInput),
      );

      expect(result.data).toEqual(created);
      expect(mockLogOperationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "staff.create",
          resource: "staff",
          resourceId: created.id,
          targetStaffId: created.cognitoUserId,
          before: null,
          after: created,
        }),
      );
    });

    it("作成結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { createStaff: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.createStaff.initiate(createInput),
      );

      expect(result.error).toMatchObject({
        message: "Failed to create staff",
      });
      expect(mockLogOperationEvent).not.toHaveBeenCalled();
    });

    it("GraphQL エラー時にエラーを返す", async () => {
      mockGraphql.mockRejectedValueOnce(new Error("Create failed"));

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.createStaff.initiate(createInput),
      );

      expect(result.error).toBeDefined();
      expect(mockLogOperationEvent).not.toHaveBeenCalled();
    });
  });

  // ─── updateStaff ──────────────────────────────────────────────────────

  describe("updateStaff", () => {
    const updateInput = {
      id: "staff-1",
      familyName: "更新後",
      givenName: "太郎",
    };

    it("正常にスタッフを更新し staff.update ログを記録する", async () => {
      const currentStaff = makeStaff({ enabled: true });
      const updatedStaff = makeStaff({ familyName: "更新後", enabled: true });

      // 1st call: getStaff (current), 2nd call: updateStaff
      mockGraphql
        .mockResolvedValueOnce({ data: { getStaff: currentStaff } })
        .mockResolvedValueOnce({ data: { updateStaff: updatedStaff } });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.updateStaff.initiate({ input: updateInput }),
      );

      expect(result.data).toEqual(updatedStaff);
      expect(mockLogOperationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "staff.update",
          resource: "staff",
          resourceId: updatedStaff.id,
          before: currentStaff,
          after: updatedStaff,
        }),
      );
    });

    it("有効 → 無効に変わった場合に staff.disable ログを記録する", async () => {
      const currentStaff = makeStaff({ enabled: true });
      const updatedStaff = makeStaff({ enabled: false });

      mockGraphql
        .mockResolvedValueOnce({ data: { getStaff: currentStaff } })
        .mockResolvedValueOnce({ data: { updateStaff: updatedStaff } });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.updateStaff.initiate({
          input: { id: "staff-1", enabled: false },
        }),
      );

      expect(result.data).toEqual(updatedStaff);
      expect(mockLogOperationEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "staff.disable" }),
      );
    });

    it("無効 → 有効に変わった場合に staff.enable ログを記録する", async () => {
      const currentStaff = makeStaff({ enabled: false });
      const updatedStaff = makeStaff({ enabled: true });

      mockGraphql
        .mockResolvedValueOnce({ data: { getStaff: currentStaff } })
        .mockResolvedValueOnce({ data: { updateStaff: updatedStaff } });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.updateStaff.initiate({
          input: { id: "staff-1", enabled: true },
        }),
      );

      expect(result.data).toEqual(updatedStaff);
      expect(mockLogOperationEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "staff.enable" }),
      );
    });

    it("現在のスタッフ取得に失敗した場合にエラーを返す", async () => {
      mockGraphql.mockRejectedValueOnce(new Error("getStaff failed"));

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.updateStaff.initiate({ input: updateInput }),
      );

      expect(result.error).toBeDefined();
      expect(mockLogOperationEvent).not.toHaveBeenCalled();
    });

    it("現在のスタッフが null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({ data: { getStaff: null } });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.updateStaff.initiate({ input: updateInput }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to load current staff",
      });
    });

    it("更新結果が null の場合にエラーを返す", async () => {
      const currentStaff = makeStaff();
      mockGraphql
        .mockResolvedValueOnce({ data: { getStaff: currentStaff } })
        .mockResolvedValueOnce({ data: { updateStaff: null } });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.updateStaff.initiate({ input: updateInput }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to update staff",
      });
    });

    it("更新 GraphQL エラー時にエラーを返す", async () => {
      const currentStaff = makeStaff();
      mockGraphql
        .mockResolvedValueOnce({ data: { getStaff: currentStaff } })
        .mockRejectedValueOnce(new Error("Update failed"));

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.updateStaff.initiate({ input: updateInput }),
      );

      expect(result.error).toBeDefined();
    });

    it("condition パラメータを渡した場合に正常に動作する", async () => {
      const currentStaff = makeStaff();
      const updatedStaff = makeStaff({ familyName: "更新後" });
      mockGraphql
        .mockResolvedValueOnce({ data: { getStaff: currentStaff } })
        .mockResolvedValueOnce({ data: { updateStaff: updatedStaff } });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.updateStaff.initiate({
          input: updateInput,
          condition: { familyName: { eq: "テスト" } },
        }),
      );

      expect(result.data).toEqual(updatedStaff);
    });
  });

  // ─── deleteStaff ──────────────────────────────────────────────────────

  describe("deleteStaff", () => {
    it("正常にスタッフを削除し操作ログを記録する", async () => {
      const deleted = makeStaff();
      mockGraphql.mockResolvedValueOnce({
        data: { deleteStaff: deleted },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.deleteStaff.initiate({ id: "staff-1" }),
      );

      expect(result.data).toEqual(deleted);
      expect(mockLogOperationEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "staff.delete",
          resource: "staff",
          resourceId: deleted.id,
          targetStaffId: deleted.cognitoUserId,
          before: deleted,
          after: null,
        }),
      );
    });

    it("削除結果が null の場合にエラーを返す", async () => {
      mockGraphql.mockResolvedValueOnce({
        data: { deleteStaff: null },
      });

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.deleteStaff.initiate({ id: "staff-1" }),
      );

      expect(result.error).toMatchObject({
        message: "Failed to delete staff",
      });
      expect(mockLogOperationEvent).not.toHaveBeenCalled();
    });

    it("GraphQL エラー時にエラーを返す", async () => {
      mockGraphql.mockRejectedValueOnce(new Error("Delete failed"));

      const store = createTestStore();
      const result = await store.dispatch(
        staffApi.endpoints.deleteStaff.initiate({ id: "staff-1" }),
      );

      expect(result.error).toBeDefined();
      expect(mockLogOperationEvent).not.toHaveBeenCalled();
    });
  });
});
