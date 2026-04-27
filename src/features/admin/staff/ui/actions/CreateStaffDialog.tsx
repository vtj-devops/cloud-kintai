import { useAppDispatchV2 } from "@app/hooks";
import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import WORK_TYPE_OPTIONS from "@entities/staff/lib/workTypeOptions";
import addUserToGroup from "@entities/staff/model/cognito/addUserToGroup";
import createCognitoUser from "@entities/staff/model/cognito/createCognitoUser";
import fetchStaffs from "@entities/staff/model/useStaffs/fetchStaffs";
import {
  StaffRole,
  StaffType,
} from "@entities/staff/model/useStaffs/useStaffs";
import { handleSyncCognitoUser } from "@features/admin/staff/model/handleSyncCognitoUser";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import {
  ApproverMultipleMode,
  ApproverSettingMode,
  CreateStaffInput,
  UpdateStaffInput,
} from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useDialogCloseGuard } from "@shared/ui/feedback/useDialogCloseGuard";
import { SectionTitle } from "@shared/ui/typography";
import dayjs from "dayjs";
import { useContext, useMemo, useState } from "react";
import { Control, Controller, useForm } from "react-hook-form";
import { z } from "zod";

import * as MESSAGE_CODE from "@/errors";

const createStaffSchema = z.object({
  familyName: z.string().min(1, "姓を入力してください"),
  givenName: z.string().min(1, "名を入力してください"),
  mailAddress: z.string().email("有効なメールアドレスを入力してください"),
  role: z.string().min(1, "ロールを選択してください"),
  owner: z.boolean(),
  sortKey: z.string().nullable().optional(),
  usageStartDate: z.string().nullable().optional(),
  workType: z.string().nullable().optional(),
  shiftGroup: z.string().nullable().optional(),
  attendanceManagementEnabled: z.boolean().optional(),
  approverSetting: z.nativeEnum(ApproverSettingMode).nullable().optional(),
  approverSingle: z.string().nullable().optional(),
  approverMultiple: z.array(z.string()).nullable().optional(),
  approverMultipleMode: z
    .nativeEnum(ApproverMultipleMode)
    .nullable()
    .optional(),
  developer: z.boolean().optional(),
});

type Inputs = z.infer<typeof createStaffSchema>;
type AutocompleteOption = {
  value: string;
  label: string;
  description?: string;
};
const defaultValues: Inputs = {
  familyName: "",
  givenName: "",
  mailAddress: "",
  role: StaffRole.STAFF,
  owner: false,
  sortKey: null,
  usageStartDate: null,
  workType: "weekday",
  shiftGroup: null,
  attendanceManagementEnabled: true,
  approverSetting: ApproverSettingMode.ADMINS,
  approverSingle: null,
  approverMultiple: [],
  approverMultipleMode: ApproverMultipleMode.ANY,
  developer: false,
};
const LABEL_CELL_CLASS =
  "w-[220px] min-w-[180px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900";
