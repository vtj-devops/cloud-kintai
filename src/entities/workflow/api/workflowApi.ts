import { createApi } from "@reduxjs/toolkit/query/react";
import {
  createWorkflow,
  deleteWorkflow,
  updateWorkflow,
} from "@shared/api/graphql/documents/mutations";
import {
  getWorkflow as getWorkflowDocument,
  listWorkflows,
} from "@shared/api/graphql/documents/queries";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";
import { executePaginatedQuery } from "@shared/api/graphql/paginatedQuery";
import type {
  CreateWorkflowInput,
  CreateWorkflowMutation,
  DeleteWorkflowInput,
  DeleteWorkflowMutation,
  GetWorkflowQuery,
  ListWorkflowsQuery,
  ModelWorkflowConditionInput,
  UpdateWorkflowInput,
  UpdateWorkflowMutation,
  Workflow,
} from "@shared/api/graphql/types";

export type UpdateWorkflowPayload = {
  input: UpdateWorkflowInput;
  condition?: ModelWorkflowConditionInput | null;
};

type WorkflowTag = {
  type: "Workflow";
  id: string;
};

const buildWorkflowTagId = (workflow: { id?: string | null }) =>
  workflow.id ?? "unknown";

export const workflowApi = createApi({
  reducerPath: "workflowApi",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["Workflow"],
  endpoints: (builder) => ({
    getWorkflow: builder.query<Workflow | null, string>({
      async queryFn(id, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: getWorkflowDocument,
          variables: { id },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as GetWorkflowQuery | null;
        return { data: data?.getWorkflow ?? null };
      },
      providesTags: (_result, _error, id) => [
        { type: "Workflow" as const, id: id ?? "unknown" },
      ],
    }),
    getWorkflows: builder.query<Workflow[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        return executePaginatedQuery<Workflow>({
          baseQuery,
          document: listWorkflows,
          connectionExtractor: (data) => (data as ListWorkflowsQuery | null)?.listWorkflows,
          errorMessage: "Failed to fetch workflows",
        });
      },
      providesTags: (result) => {
        const listTag: WorkflowTag = { type: "Workflow", id: "LIST" };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          ...result.map((workflow) => ({
            type: "Workflow" as const,
            id: buildWorkflowTagId(workflow),
          })),
        ];
      },
    }),
    createWorkflow: builder.mutation<Workflow, CreateWorkflowInput>({
      async queryFn(input, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: createWorkflow,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as CreateWorkflowMutation | null;
        const created = data?.createWorkflow;

        if (!created) {
          return { error: { message: "Failed to create workflow" } };
        }

        return { data: created };
      },
      invalidatesTags: (result) => {
        const listTag: WorkflowTag = { type: "Workflow", id: "LIST" };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          { type: "Workflow" as const, id: buildWorkflowTagId(result) },
        ];
      },
    }),
    updateWorkflow: builder.mutation<Workflow, UpdateWorkflowPayload>({
      async queryFn({ input, condition }, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: updateWorkflow,
          variables: {
            input,
            condition: condition ?? undefined,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as UpdateWorkflowMutation | null;
        const updated = data?.updateWorkflow;

        if (!updated) {
          return { error: { message: "Failed to update workflow" } };
        }

        return { data: updated };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedWorkflow } = await queryFulfilled;
          dispatch(
            workflowApi.util.updateQueryData(
              "getWorkflows",
              undefined,
              (draft) => {
                const targetIndex = draft.findIndex(
                  (workflow) => workflow.id === updatedWorkflow.id,
                );
                if (targetIndex < 0) return;
                draft[targetIndex] = updatedWorkflow;
              },
            ),
          );
          dispatch(
            workflowApi.util.upsertQueryData(
              "getWorkflow",
              updatedWorkflow.id,
              updatedWorkflow,
            ),
          );
        } catch {
          // noop: keep mutation error handling in caller
        }
      },
      invalidatesTags: () => [],
    }),
    deleteWorkflow: builder.mutation<Workflow, DeleteWorkflowInput>({
      async queryFn(input, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: deleteWorkflow,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as DeleteWorkflowMutation | null;
        const deleted = data?.deleteWorkflow;

        if (!deleted) {
          return { error: { message: "Failed to delete workflow" } };
        }

        return { data: deleted };
      },
      invalidatesTags: (result, _error, arg) => {
        const listTag: WorkflowTag = { type: "Workflow", id: "LIST" };
        const targetId = arg.id ?? buildWorkflowTagId(result ?? {});
        return [listTag, { type: "Workflow", id: targetId }];
      },
    }),
  }),
});

export const {
  useGetWorkflowQuery,
  useGetWorkflowsQuery,
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
} = workflowApi;
