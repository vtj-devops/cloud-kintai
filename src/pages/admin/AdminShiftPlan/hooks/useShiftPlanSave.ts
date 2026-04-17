import { useAppDispatchV2 } from "@app/hooks";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  buildVersionOrUpdatedAtCondition,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import {
  createShiftPlanYear,
  updateShiftPlanYear,
} from "@shared/api/graphql/documents/mutations";
import {
  CreateShiftPlanYearMutation,
  CreateShiftPlanYearMutationVariables,
  UpdateShiftPlanYearMutation,
  UpdateShiftPlanYearMutationVariables,
} from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { GraphQLResult } from "aws-amplify/api";
import dayjs from "dayjs";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { convertRowsToPlanInput, ShiftPlanRow, TIME_FORMAT } from "../shiftPlanUtils";
import type { ShiftPlanRecordMeta } from "./useShiftPlanData";

type UseShiftPlanSaveParams = {
  selectedYear: number;
  currentRows: ShiftPlanRow[];
  setSavedYearlyPlans: Dispatch<SetStateAction<Record<number, ShiftPlanRow[]>>>;
};

export type UseShiftPlanSaveReturn = {
  yearRecordIds: Record<number, ShiftPlanRecordMeta>;
  setYearRecordIds: Dispatch<SetStateAction<Record<number, ShiftPlanRecordMeta>>>;
  isSaving: boolean;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  lastAutoSaveTime: string | null;
  performSave: (
    rows: ShiftPlanRow[],
    year: number,
    recordIds: Record<number, ShiftPlanRecordMeta>,
    showNotification?: boolean,
  ) => Promise<boolean>;
  handleSaveAll: () => Promise<void>;
};

export const useShiftPlanSave = ({
  selectedYear,
  currentRows,
  setSavedYearlyPlans,
}: UseShiftPlanSaveParams): UseShiftPlanSaveReturn => {
  const dispatch = useAppDispatchV2();
  const [isSaving, setIsSaving] = useState(false);
  const [yearRecordIds, setYearRecordIds] = useState<
    Record<number, ShiftPlanRecordMeta>
  >({});
  const yearRecordIdsRef = useRef<Record<number, ShiftPlanRecordMeta>>({});
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);

  useEffect(() => {
    yearRecordIdsRef.current = yearRecordIds;
  }, [yearRecordIds]);

  const performSave = useCallback(
    async (
      rows: ShiftPlanRow[],
      year: number,
      recordIds: Record<number, ShiftPlanRecordMeta>,
      showNotification = true,
    ): Promise<boolean> => {
      const queuedSave = saveQueueRef.current.then(async () => {
        try {
          const plansInput = convertRowsToPlanInput(rows);
          const latestRecordIds = yearRecordIdsRef.current;
          const existingRecord = latestRecordIds[year] ?? recordIds[year];
          if (existingRecord) {
            const response = (await graphqlClient.graphql({
              query: updateShiftPlanYear,
              variables: {
                input: {
                  id: existingRecord.id,
                  targetYear: year,
                  plans: plansInput,
                  version: getNextVersion(existingRecord.version),
                },
                condition: buildVersionOrUpdatedAtCondition(
                  existingRecord.version,
                  existingRecord.updatedAt,
                ),
              } as UpdateShiftPlanYearMutationVariables,
              authMode: "userPool",
            })) as GraphQLResult<UpdateShiftPlanYearMutation>;
            if (response.errors?.length) {
              throw new Error(
                response.errors.map((e) => e.message).join(","),
              );
            }
            const updatedRecord = response.data?.updateShiftPlanYear;
            if (!updatedRecord?.id) {
              throw new Error("シフト計画の更新結果が取得できませんでした。");
            }
            const nextRecordIds = {
              ...yearRecordIdsRef.current,
              [year]: {
                id: updatedRecord.id,
                version: updatedRecord.version,
                updatedAt: updatedRecord.updatedAt,
              },
            };
            yearRecordIdsRef.current = nextRecordIds;
            setYearRecordIds(nextRecordIds);
          } else {
            const response = (await graphqlClient.graphql({
              query: createShiftPlanYear,
              variables: {
                input: {
                  targetYear: year,
                  plans: plansInput,
                  version: 1,
                },
              } as CreateShiftPlanYearMutationVariables,
              authMode: "userPool",
            })) as GraphQLResult<CreateShiftPlanYearMutation>;
            if (response.errors?.length) {
              throw new Error(
                response.errors.map((e) => e.message).join(","),
              );
            }
            const createdRecord = response.data?.createShiftPlanYear;
            if (!createdRecord?.id) {
              throw new Error("シフト計画の作成結果が取得できませんでした。");
            }
            const nextRecordIds = {
              ...yearRecordIdsRef.current,
              [year]: {
                id: createdRecord.id,
                version: createdRecord.version,
                updatedAt: createdRecord.updatedAt,
              },
            };
            yearRecordIdsRef.current = nextRecordIds;
            setYearRecordIds(nextRecordIds);
          }
          if (showNotification) {
            dispatch(
              pushNotification({
                tone: "success",
                message: `${year}年の申請期間を保存しました。`,
              }),
            );
          }
          setSavedYearlyPlans((prev) => ({
            ...prev,
            [year]: rows.map((row) => ({ ...row })),
          }));
          setLastAutoSaveTime(dayjs().format(TIME_FORMAT));
          return true;
        } catch (error) {
          console.error(error);
          if (showNotification) {
            dispatch(
              pushNotification({
                tone: "error",
                message: "シフト計画の保存に失敗しました。",
              }),
            );
          }
          return false;
        }
      });
      saveQueueRef.current = queuedSave.then(
        () => undefined,
        () => undefined,
      );
      return queuedSave;
    },
    [dispatch, setSavedYearlyPlans],
  );

  const handleSaveAll = useCallback(async () => {
    for (const row of currentRows) {
      if (!row.enabled) continue;
      const label = `${selectedYear}年${row.month}月`;
      if (!row.editStart || !row.editEnd) {
        dispatch(
          pushNotification({
            tone: "error",
            message: `${label}の入力が未完了です。`,
          }),
        );
        return;
      }
      if (dayjs(row.editStart).isAfter(dayjs(row.editEnd))) {
        dispatch(
          pushNotification({
            tone: "error",
            message: `${label}は開始日が終了日より後になっています。`,
          }),
        );
        return;
      }
    }
    setIsSaving(true);
    try {
      await performSave(currentRows, selectedYear, yearRecordIds, true);
    } finally {
      setIsSaving(false);
    }
  }, [currentRows, dispatch, performSave, selectedYear, yearRecordIds]);

  return {
    yearRecordIds,
    setYearRecordIds,
    isSaving,
    setIsSaving,
    lastAutoSaveTime,
    performSave,
    handleSaveAll,
  };
};
