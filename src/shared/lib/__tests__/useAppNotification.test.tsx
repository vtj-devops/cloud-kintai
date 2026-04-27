import { configureStore } from "@reduxjs/toolkit";
import notificationReducer from "@shared/lib/store/notificationSlice";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";

import { useAppNotification } from "../useAppNotification";

describe("useAppNotification", () => {
  it("通知を store に enqueue する", () => {
    const store = configureStore({
      reducer: {
        notifications: notificationReducer,
      },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useAppNotification(), { wrapper });

    result.current.notify({
      title: "保存しました",
      description: "データを更新しました",
      tone: "success",
      dedupeKey: "save-success",
    });

    expect(store.getState().notifications.items).toEqual([
      expect.objectContaining({
        message: "保存しました",
        description: "データを更新しました",
        tone: "success",
        dedupeKey: "save-success",
      }),
    ]);
  });
});
