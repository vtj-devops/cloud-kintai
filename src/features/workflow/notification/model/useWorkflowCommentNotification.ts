import { AuthContext } from "@app/providers/auth/AuthContext";
import {
  StaffRole,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import { subscribeWorkflowCommentNotifications } from "@features/workflow/notification/model/workflowNotificationEventService";
import { createLogger } from "@shared/lib/logger";
import { useAppNotification } from "@shared/lib/useAppNotification";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";

const logger = createLogger("useWorkflowCommentNotification");

export const useWorkflowCommentNotification = (enabled = true) => {
  const { authStatus, cognitoUser, isCognitoUserRole } =
    useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated" && enabled;
  const { staffs } = useStaffs({ isAuthenticated });
  const { notify } = useAppNotification();
  const notifiedEventIdsRef = useRef<Set<string>>(new Set());

  const currentStaffId = (() => {
    if (!isAuthenticated || !cognitoUser?.id) return null;
    return (
      staffs.find((staff) => staff.cognitoUserId === cognitoUser.id)?.id ?? null
    );
  })();

  const isAdminWatcher = useMemo(
    () =>
      isCognitoUserRole(StaffRole.ADMIN) ||
      isCognitoUserRole(StaffRole.STAFF_ADMIN) ||
      isCognitoUserRole(StaffRole.OWNER),
    [isCognitoUserRole],
  );

  const recipientIds = useMemo(() => {
    const selfIds = [currentStaffId, cognitoUser?.id].filter(
      (id): id is string => Boolean(id),
    );

    if (!isAdminWatcher) {
      return selfIds.filter((id, index, list) => list.indexOf(id) === index);
    }

    return [...selfIds, "ADMINS"].filter(
      (id, index, list) => list.indexOf(id) === index,
    );
  }, [cognitoUser?.id, currentStaffId, isAdminWatcher]);

  const handleNotification = useCallback(
    (eventId: string, title: string, body: string) => {
      if (notifiedEventIdsRef.current.has(eventId)) return;

      notifiedEventIdsRef.current.add(eventId);
      notify({
        title,
        description: body,
        tone: "info",
        dedupeKey: `workflow-comment-event-${eventId}`,
      });
    },
    [notify],
  );

  useEffect(() => {
    if (!enabled || recipientIds.length === 0) {
      return;
    }

    logger.info("Starting global workflow comment notification subscription", {
      recipientStaffIds: recipientIds,
    });

    const unsubscribes = recipientIds.map((recipientStaffId) =>
      subscribeWorkflowCommentNotifications({
        recipientStaffId,
        onReceived: (event) => {
          handleNotification(event.id, event.title, event.body);
        },
        onError: (error) => {
          logger.error("Global workflow comment notification error:", {
            recipientStaffId,
            error,
          });
        },
      }),
    );

    return () => {
      logger.info(
        "Stopping global workflow comment notification subscription",
        {
          recipientStaffIds: recipientIds,
        },
      );
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [enabled, handleNotification, recipientIds]);

  return {
    isSubscribed: enabled && recipientIds.length > 0,
  };
};
