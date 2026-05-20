type GraphqlMockArgs = {
  query: string;
  variables?: Record<string, unknown>;
};

type QueryRoute = {
  contains: string;
  resolve: (args: GraphqlMockArgs) => unknown;
};

type NextHandler<TEventMap extends Record<string, unknown>, TEventName extends keyof TEventMap> = (
  value: { data?: Partial<Pick<TEventMap, TEventName>> },
) => void;

export const createGraphqlQueryRouter = (
  routes: readonly QueryRoute[],
  fallback: (args: GraphqlMockArgs) => unknown,
) => {
  return (args: GraphqlMockArgs): unknown => {
    const matchedRoute = routes.find((route) =>
      args.query.includes(route.contains),
    );
    return matchedRoute ? matchedRoute.resolve(args) : fallback(args);
  };
};

export const createSubscriptionMockHarness = <
  TEventMap extends Record<string, unknown>,
>(
  unsubscribe: jest.Mock,
) => {
  const nextHandlers = new Map<keyof TEventMap, unknown>();

  const buildSubscriptionResponse = <TEventName extends keyof TEventMap>(
    eventName: TEventName,
  ) => ({
    subscribe: jest.fn((handlers: { next: NextHandler<TEventMap, TEventName> }) => {
      nextHandlers.set(eventName, handlers.next);
      return { unsubscribe };
    }),
  });

  const buildPassiveSubscriptionResponse = () => ({
    subscribe: jest.fn(() => ({ unsubscribe })),
  });

  const hasHandler = (eventName: keyof TEventMap) => nextHandlers.has(eventName);

  const emit = <TEventName extends keyof TEventMap>(
    eventName: TEventName,
    payload: TEventMap[TEventName],
  ) => {
    const handler = nextHandlers.get(eventName) as
      | NextHandler<TEventMap, TEventName>
      | undefined;

    handler?.({
      data: {
        [eventName]: payload,
      } as Partial<Pick<TEventMap, TEventName>>,
    });
  };

  return {
    buildSubscriptionResponse,
    buildPassiveSubscriptionResponse,
    hasHandler,
    emit,
  };
};
