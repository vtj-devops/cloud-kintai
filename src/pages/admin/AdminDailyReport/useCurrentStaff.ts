import type { CognitoUser } from "@entities/staff/model/useCognitoUser";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import { useEffect, useState } from "react";

type CurrentStaff = {
  currentStaffId: string | null;
  currentStaffName: string;
  isResolving: boolean;
};

export function useCurrentStaff(
  cognitoUser: CognitoUser | null | undefined,
): CurrentStaff {
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [currentStaffName, setCurrentStaffName] = useState<string>("管理者");
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (cognitoUser === undefined) return;

    if (!cognitoUser) {
      setCurrentStaffId(null);
      setCurrentStaffName("管理者");
      setIsResolving(false);
      return;
    }

    let mounted = true;
    setIsResolving(true);

    const resolveStaff = async () => {
      try {
        const staff = await fetchStaff(cognitoUser.id);
        if (!mounted) return;
        if (staff) {
          const name = [staff.familyName, staff.givenName]
            .filter((part): part is string => Boolean(part && part.trim()))
            .join(" ");
          setCurrentStaffId(staff.id);
          setCurrentStaffName(name || "管理者");
        } else {
          setCurrentStaffId(null);
          setCurrentStaffName("管理者");
        }
      } catch {
        if (!mounted) return;
        setCurrentStaffId(null);
        setCurrentStaffName("管理者");
      } finally {
        if (mounted) setIsResolving(false);
      }
    };

    void resolveStaff();
    return () => {
      mounted = false;
    };
  }, [cognitoUser]);

  return { currentStaffId, currentStaffName, isResolving };
}
