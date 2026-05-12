import { AuthContext } from "@app/providers/auth/AuthContext";
import useCognitoUser from "@entities/staff/model/useCognitoUser";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import { dailyReportsByStaffId } from "@shared/api/graphql/documents/queries";
import type { DailyReportsByStaffIdQuery } from "@shared/api/graphql/types";
import { ModelSortDirection } from "@shared/api/graphql/types";
import { GraphQLResult } from "aws-amplify/api";
import { useCallback, useContext, useEffect, useState } from "react";

import { mapDailyReport, sortReports } from "../dailyReportHelpers";
import type { DailyReportItem } from "../dailyReportTypes";

const buildDisplayName = (family?: string | null, given?: string | null) =>
  [family, given]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ");

export function useDailyReportData(resolvedAuthorName: string) {
  const { cognitoUser, loading: isCognitoUserLoading } = useCognitoUser();
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs } = useStaffs({ isAuthenticated });

  const [reports, setReports] = useState<DailyReportItem[]>([]);
  const [authorName, setAuthorName] = useState<string>("");
  const [staffId, setStaffId] = useState<string | null>(null);
  const [isInitialViewPending, setIsInitialViewPending] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (isCognitoUserLoading) {
      return;
    }

    if (!cognitoUser?.id) {
      setAuthorName("スタッフ");
      setStaffId(null);
      setIsInitialViewPending(false);
      return;
    }

    const currentUser = cognitoUser;
    let mounted = true;

    async function load() {
      try {
        const staff = await fetchStaff(currentUser.id);
        if (!mounted) return;
        const staffName = buildDisplayName(
          staff?.familyName ?? null,
          staff?.givenName ?? null,
        );
        const fallback = buildDisplayName(
          currentUser.familyName ?? null,
          currentUser.givenName ?? null,
        );
        setAuthorName(staffName || fallback || "スタッフ");
        setStaffId(staff?.id ?? null);
        if (!staff?.id) {
          setIsInitialViewPending(false);
        }
      } catch {
        if (!mounted) return;
        const fallback = buildDisplayName(
          currentUser.familyName ?? null,
          currentUser.givenName ?? null,
        );
        setAuthorName(fallback || "スタッフ");
        setStaffId(null);
        setIsInitialViewPending(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [cognitoUser, isCognitoUserLoading]);

  const fetchReports = useCallback(async () => {
    if (!staffId) {
      setReports([]);
      setRequestError(null);
      setIsInitialViewPending(false);
      return;
    }

    setRequestError(null);
    try {
      const aggregated: DailyReportItem[] = [];
      let nextToken: string | null | undefined;

      do {
        const response = (await graphqlClient.graphql({
          query: dailyReportsByStaffId,
          variables: {
            staffId,
            sortDirection: ModelSortDirection.DESC,
            limit: 50,
            nextToken,
          },
          authMode: "userPool",
        })) as GraphQLResult<DailyReportsByStaffIdQuery>;

        if (response.errors?.length) {
          throw new Error(
            response.errors.map((error) => error.message).join("\n"),
          );
        }

        const items =
          response.data?.dailyReportsByStaffId?.items?.filter(
            (item): item is NonNullable<typeof item> => item !== null,
          ) ?? [];

        items.forEach((item) => {
          aggregated.push(mapDailyReport(item, resolvedAuthorName));
        });

        nextToken = response.data?.dailyReportsByStaffId?.nextToken;
      } while (nextToken);

      setReports(sortReports(aggregated));
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "日報の取得に失敗しました。",
      );
    } finally {
      setIsInitialViewPending(false);
    }
  }, [resolvedAuthorName, staffId]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  return {
    authorName,
    staffId,
    staffs,
    reports,
    setReports,
    requestError,
    setRequestError,
    isInitialViewPending,
  };
}
