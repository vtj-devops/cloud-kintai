import { logOperationEvent } from "@entities/operation-log/model/canonicalOperationLog";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  createStaff,
  deleteStaff,
  updateStaff,
} from "@shared/api/graphql/documents/mutations";
import { getStaff, listStaff } from "@shared/api/graphql/documents/queries";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";
import { executePaginatedQuery } from "@shared/api/graphql/paginatedQuery";
import { buildListAndItemTags } from "@shared/api/graphql/tagBuilder";
import type {
  CreateStaffInput,
  CreateStaffMutation,
  DeleteStaffInput,
  DeleteStaffMutation,
  GetStaffQuery,
  ListStaffQuery,
  ModelStaffConditionInput,
  Staff,
  UpdateStaffInput,
  UpdateStaffMutation,
} from "@shared/api/graphql/types";
import { type UpdatePayload } from "@shared/api/graphql/updatePayload";


export type UpdateStaffPayload = UpdatePayload<UpdateStaffInput, ModelStaffConditionInput>;

const buildStaffTagId = (staff: { id?: string | null }) =>
  staff.id ?? "unknown";

export const staffApi = createApi({
  reducerPath: "staffApi",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["Staff"],
  endpoints: (builder) => ({
    getStaffs: builder.query<Staff[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        return executePaginatedQuery<Staff>({
          baseQuery,
          document: listStaff,
          variables: { limit: 100 },
          connectionExtractor: (data) => (data as ListStaffQuery | null)?.listStaff,
          errorMessage: "Failed to fetch staffs",
        });
      },
      providesTags: (result) =>
        buildListAndItemTags("Staff", result, buildStaffTagId),
    }),
    createStaff: builder.mutation<Staff, CreateStaffInput>({
      async queryFn(input, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: createStaff,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as CreateStaffMutation | null;
        const created = data?.createStaff;
        if (!created) {
          return { error: { message: "Failed to create staff" } };
        }

        await logOperationEvent({
          action: "staff.create",
          resource: "staff",
          resourceId: created.id,
          targetStaffId: created.cognitoUserId,
          before: null,
          after: created,
          details: {
            cognitoUserId: created.cognitoUserId,
            role: created.role,
          },
        });

        return { data: created };
      },
      invalidatesTags: (result) =>
        buildListAndItemTags("Staff", result ? [result] : undefined, buildStaffTagId),
    }),
    updateStaff: builder.mutation<Staff, UpdateStaffPayload>({
      async queryFn({ input, condition }, _api, _extraOptions, baseQuery) {
        const currentResult = await baseQuery({
          document: getStaff,
          variables: { id: input.id },
        });

        if (currentResult.error) {
          return { error: currentResult.error };
        }

        const currentData = currentResult.data as GetStaffQuery | null;
        const currentStaff = currentData?.getStaff;
        if (!currentStaff) {
          return { error: { message: "Failed to load current staff" } };
        }

        const result = await baseQuery({
          document: updateStaff,
          variables: {
            input,
            condition: condition ?? undefined,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as UpdateStaffMutation | null;
        const updated = data?.updateStaff;
        if (!updated) {
          return { error: { message: "Failed to update staff" } };
        }

        const action =
          currentStaff.enabled !== updated.enabled
            ? updated.enabled
              ? "staff.enable"
              : "staff.disable"
            : "staff.update";

        await logOperationEvent({
          action,
          resource: "staff",
          resourceId: updated.id,
          targetStaffId: updated.cognitoUserId,
          before: currentStaff,
          after: updated,
          details: {
            cognitoUserId: updated.cognitoUserId,
            role: updated.role,
          },
        });

        return { data: updated };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedStaff } = await queryFulfilled;
          dispatch(
            staffApi.util.updateQueryData("getStaffs", undefined, (draft) => {
              const targetIndex = draft.findIndex(
                (staff) => staff.id === updatedStaff.id,
              );
              if (targetIndex < 0) {
                draft.push(updatedStaff);
                return;
              }
              draft[targetIndex] = updatedStaff;
            }),
          );
        } catch {
          // noop
        }
      },
      invalidatesTags: () => [],
    }),
    deleteStaff: builder.mutation<Staff, DeleteStaffInput>({
      async queryFn(input, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: deleteStaff,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as DeleteStaffMutation | null;
        const deleted = data?.deleteStaff;
        if (!deleted) {
          return { error: { message: "Failed to delete staff" } };
        }

        await logOperationEvent({
          action: "staff.delete",
          resource: "staff",
          resourceId: deleted.id,
          targetStaffId: deleted.cognitoUserId,
          before: deleted,
          after: null,
          details: {
            cognitoUserId: deleted.cognitoUserId,
            role: deleted.role,
          },
        });

        return { data: deleted };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            staffApi.util.updateQueryData("getStaffs", undefined, (draft) =>
              draft.filter((staff) => staff.id !== arg.id),
            ),
          );
        } catch {
          // noop
        }
      },
      invalidatesTags: () => [{ type: "Staff", id: "LIST" }],
    }),
  }),
});

export const {
  useGetStaffsQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} = staffApi;
