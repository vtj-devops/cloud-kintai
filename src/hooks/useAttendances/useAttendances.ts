import { useState } from "react";

import { Attendance } from "../../API";
import fetchAttendances from "./fetchAttendances";

export default function useAttendances() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const getAttendances = async (staffId: string) => {
    setLoading(true);
    setAttendances([]);
    setError(null);

    fetchAttendances(staffId)
      .then((res) => {
        setAttendances(res);
        return res;
      })
      .catch((e: Error) => {
        setError(e);
        throw e;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return {
    attendances,
    getAttendances,
    loading,
    error,
  };
}
