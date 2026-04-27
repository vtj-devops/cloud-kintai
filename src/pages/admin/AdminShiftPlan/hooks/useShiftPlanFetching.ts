import { useAppDispatchV2 } from "@app/hooks";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  shiftPlanYearByTargetYear,
} from "@shared/api/graphql/documents/queries";
import {
  ShiftPlanYearByTargetYearQuery,
  ShiftPlanYearByTargetYearQueryVariables,
} from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { GraphQLResult } from "aws-amplify/api";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { buildRowsFromPlans, ShiftPlanRow } from "../shiftPlanUtils";
import type { ShiftPlanRecordMeta } from "./useShiftPlanData";

type UseShiftPlanFetchingParams = {
  selectedYear: number;
  setYearlyPlans: Dispatch<SetStateAction<Record<number, ShiftPlanRow[]>>>;
  setSavedYearlyPlans: Dispatch<SetStateAction<Record<number, ShiftPlanRow[]>>>;
  setYearRecordIds: Dispatch<SetStateAction<Record<number, ShiftPlanRecordMeta>>>;
};

export type UseShiftPlanFetchingReturn = {
  isFetchingYear: boolean;
};

export const useShiftPlanFetching = ({
  selectedYear,
  setYearlyPlans,
  setSavedYearlyPlans,
  setYearRecordIds,
}: UseShiftPlanFetchingParams): UseShiftPlanFetchingReturn => {
  const dispatch = useAppDispatchV2();
  const [isFetchingYear, setIsFetchingYear] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchYearPlan = async () => {
      setIsFetchingYear(true);
      try {
        const response = (await graphqlClient.graphql({
          query: shiftPlanYearByTargetYear,
          variables: {
            targetYear: selectedYear,
            limit: 1,
          } as ShiftPlanYearByTargetYearQueryVariables,
          authMode: "userPool",
        })) as GraphQLResult<ShiftPlanYearByTargetYearQuery>;
        if (!isMounted) return;
        if (response.errors?.length) {
          throw new Error(response.errors.map((e) => e.message).join(","));
        }
        const record =
          response.data?.shiftPlanYearByTargetYear?.items?.find(
            (item): item is NonNullable<typeof item> => item !== null,
          ) ?? null;
        if (record) {
          setYearlyPlans((prev) => ({
            ...prev,
            [selectedYear]: buildRowsFromPlans(selectedYear, record.plans),
          }));
          setSavedYearlyPlans((prev) => ({
            ...prev,
            [selectedYear]: buildRowsFromPlans(selectedYear, record.plans),
          }));
          setYearRecordIds((prev) => ({
            ...prev,
            [selectedYear]: {
              id: record.id,
              version: record.version,
              updatedAt: record.updatedAt,
            },
          }));
        } else {
          setYearRecordIds((prev) => {
            if (!prev[selectedYear]) return prev;
            const next = { ...prev };
            delete next[selectedYear];
            return next;
          });
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          dispatch(
            pushNotification({
              tone: "error",
              message: "シフト計画の読み込みに失敗しました。",
            }),
          );
        }
      } finally {
        if (isMounted) {
          setIsFetchingYear(false);
        }
      }
    };
    void fetchYearPlan();
    return () => {
      isMounted = false;
    };
  }, [
    dispatch,
    selectedYear,
    setYearlyPlans,
    setSavedYearlyPlans,
    setYearRecordIds,
  ]);

  return { isFetchingYear };
};