const VALUE_CELL_CLASS = "border-b border-slate-200 px-4 py-3 align-middle";
export const ROLE_OPTIONS = [
  { value: StaffRole.ADMIN, label: "管理者" },
  { value: StaffRole.STAFF, label: "スタッフ" },
  { value: StaffRole.OPERATOR, label: "オペレーター" },
];
export default function CreateStaffDialog({
  staffs,
  refreshStaff,
  createStaff,
  updateStaff,
}: {
  staffs: StaffType[];
  refreshStaff: () => Promise<void>;
  createStaff: (input: CreateStaffInput) => Promise<void>;
  updateStaff: (input: UpdateStaffInput) => Promise<void>;
}) {
  const dispatch = useAppDispatchV2();
  const { getShiftGroups } = useContext(AppConfigContext);
  const { cognitoUser } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const {
    register,
    control,
    watch,
    handleSubmit,
    reset,
    setValue,
    formState: { isDirty, isValid, isSubmitting },
  } = useForm<Inputs>({
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(createStaffSchema),
  });
  const { dialog, requestClose, closeWithoutGuard } = useDialogCloseGuard({
    isDirty,
    isBusy: isSubmitting,
    onClose: () => {
      reset(defaultValues);
      setOpen(false);
    },
  });
  const shiftGroupOptions = useMemo(
    () =>
      getShiftGroups().map((group) => ({
        value: group.label,
        label: group.label,
        description: group.description ?? "",
      })),
    [getShiftGroups],
  );
  const handleClickOpen = () => {
    reset(defaultValues);
    setOpen(true);
  };
  const onSubmit = async (data: Inputs) => {
    const { familyName, givenName, mailAddress, role } = data;
    if (!familyName || !givenName || !mailAddress || !role) {
      throw new Error("Invalid data");
    }
    try {
      await createCognitoUser(mailAddress, familyName, givenName);
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E10002,
        }),
      );
      return;
    }
    try {
      await addUserToGroup(mailAddress, role);
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E10002,
        }),
      );
      return;
    }
    try {
      await handleSyncCognitoUser(
        staffs,
        refreshStaff,
        createStaff,
        updateStaff,
      );
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E10001,
        }),
      );
      return;
    }
    try {
      const latestStaffs = await fetchStaffs();
      const targetStaff = latestStaffs.find(
        (staff) =>
          (staff.mailAddress ?? "").toLowerCase() === mailAddress.toLowerCase(),
      );
      if (!targetStaff) {
        dispatch(
          pushNotification({
            tone: "error",
            message: "作成したスタッフが見つかりません",
          }),
        );
        return;
      }
      const updatePayload: UpdateStaffInput = {
        id: targetStaff.id,
        familyName,
        givenName,
        mailAddress,
        role,
        owner: data.owner,
        sortKey: data.sortKey ?? null,
        usageStartDate: data.usageStartDate ?? null,
        workType: data.workType ?? "weekday",
        shiftGroup: data.shiftGroup ?? null,
        attendanceManagementEnabled: data.attendanceManagementEnabled ?? true,
        approverSetting: data.approverSetting ?? ApproverSettingMode.ADMINS,
      };
      if (data.approverSetting === ApproverSettingMode.SINGLE) {
        updatePayload.approverSingle = data.approverSingle ?? null;
      }
      if (data.approverSetting === ApproverSettingMode.MULTIPLE) {
        updatePayload.approverMultiple = data.approverMultiple ?? [];
        updatePayload.approverMultipleMode =
          data.approverMultipleMode ?? ApproverMultipleMode.ANY;
      }
      if (cognitoUser?.owner) {
        updatePayload.developer = data.developer ?? false;
      }
      await updateStaff(updatePayload);
      await refreshStaff();
      dispatch(
        pushNotification({
          tone: "success",
          message: MESSAGE_CODE.S10002,
        }),
      );
      closeWithoutGuard();
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E05002,
        }),
      );
    }
  };
  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 items-center justify-center rounded-xl border border-emerald-700/15 bg-[#19b985] px-4 text-xs font-semibold leading-none tracking-wide text-white shadow-[0_10px_20px_-14px_rgba(5,150,105,0.75)] transition hover:bg-[#17ab7b] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        onClick={handleClickOpen}
      >
        <span className="inline-flex items-center gap-1.5 leading-none">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span>スタッフ登録</span>
        </span>
      </button>

      {dialog}
      {open ? (
        <div
          className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-900/35 p-4"
          onClick={requestClose}
        >
          <div
            className="w-full max-w-5xl rounded-2xl bg-slate-50 p-3 shadow-2xl sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2.5">
              <section className="rounded-[18px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-4">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <SectionTitle className="text-xl font-extrabold tracking-[0.01em] text-emerald-950">
                      スタッフ作成
                    </SectionTitle>
                    <p className="text-sm text-emerald-800">
                      登録するスタッフの情報と承認設定を入力してください。
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700">
                    新規作成
                  </span>
                </div>
              </section>

              <section className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white/95">
                <table className="w-full min-w-[860px]">
                  <tbody>
                    <tr>
                      <td className={LABEL_CELL_CLASS}>汎用コード</td>
                      <td className={VALUE_CELL_CLASS}>
                        <TextField
                          {...register("sortKey")}
                          size="small"
                          sx={{ width: { xs: "100%", sm: 400 } }}
                          placeholder="例：1、2、3...やZZ001、ZZ002...など"
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className={LABEL_CELL_CLASS}>スタッフ名</td>
                      <td className={VALUE_CELL_CLASS}>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <TextField
                            {...register("familyName")}
                            size="small"
                            label="姓"
                            sx={{ width: { xs: "100%", sm: 200 } }}
                          />
                          <TextField
                            {...register("givenName")}
                            size="small"
                            label="名"
                            sx={{ width: { xs: "100%", sm: 200 } }}
                          />
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className={LABEL_CELL_CLASS}>メールアドレス</td>
                      <td className={VALUE_CELL_CLASS}>
                        <TextField
                          {...register("mailAddress")}
                          type="email"
                          size="small"
                          sx={{ width: { xs: "100%", sm: 400 } }}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className={LABEL_CELL_CLASS}>権限</td>
                      <td className={VALUE_CELL_CLASS}>
                        <Controller
                          name="role"
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              {...field}
                              value={
                                ROLE_OPTIONS.find(
                                  (option) =>
                                    String(option.value) === field.value,
                                ) ?? null
                              }
                              options={ROLE_OPTIONS}
                              getOptionLabel={(option) => option.label}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  sx={{ width: { xs: "100%", sm: 400 } }}
                                />
                              )}
                              onChange={(_, data) => {
                                if (!data) return;
                                setValue("role", data.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                field.onChange(data.value);
                              }}
                            />
                          )}
                        />
                      </td>
                    </tr>

                    {cognitoUser?.owner && (
                      <tr>
                        <td className={LABEL_CELL_CLASS}>オーナー権限</td>
                        <td className={VALUE_CELL_CLASS}>
                          <Controller
                            name="owner"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                checked={Boolean(field.value)}
                                onChange={(e) => {
                                  setValue("owner", e.target.checked, {
                                    shouldDirty: true,
                                  });
                                  field.onChange(e.target.checked);
                                }}
                              />
                            )}
                          />
                        </td>
                      </tr>
                    )}

                    <tr>
                      <td className={LABEL_CELL_CLASS}>利用開始日</td>
                      <td className={VALUE_CELL_CLASS}>
                        <Controller
                          name="usageStartDate"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              value={field.value ? dayjs(field.value) : null}
                              onChange={(v) => {
                                const next = v ? v.format("YYYY-MM-DD") : null;
                                setValue("usageStartDate", next, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                field.onChange(next);
                              }}
                              format="YYYY/M/D"
                              slotProps={{
                                textField: {
                                  onBlur: field.onBlur,
                                  size: "small",
                                },
                              }}
                            />
                          )}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className={LABEL_CELL_CLASS}>勤怠管理対象</td>
                      <td className={VALUE_CELL_CLASS}>
                        <Controller
                          name="attendanceManagementEnabled"
                          control={control}
                          render={({ field }) => (
                            <div className="space-y-1">
                              <Checkbox
                                checked={field.value ?? true}
                                onChange={(e) => {
                                  setValue(
                                    "attendanceManagementEnabled",
                                    e.target.checked,
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    },
                                  );
                                  field.onChange(e.target.checked);
                                }}
                              />
                              <p className="text-xs text-slate-500">
                                オフにすると勤怠チェックでエラーとして扱われなくなります
                              </p>
                            </div>
                          )}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className={LABEL_CELL_CLASS}>勤務形態</td>
                      <td className={VALUE_CELL_CLASS}>
                        <Controller
                          name="workType"
                          control={control}
                          render={({ field }) => (
                            <Autocomplete
                              {...field}
                              value={
                                WORK_TYPE_OPTIONS.find(
                                  (option) => option.value === field.value,
                                ) ?? null
                              }
                              options={WORK_TYPE_OPTIONS}
                              getOptionLabel={(option) => option.label}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  sx={{ width: { xs: "100%", sm: 400 } }}
                                />
                              )}
                              onChange={(_, data) => {
                                if (!data) return;
                                setValue("workType", data.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                field.onChange(data.value);
                              }}
                            />
                          )}
                        />
                      </td>
                    </tr>

                    <tr>
                      <td className={LABEL_CELL_CLASS}>シフトグループ</td>
                      <td className={VALUE_CELL_CLASS}>
                        {shiftGroupOptions.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            利用可能なシフトグループがありません。管理画面の「シフト設定」で登録してください。
                          </p>
                        ) : (
                          <Controller
                            name="shiftGroup"
                            control={control}
                            render={({ field }) => {
                              const selectedOption =
                                shiftGroupOptions.find(
                                  (option) => option.value === field.value,
                                ) ?? null;
                              return (
                                <Autocomplete
                                  value={selectedOption}
                                  options={shiftGroupOptions}
                                  onChange={(_, newValue) => {
                                    setValue(
                                      "shiftGroup",
                                      newValue?.value ?? null,
                                      {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      },
                                    );
                                    field.onChange(newValue?.value ?? null);
                                  }}
                                  isOptionEqualToValue={(option, value) =>
                                    option.value === value.value
                                  }
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      size="small"
                                      sx={{ width: { xs: "100%", sm: 400 } }}
                                      placeholder="所属させるシフトグループを選択"
                                      onBlur={field.onBlur}
                                    />
                                  )}
                                />
                              );
                            }}
                          />
                        )}
                      </td>
                    </tr>

                    <tr>
                      <td className={LABEL_CELL_CLASS}>承認者設定</td>
                      <td className={VALUE_CELL_CLASS}>
                        <Controller
                          name="approverSetting"
                          control={control}
                          render={({ field }) => (
                            <RadioGroup
                              row
                              value={field.value}
                              onChange={(e) => {
                                const v = e.target.value as ApproverSettingMode;
                                setValue("approverSetting", v, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                field.onChange(v);
                              }}
                            >
                              <FormControlLabel
                                value={ApproverSettingMode.ADMINS}
                                control={<Radio />}
                                label="管理者全員 (デフォルト)"
                              />
                              <FormControlLabel
                                value={ApproverSettingMode.SINGLE}
                                control={<Radio />}
                                label="特定の承認者を1名に限定"
                              />
                              <FormControlLabel
                                value={ApproverSettingMode.MULTIPLE}
                                control={<Radio />}
                                label="特定の承認者を複数選択"
                              />
                            </RadioGroup>
                          )}
                        />
                      </td>
                    </tr>

                    <ApproverSettingTableRows
                      control={control}
                      watch={watch}
                      staffs={staffs}
                      currentCognitoUserId={cognitoUser?.id}
                    />

                    {cognitoUser?.owner && (
                      <tr>
                        <td className={LABEL_CELL_CLASS}>開発者フラグ</td>
                        <td className={VALUE_CELL_CLASS}>
                          <Controller
                            name="developer"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                checked={Boolean(field.value)}
                                onChange={(e) => {
                                  setValue("developer", e.target.checked, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  field.onChange(e.target.checked);
                                }}
                              />
                            )}
                          />
                          <p className="text-sm text-slate-500">
                            開発用の機能を表示するための設定です。
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <div className="flex justify-end gap-2 pb-1 pt-1">
                <Button
                  type="button"
                  variant="text"
                  color="inherit"
                  onClick={requestClose}
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  variant="contained"
                  disabled={!isDirty || !isValid || isSubmitting}
                  startIcon={
                    isSubmitting ? <CircularProgress size={15} /> : undefined
                  }
                  onClick={handleSubmit(onSubmit)}
                >
                  登録
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
function ApproverSettingTableRows({
  control,
  watch,
  staffs,
  currentCognitoUserId,
}: {
  control: Control<Inputs>;
  watch: <K extends keyof Inputs>(name: K) => Inputs[K];
  staffs: StaffType[];
  currentCognitoUserId?: string | null;
}) {
  const adminOptions = useMemo<AutocompleteOption[]>(() => {
    return staffs
      .filter(
        (staff) =>
          (staff.role === StaffRole.ADMIN || staff.owner) &&
          staff.cognitoUserId !== currentCognitoUserId,
      )
      .map((staff) => ({
        value: staff.cognitoUserId ?? "",
        label:
          [staff.familyName, staff.givenName]
            .filter((n) => Boolean(n))
            .join(" ") ||
          staff.mailAddress ||
          "",
        description: staff.mailAddress ?? "",
      }));
  }, [staffs, currentCognitoUserId]);
  const approverSetting = watch("approverSetting");
  const approverMultiple = watch("approverMultiple") ?? [];
  const approverMultipleMode = watch("approverMultipleMode");
  const selectedMultipleOptions = approverMultiple
    .filter((value): value is string => Boolean(value))
    .map((value) => adminOptions.find((option) => option.value === value))
    .filter((o): o is AutocompleteOption => Boolean(o));
  return (
    <>
      {approverSetting === ApproverSettingMode.SINGLE && (
        <tr>
          <td className={LABEL_CELL_CLASS} />
          <td className={VALUE_CELL_CLASS}>
            <Controller
              name="approverSingle"
              control={control}
              rules={{
                validate: (value) => {
                  if (approverSetting !== ApproverSettingMode.SINGLE) {
                    return true;
                  }
                  return Boolean(value) || "承認者を選択してください";
                },
              }}
              render={({ field, fieldState }) => {
                const valueOption = adminOptions.find(
                  (option) => option.value === field.value,
                );
                return (
                  <Autocomplete
                    value={valueOption ?? null}
                    options={adminOptions}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.value ?? null);
                    }}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) =>
                      option.value === value.value
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        sx={{ width: { xs: "100%", sm: 400 } }}
                        label="承認者"
                        placeholder="承認者を検索"
                        error={Boolean(fieldState.error)}
                        helperText={
                          fieldState.error?.message ||
                          "承認者を1名選択してください。"
                        }
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                );
              }}
            />
          </td>
        </tr>
      )}

      {approverSetting === ApproverSettingMode.MULTIPLE && (
        <>
          <tr>
            <td className={LABEL_CELL_CLASS} />
            <td className={VALUE_CELL_CLASS}>
              <Controller
                name="approverMultiple"
                control={control}
                rules={{
                  validate: (value) => {
                    if (approverSetting !== ApproverSettingMode.MULTIPLE) {
                      return true;
                    }
                    return (
                      (value?.length ?? 0) > 0 || "承認者を選択してください"
                    );
                  },
                }}
                render={({ field, fieldState }) => {
                  const valueOptions = (field.value ?? [])
                    .map((v) => adminOptions.find((o) => o.value === v))
                    .filter((opt): opt is AutocompleteOption => Boolean(opt));
                  return (
                    <Autocomplete<AutocompleteOption, true>
                      multiple
                      options={adminOptions}
                      value={valueOptions}
                      onChange={(_, newValue) => {
                        field.onChange(newValue.map((option) => option.value));
                      }}
                      disableCloseOnSelect
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) =>
                        option.value === value.value
                      }
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option.value}
                            label={option.label}
                            size="small"
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          sx={{ width: { xs: "100%", sm: 400 } }}
                          label="承認者"
                          placeholder="承認者を選択"
                          error={Boolean(fieldState.error)}
                          helperText={
                            fieldState.error?.message ||
                            (approverMultipleMode === ApproverMultipleMode.ORDER
                              ? "選択した順番が承認順になります。"
                              : "複数選択できます。")
                          }
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  );
                }}
              />
            </td>
          </tr>

          <tr>
            <td className={LABEL_CELL_CLASS} />
            <td className={VALUE_CELL_CLASS}>
              <Controller
                name="approverMultipleMode"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    row
                    value={field.value ?? ApproverMultipleMode.ANY}
                    onChange={(event) => {
                      const nextValue = event.target
                        .value as ApproverMultipleMode;
                      field.onChange(nextValue);
                    }}
                  >
                    <FormControlLabel
                      value={ApproverMultipleMode.ANY}
                      control={<Radio />}
                      label="誰か1人が承認すれば完了"
                    />
                    <FormControlLabel
                      value={ApproverMultipleMode.ORDER}
                      control={<Radio />}
                      label="設定した順番で承認"
                    />
                  </RadioGroup>
                )}
              />
            </td>
          </tr>

          {approverMultipleMode === ApproverMultipleMode.ORDER && (
            <tr>
              <td className={LABEL_CELL_CLASS} />
              <td className={VALUE_CELL_CLASS}>
                <div className="space-y-1">
                  {selectedMultipleOptions.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      承認順を設定するスタッフを選択してください。
                    </p>
                  ) : (
                    selectedMultipleOptions.map((option, index) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-2"
                      >
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-1 text-xs font-semibold text-slate-700">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm text-slate-900">
                            {option.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <p className="text-xs text-slate-500">
                    選択した順番が承認順として利用されます。
                  </p>
                </div>
              </td>
            </tr>
          )}
        </>
      )}
    </>
  );
}
