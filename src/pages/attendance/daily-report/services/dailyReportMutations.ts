import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  buildVersionOrUpdatedAtCondition,
  getGraphQLErrorMessage,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import {
  createDailyReport,
  updateDailyReport,
} from "@shared/api/graphql/documents/mutations";
import type {
  CreateDailyReportMutation,
  DailyReport,
  UpdateDailyReportMutation,
} from "@shared/api/graphql/types";
import { type GraphQLResult } from "aws-amplify/api";

import type { EditableStatus } from "../dailyReportTypes";

interface DailyReportContentInput {
  reportDate: string;
  title: string;
  content: string;
  status: EditableStatus;
}

interface ConcurrencyState {
  version?: number | null;
  updatedAt?: string | null;
}

interface CreateDailyReportRecordParams extends DailyReportContentInput {
  staffId: string;
}

interface UpdateDailyReportRecordParams extends DailyReportContentInput {
  id: string;
  concurrencyState: ConcurrencyState;
}

const joinGraphQLErrors = (errors: { message?: string | null }[]) =>
  errors.map((error) => error.message).filter(Boolean).join("\n");

export async function createDailyReportRecord({
  staffId,
  reportDate,
  title,
  content,
  status,
}: CreateDailyReportRecordParams): Promise<DailyReport> {
  const response = (await graphqlClient.graphql({
    query: createDailyReport,
    variables: {
      input: {
        staffId,
        reportDate,
        title,
        content,
        status,
        updatedAt: new Date().toISOString(),
        reactions: [],
        comments: [],
      },
    },
    authMode: "userPool",
  })) as GraphQLResult<CreateDailyReportMutation>;

  if (response.errors?.length) {
    throw new Error(joinGraphQLErrors(response.errors));
  }

  const created = response.data?.createDailyReport;
  if (!created) {
    throw new Error("日報の作成に失敗しました。");
  }

  return created;
}

export async function updateDailyReportRecord({
  id,
  reportDate,
  title,
  content,
  status,
  concurrencyState,
}: UpdateDailyReportRecordParams): Promise<DailyReport> {
  const response = (await graphqlClient.graphql({
    query: updateDailyReport,
    variables: {
      input: {
        id,
        reportDate,
        title,
        content,
        status,
        updatedAt: new Date().toISOString(),
        version: getNextVersion(concurrencyState.version),
      },
      condition: buildVersionOrUpdatedAtCondition(
        concurrencyState.version,
        concurrencyState.updatedAt,
      ),
    },
    authMode: "userPool",
  })) as GraphQLResult<UpdateDailyReportMutation>;

  if (response.errors?.length) {
    throw new Error(
      getGraphQLErrorMessage(response.errors, "日報の更新に失敗しました。"),
    );
  }

  const updated = response.data?.updateDailyReport;
  if (!updated) {
    throw new Error("日報の更新に失敗しました。");
  }

  return updated;
}
