import { useAppDispatchV2 } from "@app/hooks";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import type { ShiftDisplayMode } from "@entities/app-config/model/useAppConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { E14001 } from "@/errors";
import {
  buildShiftGroupPayload,
  createShiftGroup,
} from "@/pages/admin/AdminShiftSettings";
import { toShiftGroupFormValue } from "@/pages/admin/AdminShiftSettings/shiftGroupFactory";
import type { ShiftGroupFormState } from "@/pages/admin/AdminShiftSettings/shiftGroupSchema";
import { shiftGroupFormSchema } from "@/pages/admin/AdminShiftSettings/shiftGroupSchema";

const SHIFT_GROUP_ERROR_FIELDS = [
  { key: "label", label: "ラベル名" },
  { key: "min", label: "最小人数" },
  { key: "max", label: "最大人数" },
  { key: "fixed", label: "固定人数" },
] as const;

const SHIFT_DISPLAY_AUTO_SAVE_DELAY = 600;

type UseAdminShiftSettingsOptions = {
  enableShiftDisplayAutoSave?: boolean;
  onShiftGroupSaveSuccess?: (isUpdate: boolean) => void;
  onShiftDisplaySaveSuccess?: (isUpdate: boolean) => void;
};

const getValidationDetails = (errors: {
  shiftGroups?: Array<
    Record<string, { message?: unknown } | undefined>
  >;
}): string[] => {
  const details: string[] = [];
  errors.shiftGroups?.forEach((groupError, index) => {
    if (!groupError) return;
    const messageToLabels = new Map<string, string[]>();
    SHIFT_GROUP_ERROR_FIELDS.forEach(({ key, label }) => {
      const message = groupError[key]?.message;
      if (typeof message !== "string" || message.length === 0) return;
      const labels = messageToLabels.get(message) ?? [];
      if (!labels.includes(label)) labels.push(label);
      messageToLabels.set(message, labels);
    });
    messageToLabels.forEach((labels, message) => {
      details.push(`${index + 1}行目 ${labels.join(" / ")}: ${message}`);
    });
  });
  return details;
};

