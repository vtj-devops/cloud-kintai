import {
  useCreateWorkflowTemplateMutation,
  useDeleteWorkflowTemplateMutation,
  useGetWorkflowTemplatesQuery,
  useUpdateWorkflowTemplateMutation,
} from "@entities/workflow-template/api/workflowTemplateApi";
import type {
  CreateWorkflowTemplateInput,
  UpdateWorkflowTemplateInput,
  WorkflowTemplate,
} from "@shared/api/graphql/types";
import { useCallback } from "react";

type UseWorkflowTemplatesParams = {
  isAuthenticated: boolean;
  organizationId: string;
};

const extractErrorMessage = (error: unknown) => {
  if (!error) {
    return null;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  if (typeof error === "string") {
    return error;
  }

  return null;
};

export default function useWorkflowTemplates({
  isAuthenticated,
  organizationId,
}: UseWorkflowTemplatesParams) {
  const {
    data,
    isLoading: isQueryLoading,
    isFetching: isQueryFetching,
    error: queryError,
    refetch,
  } = useGetWorkflowTemplatesQuery(
    { organizationId },
    {
      skip: !isAuthenticated || !organizationId,
    },
  );

  const [
    createTemplateMutation,
    { isLoading: isCreating, error: createError },
  ] = useCreateWorkflowTemplateMutation();
  const [
    updateTemplateMutation,
    { isLoading: isUpdating, error: updateError },
  ] = useUpdateWorkflowTemplateMutation();
  const [
    deleteTemplateMutation,
    { isLoading: isDeleting, error: deleteError },
  ] = useDeleteWorkflowTemplateMutation();

  const templates: WorkflowTemplate[] = data ?? [];
  const loading =
    isQueryLoading || isQueryFetching || isCreating || isUpdating || isDeleting;
  const errorMessage =
    extractErrorMessage(queryError) ??
    extractErrorMessage(createError) ??
    extractErrorMessage(updateError) ??
    extractErrorMessage(deleteError) ??
    null;

  const fetchTemplates = useCallback(async () => {
    if (!isAuthenticated || !organizationId) {
      return;
    }
    await refetch();
  }, [isAuthenticated, organizationId, refetch]);

  const createTemplate = useCallback(
    async (input: Omit<CreateWorkflowTemplateInput, "organizationId">) => {
      if (!isAuthenticated || !organizationId) {
        throw new Error("User is not authenticated");
      }
      const created = await createTemplateMutation({
        ...input,
        organizationId,
      }).unwrap();
      return created;
    },
    [createTemplateMutation, isAuthenticated, organizationId],
  );

  const updateTemplate = useCallback(
    async (input: UpdateWorkflowTemplateInput) => {
      if (!isAuthenticated || !organizationId) {
        throw new Error("User is not authenticated");
      }
      const updated = await updateTemplateMutation(input).unwrap();
      return updated;
    },
    [isAuthenticated, organizationId, updateTemplateMutation],
  );

  const removeTemplate = useCallback(
    async (id: string) => {
      if (!isAuthenticated || !organizationId) {
        throw new Error("User is not authenticated");
      }
      await deleteTemplateMutation({ id }).unwrap();
    },
    [deleteTemplateMutation, isAuthenticated, organizationId],
  );

  return {
    templates,
    loading,
    error: errorMessage,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    removeTemplate,
  };
}
