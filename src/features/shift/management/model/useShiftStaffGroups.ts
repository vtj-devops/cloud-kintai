import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import { useContext, useMemo } from "react";

import { ShiftGroupConstraints } from "../lib/shiftGroups";

type StaffGroup = {
  groupName: string;
  description: string;
  members: ReturnType<typeof useStaffs>["staffs"];
  constraints: ShiftGroupConstraints;
};

type UseShiftStaffGroupsResult = {
  staffs: ReturnType<typeof useStaffs>["staffs"];
  shiftStaffs: ReturnType<typeof useStaffs>["staffs"];
  loading: boolean;
  error: ReturnType<typeof useStaffs>["error"];
  shiftGroupDefinitions: {
    label: string;
    description: string;
    min: number | null;
    max: number | null;
    fixed: number | null;
  }[];
  groupedShiftStaffs: StaffGroup[];
  displayedStaffOrder: ReturnType<typeof useStaffs>["staffs"];
  staffIdToIndex: Map<string, number>;
};

export function useShiftStaffGroups(): UseShiftStaffGroupsResult {
  const { getShiftGroups } = useContext(AppConfigContext);
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";

  const { loading, error, staffs } = useStaffs({ isAuthenticated });

  const shiftStaffs = useMemo(
    () => staffs.filter((s) => s.workType === "shift"),
    [staffs],
  );

  const shiftGroupDefinitions = useMemo(
    () =>
      getShiftGroups().map((group) => ({
        label: group.label,
        description: group.description ?? "運用上の調整グループ",
        min: group.min ?? null,
        max: group.max ?? null,
        fixed: group.fixed ?? null,
      })),
    [getShiftGroups],
  );

  const groupedShiftStaffs = useMemo((): StaffGroup[] => {
    if (shiftGroupDefinitions.length === 0) {
      return shiftStaffs.length
        ? [
            {
              groupName: "シフト勤務スタッフ",
              description:
                "シフトグループが未設定のため、全員をまとめて表示しています。",
              members: shiftStaffs,
              constraints: { min: null, max: null, fixed: null },
            },
          ]
        : [];
    }

    const groups = shiftGroupDefinitions.map((definition) => ({
      groupName: definition.label,
      description: definition.description,
      members: [] as typeof shiftStaffs,
      constraints: {
        min: definition.min ?? null,
        max: definition.max ?? null,
        fixed: definition.fixed ?? null,
      } satisfies ShiftGroupConstraints,
    }));
    const groupMap = new Map(groups.map((group) => [group.groupName, group]));
    const unassigned: typeof shiftStaffs = [];

    shiftStaffs.forEach((staff) => {
      if (staff.shiftGroup && groupMap.has(staff.shiftGroup)) {
        groupMap.get(staff.shiftGroup)!.members.push(staff);
      } else {
        unassigned.push(staff);
      }
    });

    return [
      ...groups,
      ...(unassigned.length
        ? [
            {
              groupName: "未割り当て",
              description: "シフトグループが設定されていないメンバーです。",
              members: unassigned,
              constraints: { min: null, max: null, fixed: null },
            },
          ]
        : []),
    ];
  }, [shiftGroupDefinitions, shiftStaffs]);

  const displayedStaffOrder = useMemo(
    () => groupedShiftStaffs.flatMap((group) => group.members),
    [groupedShiftStaffs],
  );

  const staffIdToIndex = useMemo(() => {
    const map = new Map<string, number>();
    displayedStaffOrder.forEach((staff, index) => {
      map.set(staff.id, index);
    });
    return map;
  }, [displayedStaffOrder]);

  return {
    staffs,
    shiftStaffs,
    loading,
    error,
    shiftGroupDefinitions,
    groupedShiftStaffs,
    displayedStaffOrder,
    staffIdToIndex,
  };
}
