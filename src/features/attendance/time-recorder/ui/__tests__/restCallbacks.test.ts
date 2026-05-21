import type { Attendance } from "@shared/api/graphql/types";

import { restEndCallback } from "../restEndCallback";
import { restStartCallback } from "../restStartCallback";
import { createCallbackFixtures } from "./callbackTestUtils";

const { mockCognitoUser, mockAttendance, mockDispatch, mockLogger } =
  createCallbackFixtures();

const REST_START_OCCURRED_AT = "2024-03-15T12:00:00.000Z";
const REST_END_OCCURRED_AT = "2024-03-15T13:00:00.000Z";

type Mutation = (
  staffId: string,
  workDate: string,
  timeIso: string,
) => Promise<Attendance>;

const callbackCases = [
  {
    name: "restStartCallback",
    occurredAt: REST_START_OCCURRED_AT,
    invoke: (cognitoUser: typeof mockCognitoUser | null, mutation: Mutation) =>
      restStartCallback(
        cognitoUser,
        mockDispatch,
        mutation,
        mockLogger,
        REST_START_OCCURRED_AT,
      ),
  },
  {
    name: "restEndCallback",
    occurredAt: REST_END_OCCURRED_AT,
    invoke: (cognitoUser: typeof mockCognitoUser | null, mutation: Mutation) =>
      restEndCallback(
        cognitoUser,
        mutation,
        mockDispatch,
        mockLogger,
        REST_END_OCCURRED_AT,
      ),
  },
] as const;

beforeEach(() => {
  jest.clearAllMocks();
});

describe.each(callbackCases)("$name", ({ invoke, occurredAt }) => {
  it("cognitoUser がない場合はスキップする", async () => {
    const mutation = jest.fn() as jest.MockedFunction<Mutation>;
    await invoke(null, mutation);
    expect(mutation).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it("成功時に dispatch を呼ぶ", async () => {
    const mutation = jest
      .fn<Promise<Attendance>, Parameters<Mutation>>()
      .mockResolvedValue(mockAttendance);
    await invoke(mockCognitoUser, mutation);
    expect(mutation).toHaveBeenCalledWith("user-1", "2024-03-15", occurredAt);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("失敗時にエラー dispatch を呼ぶ", async () => {
    const mutation = jest
      .fn<Promise<Attendance>, Parameters<Mutation>>()
      .mockRejectedValue(new Error("network error"));
    await invoke(mockCognitoUser, mutation);
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
  });
});
