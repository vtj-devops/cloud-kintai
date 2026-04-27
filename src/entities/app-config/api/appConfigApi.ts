import { logOperationEvent } from "@entities/operation-log/model/canonicalOperationLog";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  createAppConfig,
  updateAppConfig,
} from "@shared/api/graphql/documents/mutations";
import { listAppConfigs } from "@shared/api/graphql/documents/queries";
import { graphqlBaseQuery } from "@shared/api/graphql/graphqlBaseQuery";
import { buildListAndItemTags } from "@shared/api/graphql/tagBuilder";
import type {
  AppConfig,
  CreateAppConfigInput,
  CreateAppConfigMutation,
  ListAppConfigsQuery,
  ModelAppConfigConditionInput,
  UpdateAppConfigInput,
  UpdateAppConfigMutation,
} from "@shared/api/graphql/types";
import { type UpdatePayload } from "@shared/api/graphql/updatePayload";

export type UpdateAppConfigPayload = UpdatePayload<UpdateAppConfigInput, ModelAppConfigConditionInput>;

// Exported for testing
export const nonNullable = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const appConfigApi = createApi({
  reducerPath: "appConfigApi",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["AppConfig"],
  endpoints: (builder) => ({
    getAppConfig: builder.query<AppConfig | null, { name?: string } | void>({
      async queryFn(arg, _queryApi, _extraOptions, baseQuery) {
        const name = arg?.name ?? "default";
        const result = await baseQuery({
          document: listAppConfigs,
          variables: {
            filter: { name: { eq: name } },
          },
          authMode: "apiKey",
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as ListAppConfigsQuery | null;
        const items = data?.listAppConfigs?.items?.filter(nonNullable) ?? [];

        if (items.length > 1) {
          return { error: { message: "Multiple app configs found" } };
        }

        return { data: items[0] ?? null };
      },
      providesTags: (result) =>
        buildListAndItemTags(
          "AppConfig",
          result ? [result] : undefined,
          (r) => r.id ?? "unknown",
        ),
    }),
    createAppConfig: builder.mutation<AppConfig, CreateAppConfigInput>({
      async queryFn(input, _queryApi, _extraOptions, baseQuery) {
        const result = await baseQuery({
          document: createAppConfig,
          variables: { input },
          authMode: "apiKey",
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as CreateAppConfigMutation | null;
        const created = data?.createAppConfig;

        if (!created) {
          return { error: { message: "Failed to create app config" } };
        }

        await logOperationEvent({
          action: "app_config.create",
          resource: "app_config",
          resourceId: created.id,
          before: null,
          after: created,
          details: {
            name: created.name,
          },
        });

        return { data: created };
      },
      invalidatesTags: [{ type: "AppConfig", id: "LIST" }],
    }),
    updateAppConfig: builder.mutation<AppConfig, UpdateAppConfigPayload>({
      async queryFn({ input, condition }, _queryApi, _extraOptions, baseQuery) {
        const currentResult = await baseQuery({
          document: listAppConfigs,
          variables: {
            filter: { name: { eq: input.name ?? "default" } },
          },
          authMode: "apiKey",
        });

        if (currentResult.error) {
          return { error: currentResult.error };
        }

        const currentData = currentResult.data as ListAppConfigsQuery | null;
        const current =
          currentData?.listAppConfigs?.items?.filter(nonNullable)[0];

        const result = await baseQuery({
          document: updateAppConfig,
          variables: {
            input,
            condition: condition ?? undefined,
          },
          authMode: "apiKey",
        });

        if (result.error) {
          return { error: result.error };
        }

        const data = result.data as UpdateAppConfigMutation | null;
        const updated = data?.updateAppConfig;

        if (!updated) {
          return { error: { message: "Failed to update app config" } };
        }

        await logOperationEvent({
          action: "app_config.update",
          resource: "app_config",
          resourceId: updated.id,
          before: current ?? null,
          after: updated,
          details: {
            name: updated.name,
          },
        });

        return { data: updated };
      },
      invalidatesTags: (result) =>
        buildListAndItemTags(
          "AppConfig",
          result ? [result] : undefined,
          (r) => r.id ?? "unknown",
        ),
    }),
  }),
});

export const {
  useGetAppConfigQuery,
  useCreateAppConfigMutation,
  useUpdateAppConfigMutation,
} = appConfigApi;
