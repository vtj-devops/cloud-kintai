import { createApi } from "@reduxjs/toolkit/query/react";
import {
  createShiftRequest,
  updateShiftRequest,
} from "@shared/api/graphql/documents/mutations";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";
import type {
  CreateShiftRequestInput,
  CreateShiftRequestMutation,
  ModelShiftRequestConditionInput,
  ModelShiftRequestFilterInput,
  ShiftRequest,
  ShiftRequestsByStaffIdQueryVariables,
  ShiftRequestStatus,
  UpdateShiftRequestInput,
  UpdateShiftRequestMutation,
} from "@shared/api/graphql/types";

export type ShiftRequestLite = {
  id: string;
  staffId: string;
  targetMonth: string;
  entries?: Array<{
    date: string;
    status: ShiftRequestStatus;
    isLocked?: boolean | null;
  } | null> | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version?: number | null;
};

type ListShiftRequestsLiteQuery = {
  listShiftRequests?: {
    items?: Array<ShiftRequestLite | null> | null;
    nextToken?: string | null;
  } | null;
};

type ShiftRequestsByStaffIdLiteQuery = {
  shiftRequestsByStaffId?: {
    items?: Array<ShiftRequestLite | null> | null;
    nextToken?: string | null;
  } | null;
};

const listShiftRequestsLite = /* GraphQL */ `
  query ListShiftRequestsLite(
    $filter: ModelShiftRequestFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listShiftRequests(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        staffId
        targetMonth
        entries {
          date
          status
          isLocked
        }
        updatedAt
        updatedBy
        version
      }
      nextToken
    }
  }
`;

const shiftRequestsByStaffIdLite = /* GraphQL */ `
  query ShiftRequestsByStaffIdLite(
    $staffId: ID!
    $targetMonth: ModelStringKeyConditionInput
    $sortDirection: ModelSortDirection
    $limit: Int
  ) {
    shiftRequestsByStaffId(
      staffId: $staffId
      targetMonth: $targetMonth
      sortDirection: $sortDirection
      limit: $limit
    ) {
      items {
        id
        staffId
        targetMonth
        entries {
          date
          status
          isLocked
        }
        updatedAt
        updatedBy
        version
      }
      nextToken
    }
  }
`;

export type ShiftRequestsQueryArgs = {
  staffIds: string[];
  targetMonth: string;
};

export type ShiftRequestQueryArgs = {
  staffId: string;
  targetMonth: string;
};

export type UpdateShiftRequestPayload = {
  input: UpdateShiftRequestInput;
  condition?: ModelShiftRequestConditionInput | null;
};

export type CreateShiftRequestPayload = {
  input: CreateShiftRequestInput;
  condition?: ModelShiftRequestConditionInput | null;
};

export type BatchUpdateShiftCellsArgs = {
  updates: UpdateShiftRequestPayload[];
};

export type BatchUpdateShiftCellsResult = {
  updatedRequests: ShiftRequest[];
  errors: Array<{ index: number; message: string }>;
};

type ShiftRequestTag = {
  type: "ShiftRequest";
  id: string;
};

type ShiftCollaborationTag = {
  type: "ShiftCollaboration";
  id: string;
};

export const nonNullable = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const buildShiftRequestTagId = (request: { id?: string | null }) =>
  request.id ?? "unknown";

export const buildShiftRequestsFilter = ({
  staffIds,
  targetMonth,
}: ShiftRequestsQueryArgs): ModelShiftRequestFilterInput => {
  if (staffIds.length === 0) {
    return { targetMonth: { eq: targetMonth } };
  }

  if (staffIds.length === 1) {
    return {
      staffId: { eq: staffIds[0] },
      targetMonth: { eq: targetMonth },
    };
  }

  return {
    targetMonth: { eq: targetMonth },
    or: staffIds.map((staffId) => ({ staffId: { eq: staffId } })),
  };
};

const getErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Failed to update shift request";
};

