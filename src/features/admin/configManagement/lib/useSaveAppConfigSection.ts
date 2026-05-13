import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useCallback,useContext } from "react";

import { E14001, S14001, S14002 } from "@/errors";

type SaveOptions = {
  validate?: () => boolean;
  onInvalid?: () => void;
};

export function useSaveAppConfigSection() {
  const { getConfigId, saveConfig, fetchConfig } = useContext(AppConfigContext);
  const dispatch = useAppDispatchV2();

  return useCallback(
    async <TPayload extends Record<string, unknown>>(
      payload: TPayload,
      options?: SaveOptions,
    ) => {
      if (options?.validate && !options.validate()) {
        options.onInvalid?.();
        return;
      }

      const configId = getConfigId();

      try {
        if (configId) {
          await saveConfig({
            id: configId,
            ...payload,
          } as UpdateAppConfigInput);
          dispatch(
            pushNotification({
              tone: "success",
              message: S14002,
            }),
          );
        } else {
          await saveConfig({
            name: "default",
            ...payload,
          } as CreateAppConfigInput);
          dispatch(
            pushNotification({
              tone: "success",
              message: S14001,
            }),
          );
        }

        await fetchConfig();
      } catch {
        dispatch(
          pushNotification({
            tone: "error",
            message: E14001,
          }),
        );
      }
    },
    [dispatch, fetchConfig, getConfigId, saveConfig],
  );
}
