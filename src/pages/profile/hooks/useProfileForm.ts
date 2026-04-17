import {
  STAFF_EXTERNAL_LINKS_LIMIT,
  type StaffExternalLink,
} from "@entities/staff/externalLink";
import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import updateStaff from "@entities/staff/model/useStaff/updateStaff";
import {
  mappingStaffRole,
  type StaffType,
} from "@entities/staff/model/useStaffs/useStaffs";
import {
  buildVersionOrUpdatedAtCondition,
  getNextVersion,
} from "@shared/api/graphql/concurrency";
import { predefinedIcons } from "@shared/config/icons";
import { createLogger } from "@shared/lib/logger";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type Control,
  useFieldArray,
  type UseFieldArrayReturn,
  useForm,
  type UseFormGetValues,
  type UseFormHandleSubmit,
  type UseFormReset,
  useWatch,
} from "react-hook-form";

import * as MESSAGE_CODE from "@/errors";
import { useAppNotification } from "@/hooks/useAppNotification";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { CognitoUser } from "@/hooks/useCognitoUser";

import { AuthContext } from "../../../context/AuthContext";

const logger = createLogger("Profile");

const DEFAULT_ICON_VALUE = predefinedIcons[0]?.value ?? "LinkIcons";

export type StaffNotificationInputs = {
  workStart: boolean;
  workEnd: boolean;
};

export type StaffLinksFormInputs = {
  externalLinks: StaffExternalLink[];
};

export type PasswordChangeInputs = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type NotificationControl = Control<StaffNotificationInputs>;
export type LinksControl = Control<StaffLinksFormInputs>;
export type PasswordControl = Control<PasswordChangeInputs>;

type ProfileAutoSaveSnapshot = {
  notifications: StaffNotificationInputs;
  externalLinks: StaffExternalLink[];
};

const createEmptyExternalLink = (): StaffExternalLink => ({
  label: "",
  url: "",
  icon: DEFAULT_ICON_VALUE,
  enabled: true,
});

export const normalizeNotifications = (
  notifications?:
    | {
        workStart?: boolean | null;
        workEnd?: boolean | null;
      }
    | null,
): StaffNotificationInputs => ({
  workStart: notifications?.workStart ?? true,
  workEnd: notifications?.workEnd ?? true,
});

const normalizeExternalLinks = (
  links?: (StaffExternalLink | null)[] | null,
): StaffExternalLink[] =>
  (links ?? [])
    .filter((link): link is NonNullable<typeof link> => Boolean(link))
    .map((link) => ({
      label: link.label,
      url: link.url,
      icon: DEFAULT_ICON_VALUE,
      enabled: link.enabled,
    }));

export const normalizeFormExternalLinks = (
  links: StaffLinksFormInputs["externalLinks"] | undefined,
): StaffExternalLink[] =>
  (links ?? []).map((link) => ({
    label: link?.label ?? "",
    url: link?.url ?? "",
    icon: link?.icon ?? DEFAULT_ICON_VALUE,
    enabled: link?.enabled ?? true,
  }));

export const sanitizeExternalLinks = (links: StaffExternalLink[]) =>
  links
    .slice(0, STAFF_EXTERNAL_LINKS_LIMIT)
    .map((link) => ({
      ...link,
      label: link.label.trim(),
      url: link.url.trim(),
      icon: DEFAULT_ICON_VALUE,
    }))
    .filter((link) => link.label !== "" && link.url !== "");

export const isValidUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const isExternalLinkReadyToSave = (link: StaffExternalLink) => {
  const label = link.label.trim();
  const url = link.url.trim();
  return label !== "" && label.length <= 32 && isValidUrl(url);
};

const areExternalLinksReadyToSave = (links: StaffExternalLink[]) =>
  links.every(isExternalLinkReadyToSave);

const areNotificationsEqual = (
  prev: StaffNotificationInputs,
  next: StaffNotificationInputs,
) => prev.workStart === next.workStart && prev.workEnd === next.workEnd;

const areExternalLinksEqual = (
  prev: StaffExternalLink[],
  next: StaffExternalLink[],
) =>
  JSON.stringify(sanitizeExternalLinks(prev)) ===
  JSON.stringify(sanitizeExternalLinks(next));

