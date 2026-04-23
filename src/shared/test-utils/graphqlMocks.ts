/**
 * GraphQL / RTK Query テスト用ヘルパー
 *
 * AppSync GraphQL 呼び出しや RTK Query フックをテストでモックする際の
 * 標準パターンを提供します。
 */

/**
 * RTK Query の useXxxQuery フックが返す典型的な形をモック用に生成します。
 *
 * @example
 * ```ts
 * jest.mock("@entities/shift/api/shiftApi", () => ({
 *   useGetShiftRequestsQuery: jest.fn(() =>
 *     createRtkQueryResult({ data: [] })
 *   ),
 * }));
 * ```
 */
export function createRtkQueryResult<T>(
  overrides?: Partial<{
    data: T;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
    refetch: jest.Mock;
  }>,
) {
  return {
    data: undefined as T | undefined,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
    ...overrides,
  };
}

/**
 * RTK Query の useMutation フックが返す典型的な形をモック用に生成します。
 *
 * @example
 * ```ts
 * const mockMutate = jest.fn().mockResolvedValue({ data: {} });
 * jest.mock("@entities/attendance/api/attendanceApi", () => ({
 *   useUpdateAttendanceMutation: () => createRtkMutationResult(mockMutate),
 * }));
 * ```
 */
export function createRtkMutationResult(
  trigger?: jest.Mock,
  stateOverrides?: Partial<{
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    isSuccess: boolean;
    data: unknown;
    reset: jest.Mock;
  }>,
): [jest.Mock, ReturnType<typeof createRtkMutationState>] {
  const mockTrigger = trigger ?? jest.fn().mockResolvedValue({ data: null });
  return [mockTrigger, createRtkMutationState(stateOverrides)];
}

function createRtkMutationState(
  overrides?: Partial<{
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    isSuccess: boolean;
    data: unknown;
    reset: jest.Mock;
  }>,
) {
  return {
    isLoading: false,
    isError: false,
    error: undefined,
    isSuccess: false,
    data: undefined,
    reset: jest.fn(),
    ...overrides,
  };
}

/**
 * AppSync graphqlClient.graphql を使った Subscription のモックを生成します。
 *
 * 返り値の `triggerNext` を呼び出すことで、サブスクリプションイベントを
 * テストコードからシミュレーションできます。
 *
 * @example
 * ```ts
 * const { mockGraphql, triggerNext } = createSubscriptionMock();
 * jest.mock("@/shared/api/amplify/graphqlClient", () => ({
 *   graphqlClient: { graphql: mockGraphql },
 * }));
 *
 * // テスト内でイベントを発火
 * triggerNext({ data: { onCreateShiftRequest: { ... } } });
 * ```
 */
export function createSubscriptionMock<T = unknown>() {
  let _nextCallback: ((value: T) => void) | undefined;
  const mockUnsubscribe = jest.fn();

  const mockGraphql = jest.fn(() => ({
    subscribe: jest.fn(({ next }: { next: (value: T) => void }) => {
      _nextCallback = next;
      return { unsubscribe: mockUnsubscribe };
    }),
  }));

  function triggerNext(value: T) {
    if (!_nextCallback) {
      throw new Error(
        "サブスクリプションがまだ開始されていません。subscribe() が呼ばれた後に triggerNext() を呼び出してください。",
      );
    }
    _nextCallback(value);
  }

  return { mockGraphql, triggerNext, mockUnsubscribe };
}
