import { createApi } from "@reduxjs/toolkit/query/react";
import {
  createWorkflowTemplate,
  deleteWorkflowTemplate,
  updateWorkflowTemplate,
} from "@shared/api/graphql/documents/mutations";
import { listWorkflowTemplates } from "@shared/api/graphql/documents/queries";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";
import { executePaginatedQuery } from "@shared/api/graphql/paginatedQuery";
import type {
  CreateWorkflowTemplateInput,
  CreateWorkflowTemplateMutation,
  DeleteWorkflowTemplateInput,
  DeleteWorkflowTemplateMutation,
  ListWorkflowTemplatesQuery,
  ListWorkflowTemplatesQueryVariables,
  ModelWorkflowTemplateConditionInput,
  UpdateWorkflowTemplateInput,
  UpdateWorkflowTemplateMutation,
  WorkflowTemplate,
} from "@shared/api/graphql/types";

export type UpdateWorkflowTemplatePayload = {
  input: UpdateWorkflowTemplateInput;
  condition?: ModelWorkflowTemplateConditionInput | null;
};

type WorkflowTemplateTag = {
  type: "WorkflowTemplate";
  id: string;
};

type GetWorkflowTemplatesArg = {
  organizationId: string;
};

const buildTemplateTagId = (template: { id?: string | null }) =>
  template.id ?? "unknown";

export const workflowTemplateApi = createApi({
  reducerPath: "workflowTemplateApi",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["WorkflowTemplate"],
  endpoints: (builder) => ({
    getWorkflowTemplates: builder.query<
      WorkflowTemplate[],
      GetWorkflowTemplatesArg
    >({
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const result = await executePaginatedQuery<WorkflowTemplate>({
          baseQuery,
          document: listWorkflowTemplates,
          variables: {
            filter: { organizationId: { eq: arg.organizationId } },
          } satisfies Omit<ListWorkflowTemplatesQueryVariables, "nextToken">,
          connectionExtractor: (data) =>
            (data as ListWorkflowTemplatesQuery | null)?.listWorkflowTemplates,
          errorMessage: "Failed to fetch workflow templates",
        });

        if (result.error) {
          return { error: result.error };
        }

        return {
          data: result.data.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)),
        };
      },
      providesTags: (result) => {
        const listTag: WorkflowTemplateTag = {
          type: "WorkflowTemplate",
          id: "LIST",
        };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          ...result.map((template) => ({
            type: "WorkflowTemplate" as const,
            id: buildTemplateTagId(template),
          })),
        ];
      },
    }),
    createWorkflowTemplate: builder.mutation<
      WorkflowTemplate,
      CreateWorkflowTemplateInput
    >({
      async queryFn(input, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: createWorkflowTemplate,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as CreateWorkflowTemplateMutation | null;
        const created = data?.createWorkflowTemplate;

        if (!created) {
          return { error: { message: "Failed to create workflow template" } };
        }

        return { data: created };
      },
      invalidatesTags: [{ type: "WorkflowTemplate", id: "LIST" }],
    }),
    updateWorkflowTemplate: builder.mutation<
      WorkflowTemplate,
      UpdateWorkflowTemplatePayload
    >({
      async queryFn({ input, condition }, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: updateWorkflowTemplate,
          variables: {
            input,
            condition: condition ?? undefined,
          },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as UpdateWorkflowTemplateMutation | null;
        const updated = data?.updateWorkflowTemplate;

        if (!updated) {
          return { error: { message: "Failed to update workflow template" } };
        }

        return { data: updated };
      },
      invalidatesTags: (result) => {
        const listTag: WorkflowTemplateTag = {
          type: "WorkflowTemplate",
          id: "LIST",
        };
        if (!result) {
          return [listTag];
        }

        return [
          listTag,
          { type: "WorkflowTemplate" as const, id: buildTemplateTagId(result) },
        ];
      },
    }),
    deleteWorkflowTemplate: builder.mutation<
      WorkflowTemplate,
      DeleteWorkflowTemplateInput
    >({
      async queryFn(input, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: deleteWorkflowTemplate,
          variables: { input },
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as DeleteWorkflowTemplateMutation | null;
        const deleted = data?.deleteWorkflowTemplate;

        if (!deleted) {
          return { error: { message: "Failed to delete workflow template" } };
        }

        return { data: deleted };
      },
      invalidatesTags: (result, _error, arg) => {
        const listTag: WorkflowTemplateTag = {
          type: "WorkflowTemplate",
          id: "LIST",
        };
        const targetId = arg.id ?? buildTemplateTagId(result ?? {});
        return [listTag, { type: "WorkflowTemplate", id: targetId }];
      },
    }),
  }),
});

export const {
  useGetWorkflowTemplatesQuery,
  useCreateWorkflowTemplateMutation,
  useUpdateWorkflowTemplateMutation,
  useDeleteWorkflowTemplateMutation,
} = workflowTemplateApi;