const PROFILE_AUTO_SAVE_DELAY = 1000;

export interface UseProfileFormReturn {
  cognitoUser: CognitoUser | null | undefined;
  signOut: () => void;
  staff: StaffType | null | undefined;
  isAutoSaving: boolean;
  isAutoSavePending: boolean;
  lastSavedAt: Date | null;
  notificationControl: NotificationControl;
  linksControl: LinksControl;
  passwordControl: PasswordControl;
  handlePasswordSubmit: UseFormHandleSubmit<PasswordChangeInputs>;
  getPasswordValues: UseFormGetValues<PasswordChangeInputs>;
  resetPasswordForm: UseFormReset<PasswordChangeInputs>;
  externalLinkFields: UseFieldArrayReturn<StaffLinksFormInputs, "externalLinks">["fields"];
  canAddMoreLinks: boolean;
  hasPendingLinkInput: boolean;
  handleAddLink: () => void;
  handleRemoveLink: (index: number) => void;
  isNotificationDirty: boolean;
  isLinksDirty: boolean;
  isPasswordDirty: boolean;
  isPasswordValid: boolean;
  isPasswordSubmitting: boolean;
}

export function useProfileForm(): UseProfileFormReturn {
  const { notify } = useAppNotification();
  const { cognitoUser, signOut } = useContext(AuthContext);

  const [staff, setStaff] = useState<StaffType | null | undefined>(undefined);
  const [savedExternalLinks, setSavedExternalLinks] = useState<StaffExternalLink[]>([]);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  const {
    control: notificationControl,
    reset: resetNotificationForm,
    getValues: getNotificationValues,
    formState: { isDirty: isNotificationDirty },
  } = useForm<StaffNotificationInputs>({
    mode: "onChange",
    defaultValues: { workStart: true, workEnd: true },
  });

  const {
    control: linksControl,
    reset: resetLinksForm,
    getValues: getLinkValues,
    formState: { isDirty: isLinksDirty },
  } = useForm<StaffLinksFormInputs>({
    mode: "onChange",
    defaultValues: { externalLinks: [] },
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: {
      isValid: isPasswordValid,
      isSubmitting: isPasswordSubmitting,
      isDirty: isPasswordDirty,
    },
    reset: resetPasswordForm,
    getValues: getPasswordValues,
  } = useForm<PasswordChangeInputs>({
    mode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const {
    fields: externalLinkFields,
    append: appendExternalLink,
    remove: removeExternalLink,
  } = useFieldArray({ control: linksControl, name: "externalLinks" });

  const watchedNotifications = useWatch({ control: notificationControl });
  const watchedExternalLinks = useWatch({ control: linksControl, name: "externalLinks" });

  const currentNotifications = useMemo(
    () => normalizeNotifications(watchedNotifications),
    [watchedNotifications],
  );
  const currentExternalLinks = useMemo(
    () => normalizeFormExternalLinks(watchedExternalLinks),
    [watchedExternalLinks],
  );
  const hasPendingLinkInput = useMemo(
    () => currentExternalLinks.length > 0 && !areExternalLinksReadyToSave(currentExternalLinks),
    [currentExternalLinks],
  );
  const saveableExternalLinks = useMemo(
    () =>
      hasPendingLinkInput ? savedExternalLinks : sanitizeExternalLinks(currentExternalLinks),
    [currentExternalLinks, hasPendingLinkInput, savedExternalLinks],
  );
  const autoSaveSnapshot = useMemo<ProfileAutoSaveSnapshot>(
    () => ({ notifications: currentNotifications, externalLinks: saveableExternalLinks }),
    [currentNotifications, saveableExternalLinks],
  );

  const persistProfile = useCallback(
    async (snapshot: ProfileAutoSaveSnapshot) => {
      if (!staff) return;

      const updatedStaff = await updateStaff({
        input: {
          id: staff.id,
          cognitoUserId: staff.cognitoUserId,
          familyName: staff.familyName,
          givenName: staff.givenName,
          mailAddress: staff.mailAddress,
          role: staff.role,
          enabled: staff.enabled,
          status: staff.status,
          owner: staff.owner,
          usageStartDate: staff.usageStartDate,
          notifications: snapshot.notifications,
          externalLinks: snapshot.externalLinks,
          version: getNextVersion(staff.version),
        },
        condition: buildVersionOrUpdatedAtCondition(staff.version, staff.updatedAt),
      });

      const normalizedUpdatedNotifications = normalizeNotifications(updatedStaff.notifications);
      const normalizedUpdatedExternalLinks = normalizeExternalLinks(updatedStaff.externalLinks);

      setStaff((prev) =>
        prev
          ? {
              ...prev,
              ...updatedStaff,
              owner: updatedStaff.owner ?? false,
              role: mappingStaffRole(
                updatedStaff.role as Parameters<typeof mappingStaffRole>[0],
              ),
            }
          : prev,
      );
      setSavedExternalLinks(normalizedUpdatedExternalLinks);

      const nextNotificationValues = normalizeNotifications(getNotificationValues());
      if (areNotificationsEqual(nextNotificationValues, snapshot.notifications)) {
        resetNotificationForm(normalizedUpdatedNotifications);
      }

      const nextLinkValues = normalizeFormExternalLinks(getLinkValues("externalLinks"));
      if (
        areExternalLinksReadyToSave(nextLinkValues) &&
        areExternalLinksEqual(nextLinkValues, snapshot.externalLinks)
      ) {
        resetLinksForm({ externalLinks: normalizedUpdatedExternalLinks });
      }
    },
    [getLinkValues, getNotificationValues, resetLinksForm, resetNotificationForm, staff],
  );

  const {
    isSaving: isAutoSaving,
    isPending: isAutoSavePending,
    lastSavedAt,
  } = useAutoSave({
    saveFn: persistProfile,
    data: autoSaveSnapshot,
    enabled: isProfileLoaded && !!staff,
    delay: PROFILE_AUTO_SAVE_DELAY,
    onSaveError: (error) => {
      logger.error("Failed to auto-save profile:", error);
      notify({
        title: "エラー",
        description: MESSAGE_CODE.E05003,
        tone: "error",
        dedupeKey: "profile-auto-save-error",
      });
    },
  });

  const canAddMoreLinks = externalLinkFields.length < STAFF_EXTERNAL_LINKS_LIMIT;

  const handleAddLink = useCallback(() => {
    if (!canAddMoreLinks) return;
    appendExternalLink(createEmptyExternalLink());
  }, [appendExternalLink, canAddMoreLinks]);

  const handleRemoveLink = useCallback(
    (index: number) => {
      removeExternalLink(index);
    },
    [removeExternalLink],
  );

  useEffect(() => {
    if (!cognitoUser) return;

    fetchStaff(cognitoUser.id)
      .then((res) => {
        if (!res) return;

        setStaff({
          ...res,
          familyName: res.familyName,
          givenName: res.givenName,
          owner: res.owner ?? false,
          role: mappingStaffRole(res.role as Parameters<typeof mappingStaffRole>[0]),
        });

        const normalizedNotificationValues = normalizeNotifications(res.notifications);
        const normalizedExternalLinkValues = normalizeExternalLinks(res.externalLinks);

        setSavedExternalLinks(normalizedExternalLinkValues);
        resetNotificationForm(normalizedNotificationValues);
        resetLinksForm({ externalLinks: normalizedExternalLinkValues });
        setIsProfileLoaded(true);
      })
      .catch((e: Error) => {
        logger.error("Failed to load staff data:", e);
      });
  }, [cognitoUser, resetLinksForm, resetNotificationForm]);

  return {
    cognitoUser,
    signOut,
    staff,
    isAutoSaving,
    isAutoSavePending,
    lastSavedAt,
    notificationControl,
    linksControl,
    passwordControl,
    handlePasswordSubmit,
    getPasswordValues,
    resetPasswordForm,
    externalLinkFields,
    canAddMoreLinks,
    hasPendingLinkInput,
    handleAddLink,
    handleRemoveLink,
    isNotificationDirty,
    isLinksDirty,
    isPasswordDirty,
    isPasswordValid,
    isPasswordSubmitting,
  };
}
