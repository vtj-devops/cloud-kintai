import { AuthContext } from "@app/providers/auth/AuthContext";
import {
  StaffRole,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import { graphqlClient } from "@shared/api/amplify/graphqlClient";
import {
  buildVersionOrUpdatedAtCondition,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import { updateWorkflowNotificationEvent } from "@shared/api/graphql/documents/mutations";
import { workflowNotificationEventsByRecipient } from "@shared/api/graphql/documents/queries";
import {
  onCreateWorkflowNotificationEvent,
  onUpdateWorkflowNotificationEvent,
} from "@shared/api/graphql/documents/subscriptions";
import {
  ModelSortDirection,
  OnCreateWorkflowNotificationEventSubscription,
  OnUpdateWorkflowNotificationEventSubscription,
  UpdateWorkflowNotificationEventMutation,
  WorkflowNotificationEventsByRecipientQuery,
} from "@shared/api/graphql/types";
import { createLogger } from "@shared/lib/logger";
import { GraphQLResult } from "aws-amplify/api";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

const logger = createLogger("useWorkflowNotificationInbox");
const NOTIFICATION_PAGE_SIZE = 10;

type WorkflowNotificationEvent = NonNullable<
  NonNullable<
    WorkflowNotificationEventsByRecipientQuery["workflowNotificationEventsByRecipient"]
  >["items"][number]
>;

const sortByEventAtDesc = (
  left: WorkflowNotificationEvent,
  right: WorkflowNotificationEvent,
) => new Date(right.eventAt).getTime() - new Date(left.eventAt).getTime();

export const useWorkflowNotificationInbox = () => {
  const { authStatus, cognitoUser, isCognitoUserRole } =
    useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { staffs } = useStaffs({ isAuthenticated });

  const [notifications, setNotifications] = useState<
    WorkflowNotificationEvent[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextTokensByRecipient, setNextTokensByRecipient] = useState<
    Record<string, string | null>
  >({});

  const currentStaffId = useMemo(() => {
    if (!isAuthenticated || !cognitoUser?.id) return null;
    return (
      staffs.find((staff) => staff.cognitoUserId === cognitoUser.id)?.id ?? null
    );
  }, [cognitoUser?.id, isAuthenticated, staffs]);

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

  const adminGroupReadStorageKey = useMemo(
    () =>
      cognitoUser?.id
        ? `workflowNotificationRead.workflowComment.${cognitoUser.id}`
        : null,
    [cognitoUser?.id],
  );

  const getLocallyReadAdminIds = useCallback(() => {
    if (!adminGroupReadStorageKey || typeof window === "undefined") {
      return new Set<string>();
    }

    try {
      const raw = window.localStorage.getItem(adminGroupReadStorageKey);
      if (!raw) {
        return new Set<string>();
      }
      const parsed = JSON.parse(raw) as string[];
      if (!Array.isArray(parsed)) {
        return new Set<string>();
      }
      return new Set(
        parsed.filter((id): id is string => typeof id === "string"),
      );
    } catch {
      return new Set<string>();
    }
  }, [adminGroupReadStorageKey]);

  const saveLocallyReadAdminIds = useCallback(
    (ids: Set<string>) => {
      if (!adminGroupReadStorageKey || typeof window === "undefined") {
        return;
      }
      window.localStorage.setItem(
        adminGroupReadStorageKey,
        JSON.stringify([...ids]),
      );
    },
    [adminGroupReadStorageKey],
  );

  const markAdminGroupEventAsReadLocally = useCallback(
    (eventId: string) => {
      const current = getLocallyReadAdminIds();
      if (current.has(eventId)) {
        return false;
      }
      current.add(eventId);
      saveLocallyReadAdminIds(current);
      return true;
    },
    [getLocallyReadAdminIds, saveLocallyReadAdminIds],
  );

  const applyLocalReadState = useCallback(
    (items: WorkflowNotificationEvent[]) => {
      const locallyReadAdminIds = getLocallyReadAdminIds();
      return items.map((item) => {
        if (
          item.recipientStaffId === "ADMINS" &&
          locallyReadAdminIds.has(item.id)
        ) {
          return { ...item, isRead: true };
        }
        return item;
      });
    },
    [getLocallyReadAdminIds],
  );

  const fetchNotificationPage = useCallback(
    async (
      recipientStaffId: string,
      options?: { nextToken?: string | null },
    ) => {
      const response = (await graphqlClient.graphql({
        query: workflowNotificationEventsByRecipient,
        variables: {
          recipientStaffId,
          sortDirection: ModelSortDirection.DESC,
          limit: NOTIFICATION_PAGE_SIZE,
          nextToken: options?.nextToken ?? null,
        },
        authMode: "userPool",
      })) as GraphQLResult<WorkflowNotificationEventsByRecipientQuery>;

      if (response.errors?.length) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.workflowNotificationEventsByRecipient;
    },
    [],
  );

  const toUniqueSorted = useCallback((items: WorkflowNotificationEvent[]) => {
    const dedupedMap = new Map<string, WorkflowNotificationEvent>();
    items.forEach((item) => {
      dedupedMap.set(item.id, item);
    });
    return [...dedupedMap.values()].toSorted(sortByEventAtDesc);
  }, []);

  const fetchUnreadCountForRecipients = useCallback(
    async (recipientStaffIds: string[]) => {
      if (recipientStaffIds.length === 0) {
        setUnreadCount(0);
        return;
      }

      let total = 0;
      for (const recipientStaffId of recipientStaffIds) {
        let recipientTotal = 0;
        let cursor: string | null = null;

        do {
          const response = (await graphqlClient.graphql({
            query: workflowNotificationEventsByRecipient,
            variables: {
              recipientStaffId,
              sortDirection: ModelSortDirection.DESC,
              limit: 100,
              nextToken: cursor,
              filter: {
                isRead: { eq: false },
              },
            },
            authMode: "userPool",
          })) as GraphQLResult<WorkflowNotificationEventsByRecipientQuery>;

          if (response.errors?.length) {
            throw new Error(response.errors[0].message);
          }

          const connection =
            response.data?.workflowNotificationEventsByRecipient;
          const pageItems =
            connection?.items.filter(
              (item): item is WorkflowNotificationEvent => Boolean(item),
            ) ?? [];
          if (recipientStaffId === "ADMINS") {
            const locallyReadAdminIds = getLocallyReadAdminIds();
            recipientTotal += pageItems.filter(
              (item) => !locallyReadAdminIds.has(item.id),
            ).length;
          } else {
            recipientTotal += pageItems.length;
          }
          cursor = connection?.nextToken ?? null;
        } while (cursor);

        total += recipientTotal;
      }

      setUnreadCount(total);
    },
    [],
  );

  const fetchUnreadIdsForRecipient = useCallback(
    async (recipientStaffId: string) => {
      const ids: string[] = [];
      let cursor: string | null = null;

      do {
        const response = (await graphqlClient.graphql({
          query: workflowNotificationEventsByRecipient,
          variables: {
            recipientStaffId,
            sortDirection: ModelSortDirection.DESC,
            limit: 100,
            nextToken: cursor,
            filter: {
              isRead: { eq: false },
            },
          },
          authMode: "userPool",
        })) as GraphQLResult<WorkflowNotificationEventsByRecipientQuery>;

        if (response.errors?.length) {
          throw new Error(response.errors[0].message);
        }

        const connection = response.data?.workflowNotificationEventsByRecipient;
        const pageIds =
          connection?.items
            .filter((item): item is WorkflowNotificationEvent => Boolean(item))
            .map((item) => item.id) ?? [];
        ids.push(...pageIds);
        cursor = connection?.nextToken ?? null;
      } while (cursor);

      return ids;
    },
    [],
  );

  const fetchNotifications = useCallback(async () => {
    if (recipientIds.length === 0) {
      setNotifications([]);
      setUnreadCount(0);
      setNextTokensByRecipient({});
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const pages = await Promise.all(
        recipientIds.map(async (recipientId) => {
          const connection = await fetchNotificationPage(recipientId);
          const items =
            connection?.items.filter(
              (item): item is WorkflowNotificationEvent => Boolean(item),
            ) ?? [];
          return {
            recipientId,
            items,
            nextToken: connection?.nextToken ?? null,
          };
        }),
      );

      setNotifications(
        toUniqueSorted(
          applyLocalReadState(pages.flatMap((page) => page.items)),
        ),
      );
      setNextTokensByRecipient(
        pages.reduce<Record<string, string | null>>((acc, page) => {
          acc[page.recipientId] = page.nextToken;
          return acc;
        }, {}),
      );
      await fetchUnreadCountForRecipients(recipientIds);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : String(fetchError);
      setError(message);
      logger.error("Failed to fetch workflow notifications:", message);
    } finally {
      setLoading(false);
    }
  }, [
    fetchNotificationPage,
    fetchUnreadCountForRecipients,
    recipientIds,
    toUniqueSorted,
    applyLocalReadState,
  ]);

  const loadMoreNotifications = useCallback(async () => {
    if (recipientIds.length === 0 || loadingMore) {
      return;
    }

    const targets = recipientIds.filter((recipientId) =>
      Boolean(nextTokensByRecipient[recipientId]),
    );

    if (targets.length === 0) {
      return;
    }

    setLoadingMore(true);
    setError(null);
    try {
      const pages = await Promise.all(
        targets.map(async (recipientId) => {
          const connection = await fetchNotificationPage(recipientId, {
            nextToken: nextTokensByRecipient[recipientId] ?? null,
          });
          const items =
            connection?.items.filter(
              (item): item is WorkflowNotificationEvent => Boolean(item),
            ) ?? [];
          return {
            recipientId,
            items,
            nextToken: connection?.nextToken ?? null,
          };
        }),
      );

      setNotifications((previous) =>
        toUniqueSorted(
          applyLocalReadState([
            ...previous,
            ...pages.flatMap((page) => page.items),
          ]),
        ),
      );
      setNextTokensByRecipient((previous) => {
        const next = { ...previous };
        pages.forEach((page) => {
          next[page.recipientId] = page.nextToken;
        });
        return next;
      });
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : String(fetchError);
      setError(message);
      logger.error("Failed to load more workflow notifications:", message);
    } finally {
      setLoadingMore(false);
    }
  }, [
    fetchNotificationPage,
    loadingMore,
    nextTokensByRecipient,
    recipientIds,
    toUniqueSorted,
    applyLocalReadState,
  ]);

  const applyIncomingEvent = useCallback(
    (incoming: WorkflowNotificationEvent) => {
      const locallyReadAdminIds = getLocallyReadAdminIds();
      const normalizedIncoming =
        incoming.recipientStaffId === "ADMINS" &&
        locallyReadAdminIds.has(incoming.id)
          ? { ...incoming, isRead: true }
          : incoming;

      setNotifications((previous) => {
        const index = previous.findIndex(
          (item) => item.id === normalizedIncoming.id,
        );
        const previousEvent = index >= 0 ? previous[index] : null;

        if (!previousEvent && !normalizedIncoming.isRead) {
          setUnreadCount((prev) => prev + 1);
        }

        if (
          previousEvent &&
          previousEvent.isRead &&
          !normalizedIncoming.isRead
        ) {
          setUnreadCount((prev) => prev + 1);
        }

        if (
          previousEvent &&
          !previousEvent.isRead &&
          normalizedIncoming.isRead
        ) {
          setUnreadCount((prev) => Math.max(prev - 1, 0));
        }

        if (index >= 0) {
          const next = [...previous];
          next[index] = normalizedIncoming;
          return next.toSorted(sortByEventAtDesc);
        }
        return [normalizedIncoming, ...previous].toSorted(sortByEventAtDesc);
      });
    },
    [getLocallyReadAdminIds],
  );

  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find(
        (notification) => notification.id === id,
      );

      if (target?.recipientStaffId === "ADMINS") {
        const marked = markAdminGroupEventAsReadLocally(id);
        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : notification,
          ),
        );
        if (marked && !target.isRead) {
          setUnreadCount((prev) => Math.max(prev - 1, 0));
        }
        return;
      }

      const readAt = new Date().toISOString();
      const response = (await graphqlClient.graphql({
        query: updateWorkflowNotificationEvent,
        variables: {
          condition: buildVersionOrUpdatedAtCondition(
            target?.version,
            target?.updatedAt,
          ),
          input: {
            id,
            isRead: true,
            readAt,
            version: getNextVersion(target?.version),
          },
        },
        authMode: "userPool",
      })) as GraphQLResult<UpdateWorkflowNotificationEventMutation>;

      if (response.errors?.length) {
        throw new Error(response.errors[0].message);
      }

      let decremented = false;
      setNotifications((previous) =>
        previous.map((notification) => {
          if (notification.id !== id) {
            return notification;
          }

          if (!notification.isRead) {
            decremented = true;
          }

          return { ...notification, isRead: true, readAt };
        }),
      );

      if (decremented) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    },
    [markAdminGroupEventAsReadLocally, notifications],
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIdsByRecipient = await Promise.all(
      recipientIds.map((recipientId) =>
        fetchUnreadIdsForRecipient(recipientId),
      ),
    );
    const unreadIds = [...new Set(unreadIdsByRecipient.flat())];

    await Promise.all(unreadIds.map((id) => markAsRead(id)));
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, isRead: true })),
    );
    await fetchUnreadCountForRecipients(recipientIds);
  }, [
    fetchUnreadCountForRecipients,
    fetchUnreadIdsForRecipient,
    markAsRead,
    recipientIds,
  ]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (recipientIds.length === 0) {
      return;
    }

    const subscriptions = recipientIds.flatMap((recipientStaffId) => {
      const filter = {
        recipientStaffId: { eq: recipientStaffId },
      };

      const createSubscription = graphqlClient
        .graphql({
          query: onCreateWorkflowNotificationEvent,
          variables: { filter },
          authMode: "userPool",
        })
        .subscribe({
          next: ({ data }) => {
            const event = (
              data as OnCreateWorkflowNotificationEventSubscription | undefined
            )?.onCreateWorkflowNotificationEvent;
            if (!event) return;
            applyIncomingEvent(event as WorkflowNotificationEvent);
          },
          error: (subscriptionError) => {
            logger.error("Create workflow notification subscription error:", {
              recipientStaffId,
              subscriptionError,
            });
          },
        });

      const updateSubscription = graphqlClient
        .graphql({
          query: onUpdateWorkflowNotificationEvent,
          variables: { filter },
          authMode: "userPool",
        })
        .subscribe({
          next: ({ data }) => {
            const event = (
              data as OnUpdateWorkflowNotificationEventSubscription | undefined
            )?.onUpdateWorkflowNotificationEvent;
            if (!event) return;
            applyIncomingEvent(event as WorkflowNotificationEvent);
          },
          error: (subscriptionError) => {
            logger.error("Update workflow notification subscription error:", {
              recipientStaffId,
              subscriptionError,
            });
          },
        });

      return [createSubscription, updateSubscription];
    });

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [applyIncomingEvent, recipientIds]);

  return {
    currentStaffId,
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore: Object.values(nextTokensByRecipient).some((value) =>
      Boolean(value),
    ),
    error,
    fetchNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
  };
};
