import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { Staff } from "@shared/api/graphql/types";

import createStaffData from "../createStaffData";

// graphqlClient はグローバルモック（setupTests.ts）で設定済みだが、
// このテストでは graphql の戻り値を細かく制御するため上書きする
jest.mock("@shared/api/amplify/graphqlClient", () => ({
  graphqlClient: {
    graphql: jest.fn(),
  },
}));

const mockGraphqlClient = graphqlClient as jest.Mocked<typeof graphqlClient>;

describe("createStaffData", () => {
  const mockInput = {
    cognitoUserId: "cognito-001",
    mailAddress: "new.staff@example.com",
    role: "Staff",
    enabled: true,
    status: "CONFIRMED",
  };

  const mockStaff: Staff = {
    __typename: "Staff",
    id: "staff-generated-id",
    cognitoUserId: "cognito-001",
    mailAddress: "new.staff@example.com",
    role: "Staff",
    enabled: true,
    status: "CONFIRMED",
    owner: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("成功した場合、作成されたスタッフデータを返すこと", async () => {
    mockGraphqlClient.graphql.mockResolvedValue({
      data: { createStaff: mockStaff },
    } as never);

    const result = await createStaffData(mockInput as never);

    expect(result).toEqual(mockStaff);
    expect(mockGraphqlClient.graphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { input: mockInput },
        authMode: "userPool",
      }),
    );
  });

  it("response.errors がある場合、最初のエラーメッセージで例外をスローすること", async () => {
    mockGraphqlClient.graphql.mockResolvedValue({
      data: null,
      errors: [{ message: "スタッフの作成に失敗しました" }],
    } as never);

    await expect(createStaffData(mockInput as never)).rejects.toThrow(
      "スタッフの作成に失敗しました",
    );
  });

  it("response.data.createStaff が null の場合、'Failed to create staff' で例外をスローすること", async () => {
    mockGraphqlClient.graphql.mockResolvedValue({
      data: { createStaff: null },
    } as never);

    await expect(createStaffData(mockInput as never)).rejects.toThrow(
      "Failed to create staff",
    );
  });

  it("response.data.createStaff が undefined の場合、'Failed to create staff' で例外をスローすること", async () => {
    mockGraphqlClient.graphql.mockResolvedValue({
      data: {},
    } as never);

    await expect(createStaffData(mockInput as never)).rejects.toThrow(
      "Failed to create staff",
    );
  });

  it("graphql 呼び出し自体が失敗した場合、例外を伝播させること", async () => {
    mockGraphqlClient.graphql.mockRejectedValue(
      new Error("Network error"),
    );

    await expect(createStaffData(mockInput as never)).rejects.toThrow(
      "Network error",
    );
  });
});
