import { useEffect, useState } from "react";

import {
  CloseDate,
  CreateCloseDateInput,
  DeleteCloseDateInput,
  UpdateCloseDateInput,
} from "../../API";
import createCloseDateData from "./createCloseDateData";
import deleteCloseDateData from "./deleteCloseDateData";
import fetchCloseDates from "./fetchCloseDates";
import updateCloseDateData from "./updateCloseDateData";

export default function useCloseDates() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [closeDates, setCloseDates] = useState<CloseDate[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchCloseDates()
      .then((res) => {
        setCloseDates(res);
      })
      .catch((e: Error) => {
        setError(e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const createCloseDate = async (input: CreateCloseDateInput) =>
    createCloseDateData(input)
      .then((res) => {
        setCloseDates((prev) => [...prev, res]);
      })
      .catch((e) => {
        throw e;
      });

  const updateCloseDate = async (input: UpdateCloseDateInput) =>
    updateCloseDateData(input)
      .then((res) => {
        setCloseDates((prev) => {
          const index = prev.findIndex((c) => c?.id === res?.id);
          if (index === -1) {
            return prev;
          }
          const next = [...prev];
          next[index] = res;
          return next;
        });
      })
      .catch((e) => {
        throw e;
      });

  const deleteCloseDate = async (input: DeleteCloseDateInput) =>
    deleteCloseDateData(input)
      .then((res) => {
        setCloseDates((prev) => {
          const index = prev.findIndex((c) => c?.id === res?.id);
          if (index === -1) {
            return prev;
          }
          const next = [...prev];
          next.splice(index, 1);
          return next;
        });
      })
      .catch((e) => {
        throw e;
      });

  return {
    loading,
    error,
    closeDates,
    createCloseDate,
    updateCloseDate,
    deleteCloseDate,
  };
}
