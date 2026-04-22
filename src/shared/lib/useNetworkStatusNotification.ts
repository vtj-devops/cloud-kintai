import { useAppDispatchV2 } from "@app/hooks";
import {
  dismissNotification,
  pushNotification,
} from "@shared/lib/store/notificationSlice";
import { useOnlineStatus } from "@shared/lib/useOnlineStatus";
import { useEffect, useRef } from "react";

const NETWORK_OFFLINE_MESSAGE =
  "オフラインです。ネットワーク接続を確認してください。";
const NETWORK_ONLINE_MESSAGE = "ネットワークに再接続しました。";
const NETWORK_OFFLINE_NOTIFICATION_ID = "network-status-offline";
const NETWORK_ONLINE_NOTIFICATION_ID = "network-status-online";
const NETWORK_OFFLINE_DEDUPE_KEY = "network-status-offline";
const NETWORK_ONLINE_DEDUPE_KEY = "network-status-online";

/**
 * ネットワーク状態の変化を監視し、通知として表示する。
 */
export const useNetworkStatusNotification = () => {
  const dispatch = useAppDispatchV2();
  const isOnline = useOnlineStatus();
  const previousStatusRef = useRef<boolean | null>(null);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;

    if (previousStatus === null) {
      previousStatusRef.current = isOnline;

      if (!isOnline) {
        dispatch(
          pushNotification({
            id: NETWORK_OFFLINE_NOTIFICATION_ID,
            dedupeKey: NETWORK_OFFLINE_DEDUPE_KEY,
            tone: "error",
            message: NETWORK_OFFLINE_MESSAGE,
          }),
        );
      }

      return;
    }

    if (previousStatus === isOnline) {
      return;
    }

    previousStatusRef.current = isOnline;

    if (isOnline) {
      dispatch(dismissNotification(NETWORK_OFFLINE_NOTIFICATION_ID));
      dispatch(
        pushNotification({
          id: NETWORK_ONLINE_NOTIFICATION_ID,
          dedupeKey: NETWORK_ONLINE_DEDUPE_KEY,
          tone: "success",
          message: NETWORK_ONLINE_MESSAGE,
        }),
      );
      return;
    }

    dispatch(dismissNotification(NETWORK_ONLINE_NOTIFICATION_ID));
    dispatch(
      pushNotification({
        id: NETWORK_OFFLINE_NOTIFICATION_ID,
        dedupeKey: NETWORK_OFFLINE_DEDUPE_KEY,
        tone: "error",
        message: NETWORK_OFFLINE_MESSAGE,
      }),
    );
  }, [dispatch, isOnline]);
};
