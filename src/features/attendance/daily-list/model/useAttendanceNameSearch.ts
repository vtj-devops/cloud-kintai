import { AttendanceDaily } from "@entities/attendance/model/useAttendanceDaily";
import { ChangeEvent, useCallback, useMemo, useState } from "react";

export function useAttendanceNameSearch(list: AttendanceDaily[]) {
  const [searchName, setSearchName] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const filteredAttendanceList = useMemo(() => {
    if (!searchName) {
      return list;
    }

    return list.filter((row) => {
      const fullName = `${row.familyName || ""}${row.givenName || ""}`;
      return fullName.includes(searchName);
    });
  }, [list, searchName]);

  const handleSearchToggle = useCallback(() => {
    setIsSearchVisible((prev) => {
      const next = !prev;
      if (!next) {
        setSearchName("");
      }
      return next;
    });
  }, []);

  const handleSearchNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchName(event.target.value);
    },
    [],
  );

  return {
    searchName,
    isSearchVisible,
    filteredAttendanceList,
    handleSearchToggle,
    handleSearchNameChange,
  };
}
