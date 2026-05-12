import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useCallback } from "react";

/**
 * Hook that wraps a delete function with a confirmation dialog and notification.
 *
 * @param message - Confirmation message to show to the user.
 * @param deleteFn - Async function that performs the deletion.
 * @param successMessage - Message to show on successful deletion.
 * @param errorMessage - Message to show on failure.
 * @returns A function that triggers the flow.
 */
export function useDeleteWithConfirm<TInput>(
  message: string,
  deleteFn: (input: TInput) => Promise<void>,
  successMessage: string,
  errorMessage: string
) {
  const onDelete = useCallback(
    async (input: TInput) => {
      const confirmed = window.confirm(message);
      if (!confirmed) return;
      try {
        await deleteFn(input);
        pushNotification({ tone: "success", message: successMessage });
      } catch {
        pushNotification({ tone: "error", message: errorMessage });
      }
    },
    [message, deleteFn, successMessage, errorMessage]
  );
  return onDelete;
}

export default useDeleteWithConfirm;
