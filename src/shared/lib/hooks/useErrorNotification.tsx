import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

/**
 * Hook that dispatches a pushNotification when an error occurs.
 *
 * @param error The error object or boolean flag indicating an error.
 * @param message The message to display. If omitted, a generic message is used.
 * @param tone The tone of the notification. Defaults to "error".
 */
export function useErrorNotification(
  error: unknown,
  message?: string,
  tone: "error" | "warning" | "info" | "success" = "error"
): void {
  const dispatch = useDispatch();
  useEffect(() => {
    if (!error) return;
    const msg = typeof message === "string" ? message : "An error occurred.";
    dispatch(pushNotification({ tone, message: msg }));
  }, [error, message, tone, dispatch]);
}

export default useErrorNotification;