export function useAdminShiftSettings(options: UseAdminShiftSettingsOptions = {}) {
  const {
    getShiftGroups,
    getConfigId,
    saveConfig,
    fetchConfig,
    getShiftDefaultMode,
  } = useContext(AppConfigContext);
  const dispatch = useAppDispatchV2();

  const [configId, setConfigId] = useState<string | null>(null);
  const [savingShiftGroup, setSavingShiftGroup] = useState(false);
  const [savingShiftDisplay, setSavingShiftDisplay] = useState(false);
  const [shiftDefaultMode, setShiftDefaultMode] =
    useState<ShiftDisplayMode>("normal");
  const [savedShiftDefaultMode, setSavedShiftDefaultMode] =
    useState<ShiftDisplayMode>("normal");
  const enableShiftDisplayAutoSave =
    options.enableShiftDisplayAutoSave ?? true;

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = useForm<ShiftGroupFormState>({
    defaultValues: { shiftGroups: [] },
    resolver: zodResolver(shiftGroupFormSchema),
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "shiftGroups",
  });

  useEffect(() => {
    const initialGroups = getShiftGroups();
    reset({
      shiftGroups: initialGroups.map((group) => toShiftGroupFormValue(group)),
    });
    setConfigId(getConfigId());
    if (typeof getShiftDefaultMode === "function") {
      const nextMode = getShiftDefaultMode();
      setShiftDefaultMode(nextMode);
      setSavedShiftDefaultMode(nextMode);
    }
    void trigger();
  }, [getConfigId, getShiftDefaultMode, getShiftGroups, reset, trigger]);

  const handleAddGroup = () => {
    append(createShiftGroup());
    void trigger();
  };

  const validationDetails = useMemo(
    () =>
      getValidationDetails(
        errors as {
          shiftGroups?: Array<
            Record<string, { message?: unknown } | undefined>
          >;
        },
      ),
    [errors],
  );

  const hasValidationError = validationDetails.length > 0;

  const initialShiftGroupSnapshot = useMemo(
    () =>
      JSON.stringify(
        getShiftGroups().map((group) => ({
          label: group.label ?? "",
          min:
            typeof group.min === "number" && !Number.isNaN(group.min)
              ? String(group.min)
              : "",
          max:
            typeof group.max === "number" && !Number.isNaN(group.max)
              ? String(group.max)
              : "",
          fixed:
            typeof group.fixed === "number" && !Number.isNaN(group.fixed)
              ? String(group.fixed)
              : "",
          description: group.description ?? "",
        })),
      ),
    [getShiftGroups],
  );

  const watchedShiftGroups = watch("shiftGroups");

  const currentShiftGroupSnapshot = useMemo(
    () =>
      JSON.stringify(
        (watchedShiftGroups ?? []).map((field) => ({
          label: field.label ?? "",
          min: field.min ?? "",
          max: field.max ?? "",
          fixed: field.fixed ?? "",
          description: field.description ?? "",
        })),
      ),
    [watchedShiftGroups],
  );

  const isShiftGroupDirty = initialShiftGroupSnapshot !== currentShiftGroupSnapshot;
  const isShiftDisplayDirty = shiftDefaultMode !== savedShiftDefaultMode;
  const isDirty = isShiftGroupDirty || isShiftDisplayDirty;
  const isBusy = savingShiftGroup || savingShiftDisplay;

  const persistConfig = useCallback(
    async (payload: {
      shiftGroups?: ReturnType<typeof buildShiftGroupPayload>;
      shiftCollaborativeEnabled?: boolean;
      shiftDefaultMode?: ShiftDisplayMode;
    }) => {
      const isUpdate = configId !== null;
      if (isUpdate) {
        await saveConfig({
          id: configId,
          ...payload,
        } as UpdateAppConfigInput);
      } else {
        await saveConfig({
          name: "default",
          ...payload,
        } as CreateAppConfigInput);
      }
      await fetchConfig();
      return isUpdate;
    },
    [configId, fetchConfig, saveConfig],
  );

  const shiftDisplaySaveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const shiftGroupSaveHandler = handleSubmit(async (values) => {
    if (savingShiftGroup) return;
    setSavingShiftGroup(true);
    const payloadShiftGroups = buildShiftGroupPayload(values.shiftGroups);
    try {
      const isUpdate = await persistConfig({ shiftGroups: payloadShiftGroups });
      options.onShiftGroupSaveSuccess?.(isUpdate);
      reset(values);
    } catch (error) {
      console.error(error);
      dispatch(pushNotification({ tone: "error", message: E14001 }));
    } finally {
      setSavingShiftGroup(false);
    }
  });
  const shiftDisplaySaveHandler = async () => {
    if (savingShiftDisplay) return;
    setSavingShiftDisplay(true);
    try {
      const isUpdate = await persistConfig({
        shiftCollaborativeEnabled: true,
        shiftDefaultMode,
      });
      options.onShiftDisplaySaveSuccess?.(isUpdate);
      setSavedShiftDefaultMode(shiftDefaultMode);
    } catch (error) {
      console.error(error);
      dispatch(pushNotification({ tone: "error", message: E14001 }));
    } finally {
      setSavingShiftDisplay(false);
    }
  };
  shiftDisplaySaveRef.current = shiftDisplaySaveHandler;

  useEffect(() => {
    if (!enableShiftDisplayAutoSave) return;
    if (!isShiftDisplayDirty) return;
    const id = window.setTimeout(() => {
      void shiftDisplaySaveRef.current();
    }, SHIFT_DISPLAY_AUTO_SAVE_DELAY);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableShiftDisplayAutoSave, shiftDefaultMode, isShiftDisplayDirty]);

  return {
    control,
    fields,
    errors,
    validationDetails,
    hasValidationError,
    savingShiftGroup,
    savingShiftDisplay,
    isShiftGroupDirty,
    isShiftDisplayDirty,
    shiftDefaultMode,
    setShiftDefaultMode,
    isDirty,
    isBusy,
    handleAddGroup,
    handleRemoveGroup: remove,
    handleSaveShiftGroup: shiftGroupSaveHandler,
    handleSaveShiftDisplay: shiftDisplaySaveHandler,
  };
}
