import type { GraphQLBaseQueryArgs, GraphQLBaseQueryError } from "./graphqlBaseQuery";

type PaginatedBaseQuery = (
  args: GraphQLBaseQueryArgs,
) => { data?: unknown; error?: unknown } | PromiseLike<{ data?: unknown; error?: unknown }>;

type PaginatedConnection<T> = {
  items?: (T | null | undefined)[] | null;
  nextToken?: string | null;
};

export type PaginatedQueryOptions<T> = {
  baseQuery: PaginatedBaseQuery;
  document: string;
  variables?: Record<string, unknown>;
  connectionExtractor: (data: unknown) => PaginatedConnection<T> | null | undefined;
  errorMessage: string;
};

export type PaginatedQueryResult<T> =
  | { data: T[]; error?: undefined }
  | { error: GraphQLBaseQueryError; data?: undefined };

export async function executePaginatedQuery<T>(
  options: PaginatedQueryOptions<T>,
): Promise<PaginatedQueryResult<T>> {
  const { baseQuery, document, variables = {}, connectionExtractor, errorMessage } = options;
  const items: T[] = [];
  let nextToken: string | null = null;

  do {
    const result = await baseQuery({
      document,
      variables: { ...variables, nextToken },
    });

    if (result.error) {
      return { error: result.error as GraphQLBaseQueryError };
    }

    const connection = connectionExtractor(result.data);

    if (!connection) {
      return { error: { message: errorMessage } };
    }

    items.push(
      ...(connection.items?.filter((item): item is T => item !== null && item !== undefined) ?? []),
    );
    nextToken = connection.nextToken ?? null;
  } while (nextToken);

  return { data: items };
}
