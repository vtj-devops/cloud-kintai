import { type CognitoUser } from "@entities/staff/model/useCognitoUser";
import {
  loadShiftPatterns,
  saveShiftPatterns,
} from "@shared/lib/storage/shiftPatternStorage";
import { AppNotificationInput } from "@shared/lib/useAppNotification";
import { Dayjs } from "dayjs";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";

import * as MESSAGE_CODE from "@/errors";

import { ShiftRequestPattern } from "./shiftRequestPattern";
import { normalizeStatus, SelectedDateMap, ShiftRequestDayStatus } from "./statusMapping";

type UseShiftPatternsParams = {
  cognitoUser: CognitoUser | null | undefined;
  cognitoUserLoading: boolean;
  days: Dayjs[];
  setSelectedDates: Dispatch<SetStateAction<SelectedDateMap>>;
  notify: (input: AppNotificationInput) => void;
  defaultMapping: Record<number, ShiftRequestDayStatus>;
};

export function useShiftPatterns({
  cognitoUser,
  cognitoUserLoading,
  days,
  setSelectedDates,
  notify,
  defaultMapping,
}: UseShiftPatternsParams) {
  const [patterns, setPatterns] = useState<ShiftRequestPattern[]>([]);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [patternDialogOpen, setPatternDialogOpen] = useState(false);
  const [newPatternDialogOpen, setNewPatternDialogOpen] = useState(false);
  const [newPatternName, setNewPatternName] = useState("");
  const [newPatternMapping, setNewPatternMapping] = useState(defaultMapping);

  useEffect(() => {
    setNewPatternMapping(defaultMapping);
  }, [defaultMapping]);

  useEffect(() => {
    if (cognitoUserLoading) {
      return;
    }

    if (!cognitoUser) {
      setPatterns([]);
      setPatternsLoading(false);
      return;
    }

    setPatternsLoading(true);
    let isMounted = true;
    const fetchPatterns = async () => {
      try {
        const stored = await loadShiftPatterns();
        if (!isMounted) return;

        setPatterns(
          stored.map((pattern) => ({
            id: pattern.id,
            name: pattern.name,
            mapping: Object.fromEntries(
              Object.entries(pattern.mapping).map(([weekday, status]) => [
                Number(weekday),
                normalizeStatus(status),
              ]),
            ) as Record<number, ShiftRequestDayStatus>,
          })),
        );
      } catch (error) {
        if (!isMounted) return;

        console.error("Failed to load shift patterns", error);
        setPatterns([]);
        notify({
          title: "エラー",
          description: MESSAGE_CODE.E00001,
          tone: "error",
          dedupeKey: "shift-pattern-load-error",
        });
      } finally {
        if (isMounted) {
          setPatternsLoading(false);
        }
      }
    };

    void fetchPatterns();

    return () => {
      isMounted = false;
    };
  }, [cognitoUser, cognitoUserLoading, notify]);

  const serializePatterns = useCallback(
    (patternList: ShiftRequestPattern[]) =>
      patternList.map((pattern) => ({
        id: pattern.id,
        name: pattern.name,
        mapping: Object.fromEntries(
          Object.entries(pattern.mapping).map(([weekday, status]) => [
            String(weekday),
            status,
          ]),
        ),
      })),
    [],
  );

  const persistPatterns = useCallback(
    async (nextPatterns: ShiftRequestPattern[]) => {
      setPatterns(nextPatterns);
      if (cognitoUserLoading || !cognitoUser) {
        return;
      }

      try {
        await saveShiftPatterns(serializePatterns(nextPatterns));
      } catch (error) {
        console.error("Failed to save shift patterns", error);
        notify({
          title: "エラー",
          description: MESSAGE_CODE.E00001,
          tone: "error",
          dedupeKey: "shift-pattern-save-error",
        });
      }
    },
    [cognitoUser, cognitoUserLoading, notify, serializePatterns],
  );

  const applyPattern = useCallback(
    (pattern: ShiftRequestPattern) => {
      const next: SelectedDateMap = {};
      days.forEach((day) => {
        const status = normalizeStatus(pattern.mapping[day.day()]);
        next[day.format("YYYY-MM-DD")] = { status };
      });
      setSelectedDates(next);
      setPatternDialogOpen(false);
    },
    [days, setSelectedDates],
  );

  const deletePattern = useCallback(
    (id: string) => {
      void persistPatterns(patterns.filter((pattern) => pattern.id !== id));
    },
    [patterns, persistPatterns],
  );

  const createPattern = useCallback(() => {
    if (!newPatternName) return;

    const nextPattern: ShiftRequestPattern = {
      id: String(Date.now()),
      name: newPatternName,
      mapping: newPatternMapping,
    };
    void persistPatterns([nextPattern, ...patterns]);
    setNewPatternDialogOpen(false);
    setNewPatternName("");
  }, [newPatternMapping, newPatternName, patterns, persistPatterns]);

  const openPatternDialog = useCallback(() => {
    setPatternDialogOpen(true);
  }, []);

  const closePatternDialog = useCallback(() => {
    setPatternDialogOpen(false);
  }, []);

  const closeNewPatternDialog = useCallback(() => {
    setNewPatternDialogOpen(false);
  }, []);

  const openCreateDialog = useCallback(() => {
    setPatternDialogOpen(false);
    setNewPatternDialogOpen(true);
  }, []);

  return {
    patterns,
    patternsLoading,
    patternDialogOpen,
    newPatternDialogOpen,
    newPatternName,
    newPatternMapping,
    setNewPatternName,
    setNewPatternMapping,
    openPatternDialog,
    closePatternDialog,
    closeNewPatternDialog,
    openCreateDialog,
    applyPattern,
    deletePattern,
    createPattern,
  };
}