export const shiftApi = createApi({
  reducerPath: "shiftApi",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["ShiftRequest", "ShiftCollaboration"],
  endpoints: (builder) => ({
    getShiftRequests: builder.query<ShiftRequestLite[], ShiftRequestsQueryArgs>(
      {
        async queryFn(arg, _api, _extraOptions, baseQuery) {
          if (arg.staffIds.length === 0) {
            return { data: [] };
          }

          const shiftRequests: ShiftRequestLite[] = [];
          let nextToken: string | null = null;
          const filter = buildShiftRequestsFilter(arg);

          do {
            const result = await baseQuery({
              document: listShiftRequestsLite,
              variables: { filter, limit: 200, nextToken },
            });

            if (result.error) {
              return { error: result.error };
            }

            const data = result.data as ListShiftRequestsLiteQuery | null;
            const connection = data?.listShiftRequests;

            if (!connection) {
              return { error: { message: "Failed to fetch shift requests" } };
            }

            shiftRequests.push(
              ...(connection.items?.filter(nonNullable) ?? []),
            );
            nextToken = connection.nextToken ?? null;
          } while (nextToken);

          return { data: shiftRequests };
        },
        serializeQueryArgs: ({ queryArgs }) => ({
          ...queryArgs,
          staffIds: queryArgs.staffIds.toSorted(),
        }),
        providesTags: (result, _error, arg) => {
          const listTag: ShiftRequestTag = { type: "ShiftRequest", id: "LIST" };
          const collaborationTag: ShiftCollaborationTag = {
            type: "ShiftCollaboration",
            id: arg.targetMonth,
          };

          if (!result) {
            return [listTag, collaborationTag];
          }

          return [
            listTag,
            collaborationTag,
            ...result.map((shiftRequest) => ({
              type: "ShiftRequest" as const,
              id: buildShiftRequestTagId(shiftRequest),
            })),
          ];
        },
      },
    ),
    getShiftRequest: builder.query<
      ShiftRequestLite | null,
      ShiftRequestQueryArgs
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: shiftRequestsByStaffIdLite,
          variables: {
            staffId: arg.staffId,
            targetMonth: { eq: arg.targetMonth },
            limit: 1,
            sortDirection: "DESC",
          } as ShiftRequestsByStaffIdQueryVariables,
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as ShiftRequestsByStaffIdLiteQuery | null;
        const item =
          data?.shiftRequestsByStaffId?.items?.find(nonNullable) ?? null;

        return { data: item };
      },
      providesTags: (result, _error, arg) => {
        const listTag: ShiftRequestTag = { type: "ShiftRequest", id: "LIST" };
        const collaborationTag: ShiftCollaborationTag = {
          type: "ShiftCollaboration",
          id: arg.targetMonth,
        };

        if (!result) {
          return [listTag, collaborationTag];
        }

        return [
          listTag,
          collaborationTag,
          { type: "ShiftRequest" as const, id: buildShiftRequestTagId(result) },
        ];
      },
    }),
    updateShiftCell: builder.mutation<ShiftRequest, UpdateShiftRequestPayload>({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: updateShiftRequest,
          variables: {
            input: arg.input,
            condition: arg.condition ?? undefined,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as UpdateShiftRequestMutation | null;
        const updated = data?.updateShiftRequest;

        if (!updated) {
          return { error: { message: "Failed to update shift request" } };
        }

        return { data: updated };
      },
      invalidatesTags: (result, _error, arg) => {
        // LISTタグを削除してキャッシュを保持し、テーブル全体の再描画を防止
        // 特定のレコードと月タグのみ無効化
        if (!result) {
          return [];
        }

        return [
          { type: "ShiftRequest" as const, id: buildShiftRequestTagId(result) },
          {
            type: "ShiftCollaboration" as const,
            id: arg.input.targetMonth ?? "UNKNOWN",
          },
        ];
      },
    }),
    createShiftRequest: builder.mutation<
      ShiftRequest,
      CreateShiftRequestPayload
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: createShiftRequest,
          variables: {
            input: arg.input,
            condition: arg.condition ?? undefined,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as CreateShiftRequestMutation | null;
        const created = data?.createShiftRequest;

        if (!created) {
          return { error: { message: "Failed to create shift request" } };
        }

        return { data: created };
      },
      invalidatesTags: (result, _error, arg) => {
        // LISTタグを削除してキャッシュを保持し、テーブル全体の再描画を防止
        // 特定のレコードと月タグのみ無効化
        if (!result) {
          return [];
        }

        return [
          { type: "ShiftRequest" as const, id: buildShiftRequestTagId(result) },
          {
            type: "ShiftCollaboration" as const,
            id: arg.input.targetMonth ?? "UNKNOWN",
          },
        ];
      },
    }),
    batchUpdateShiftCells: builder.mutation<
      BatchUpdateShiftCellsResult,
      BatchUpdateShiftCellsArgs
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        if (arg.updates.length === 0) {
          return { data: { updatedRequests: [], errors: [] } };
        }

        const updatedRequests: ShiftRequest[] = [];
        const errors: Array<{ index: number; message: string }> = [];

        for (const [index, update] of arg.updates.entries()) {
          const result = await baseQuery({
            document: updateShiftRequest,
            variables: {
              input: update.input,
              condition: update.condition ?? undefined,
            },
          });

          if (result.error) {
            errors.push({
              index,
              message: getErrorMessage(result.error),
            });
            continue;
          }

          const data = result.data as UpdateShiftRequestMutation | null;
          const updated = data?.updateShiftRequest;

          if (!updated) {
            errors.push({
              index,
              message: "Failed to update shift request",
            });
            continue;
          }

          updatedRequests.push(updated);
        }

        if (errors.length > 0 && updatedRequests.length === 0) {
          return { error: { message: errors[0].message } };
        }

        return { data: { updatedRequests, errors } };
      },
      invalidatesTags: (result, _error, arg) => {
        // LISTタグを削除してキャッシュを保持し、テーブル全体の再描画を防止
        // 更新されたレコードと月タグのみ無効化
        if (!result || result.updatedRequests.length === 0) {
          return [];
        }

        const targetMonth = arg.updates[0]?.input.targetMonth ?? "UNKNOWN";

        return [
          ...result.updatedRequests.map((shiftRequest) => ({
            type: "ShiftRequest" as const,
            id: buildShiftRequestTagId(shiftRequest),
          })),
          { type: "ShiftCollaboration" as const, id: targetMonth },
        ];
      },
    }),
  }),
});

export const {
  useGetShiftRequestsQuery,
  useGetShiftRequestQuery,
  useUpdateShiftCellMutation,
  useBatchUpdateShiftCellsMutation,
  useCreateShiftRequestMutation,
} = shiftApi;
