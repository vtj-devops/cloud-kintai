import { useCallback, useEffect, useState } from "react";

/**
 * オンライン/オフラインステータスを監視するフック
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  /**
   * オンライン状態になった時の処理
   */
  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  /**
   * オフライン状態になった時の処理
   */
  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return isOnline;
};
