import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  buildVersionOrUpdatedAtCondition,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import {
  createAppConfig,
  updateAppConfig,
} from "@shared/api/graphql/documents/mutations";
import { listAppConfigs } from "@shared/api/graphql/documents/queries";
import {
  AppConfig,
  CreateAppConfigInput,
  CreateAppConfigMutation,
  ListAppConfigsQuery,
  ModelAppConfigConditionInput,
  UpdateAppConfigInput,
  UpdateAppConfigMutation,
} from "@shared/api/graphql/types";
import { GraphQLResult } from "aws-amplify/api";

export class AppConfigDataManager {
  async fetch(name: string = "default") {
    const response = (await graphqlClient.graphql({
      query: listAppConfigs,
      variables: { filter: { name: { eq: name } } },
      authMode: "apiKey",
    })) as GraphQLResult<ListAppConfigsQuery>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.listAppConfigs) {
      throw new Error("Failed to fetch app config");
    }

    const appConfigs: AppConfig[] = response.data.listAppConfigs.items.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );

    // 1件以上のデータがある場合は、エラーを投げる
    if (appConfigs.length > 1) {
      throw new Error("Multiple app configs found");
    }

    return appConfigs[0] || null;
  }

  async create(input: CreateAppConfigInput) {
    const response = (await graphqlClient.graphql({
      query: createAppConfig,
      variables: { input },
      authMode: "apiKey",
    })) as GraphQLResult<CreateAppConfigMutation>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.createAppConfig) {
      throw new Error("Failed to create app config");
    }

    const appConfig: AppConfig = response.data.createAppConfig;
    return appConfig;
  }

  async update(input: Omit<UpdateAppConfigInput, "id">) {
    const current = await this.fetch(input.name ?? "default");
    if (!current?.id) {
      throw new Error("Failed to fetch current app config");
    }

    const condition: ModelAppConfigConditionInput | undefined =
      buildVersionOrUpdatedAtCondition(current?.version, current?.updatedAt);

    const response = (await graphqlClient.graphql({
      query: updateAppConfig,
      variables: {
        input: {
          id: current.id,
          ...input,
          version: getNextVersion(current?.version),
        },
        condition,
      },
      authMode: "apiKey",
    })) as GraphQLResult<UpdateAppConfigMutation>;

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data?.updateAppConfig) {
      throw new Error("Failed to update app config");
    }

    const appConfig: AppConfig = response.data.updateAppConfig;
    return appConfig;
  }
}
