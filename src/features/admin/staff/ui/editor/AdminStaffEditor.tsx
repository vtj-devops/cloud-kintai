import { useAppDispatchV2 } from "@app/hooks";
import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import WORK_TYPE_OPTIONS from "@entities/staff/lib/workTypeOptions";
import {
  StaffRole,
  StaffType,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import {
  StaffNameTableCell,
  StaffRoleTableCell,
} from "@features/admin/staff/ui/editor";
import {
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import {
  ApproverMultipleMode,
  ApproverSettingMode,
} from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { ProgressBar } from "@shared/ui/feedback";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import { PageTitle } from "@shared/ui/typography";
import dayjs from "dayjs";
import { useContext, useEffect, useMemo, useState } from "react";
import { Control, Controller, useForm, UseFormRegister } from "react-hook-form";
import { useParams } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

type Inputs = {
  staffId?: string | null;
  internalId?: string | null;
  familyName?: string | null;
  givenName?: string | null;
  mailAddress?: string | null;
  owner: boolean;
  sortKey?: string | null;
  usageStartDate?: string | null;
  workType?: string | null;
  shiftGroup?: string | null;
  attendanceManagementEnabled?: boolean;
  role?: string | null;
  approverSetting?: ApproverSettingMode | null;
  approverSingle?: string | null;
  approverMultiple?: string[] | null;
  approverMultipleMode?: ApproverMultipleMode | null;
  developer?: boolean;
};
type AutocompleteOption = {
  value: string;
  label: string;
  description?: string;
};
type ExtendedStaff = StaffType & {
  workType?: string;
  developer?: boolean;
  attendanceManagementEnabled?: boolean | null;
};
const LABEL_CELL_CLASS =
  "w-[220px] min-w-[180px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900";
const VALUE_CELL_CLASS = "border-b border-slate-200 px-4 py-3 align-middle";
export default function AdminStaffEditor() {
  const { staffId } = useParams();
  const dispatch = useAppDispatchV2();
  const { cognitoUser, authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { getShiftGroups } = useContext(AppConfigContext);
  const {
    staffs,
    loading: staffLoading,
    error: staffError,
    updateStaff,
  } = useStaffs({ isAuthenticated });
  const {
    register,
    control,
    setValue,
    watch,
    getValues,
    handleSubmit,
    reset,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      owner: false,
      developer: false,
      attendanceManagementEnabled: true,
    },
  });
  const [tabIndex, setTabIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const { dialog } = usePageLeaveGuard({
    isDirty,
    isBusy: saving || isSubmitting,
  });
  useEffect(() => {
    if (!staffId) return;
    const staff = staffs.find((s) => s.cognitoUserId === staffId);
    if (!staff) return;
    const extendedStaff = staff as ExtendedStaff;
    setValue("staffId", staff.cognitoUserId ?? null);
    setValue("internalId", staff.id ?? null);
    setValue("familyName", staff.familyName ?? null);
    setValue("givenName", staff.givenName ?? null);
    setValue("mailAddress", staff.mailAddress ?? null);
    setValue("owner", staff.owner ?? false);
    setValue("sortKey", staff.sortKey ?? null);
    setValue("usageStartDate", staff.usageStartDate ?? null);
    setValue("workType", extendedStaff.workType ?? "weekday");
    setValue("shiftGroup", staff.shiftGroup ?? null);
    setValue(
      "attendanceManagementEnabled",
      extendedStaff.attendanceManagementEnabled ?? true,
    );
    setValue("role", staff.role ?? null);
    setValue("developer", extendedStaff.developer ?? false);
  }, [staffId, staffs, setValue]);
  const shiftGroupOptions = useMemo(
    () =>
      getShiftGroups().map((group) => ({
        value: group.label,
        label: group.label,
        description: group.description ?? "",
      })),
    [getShiftGroups],
  );
  if (staffLoading) return <ProgressBar />;
  if (staffError) {
    dispatch(
      pushNotification({
        tone: "error",
        message: MESSAGE_CODE.E05001,
      }),
    );
    return null;
  }
  const onSubmit = async (data: Inputs) => {
    if (!staffId) return;
    setSaving(true);
    try {
      const staff = staffs.find((s) => s.cognitoUserId === staffId);
      if (!staff) {
        dispatch(
          pushNotification({
            tone: "error",
            message: "スタッフが見つかりません",
          }),
        );
        return;
      }
      type PayloadType = {
        id: string;
        mailAddress: string | null | undefined;
        familyName: string | null | undefined;
        givenName: string | null | undefined;
        owner: boolean;
        sortKey: string | null | undefined;
        usageStartDate: string | null | undefined;
        workType: string | null | undefined;
        shiftGroup: string | null | undefined;
        attendanceManagementEnabled?: boolean;
        approverSingle?: string | null;
        approverMultiple?: string[] | null;
        approverMultipleMode?: ApproverMultipleMode | null;
        developer?: boolean;
      };
      const payload: PayloadType = {
        id: staff.id,
        mailAddress: data.mailAddress,
        familyName: data.familyName,
        givenName: data.givenName,
        owner: data.owner,
        sortKey: data.sortKey,
        usageStartDate: data.usageStartDate,
        workType: data.workType,
        shiftGroup: data.shiftGroup ?? null,
        attendanceManagementEnabled: data.attendanceManagementEnabled ?? true,
      };
      const approverSetting = watch("approverSetting");
      const approverMultiple = watch("approverMultiple") ?? [];
      const approverMultipleMode = watch("approverMultipleMode");
      if (approverSetting === ApproverSettingMode.SINGLE) {
        payload.approverSingle = watch("approverSingle") as string | null;
      }
      if (approverSetting === ApproverSettingMode.MULTIPLE) {
        payload.approverMultiple = approverMultiple as string[];
        payload.approverMultipleMode =
          approverMultipleMode as ApproverMultipleMode | null;
      }
      if (typeof data.developer !== "undefined") {
        payload.developer = data.developer;
      }
      await updateStaff(payload);
      reset(data);
      dispatch(
        pushNotification({
          tone: "success",
          message: "保存しました",
        }),
      );
    } catch {
      dispatch(
        pushNotification({
          tone: "error",
          message: MESSAGE_CODE.E05002,
        }),
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="h-full w-full px-2 pb-3 pt-2 sm:px-4 md:px-6">
      {dialog}
      <div className="space-y-2.5">
        <section className="rounded-[18px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-5 py-4">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <PageTitle className="text-xl font-extrabold tracking-[0.01em] text-emerald-950">
                スタッフ編集
              </PageTitle>
              <p className="text-sm text-emerald-800">
                スタッフ情報と承認設定を更新できます。
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-mono text-slate-700">
                <span className="font-bold">Cognito ID:</span>
                <span className="ml-1">{getValues("staffId") ?? "-"}</span>
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-mono text-slate-700">
                <span className="font-bold">スタッフID:</span>
                <span className="ml-1">{getValues("internalId") ?? "-"}</span>
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-100 bg-white/95 px-4 pt-2">
          <Tabs
            value={tabIndex}
            onChange={(_, v) => setTabIndex(v)}
            aria-label="スタッフ編集タブ"
          >
            <Tab label="全般" />
            <Tab
              label="高度設定"
              disabled={!cognitoUser?.owner}
              data-testid="advanced-tab"
            />
          </Tabs>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white/95">
          <table className="w-full min-w-[860px]">
            <tbody>
              {tabIndex === 0 && (
                <>
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
                    <StaffNameTableCell register={register} />
                  </tr>

                  <tr>
                    <td className={LABEL_CELL_CLASS}>メールアドレス</td>
                    <MailAddressTableCell register={register} />
                  </tr>

                  <tr>
                    <td className={LABEL_CELL_CLASS}>権限</td>
                    <StaffRoleTableCell control={control} setValue={setValue} />
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
                                setValue("owner", e.target.checked);
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
                              onChange={(e) => field.onChange(e.target.checked)}
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
                              setValue("workType", data.value);
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
                </>
              )}

              {tabIndex === 1 && (
                <tr>
                  <td className={LABEL_CELL_CLASS}>開発者フラグ</td>
                  <td className="px-4 py-3 align-middle">
                    <Controller
                      name="developer"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          data-testid="developer-flag-checkbox"
                          checked={Boolean(field.value)}
                          onChange={(e) => {
                            setValue("developer", e.target.checked, {
                              shouldDirty: true,
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

        <div className="flex justify-end pb-8 pt-2">
          <Button
            data-testid="save-button"
            variant="contained"
            size="medium"
            disabled={!isValid || !isDirty || saving || isSubmitting}
            startIcon={saving ? <CircularProgress size={15} /> : undefined}
            onClick={handleSubmit(onSubmit)}
          >
            保存
          </Button>
        </div>
      </div>
    </div>
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
                  if (approverSetting !== ApproverSettingMode.SINGLE)
                    return true;
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
                    if (approverSetting !== ApproverSettingMode.MULTIPLE)
                      return true;
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
function MailAddressTableCell({
  register,
}: {
  register: UseFormRegister<Inputs>;
}) {
  return (
    <td className={VALUE_CELL_CLASS}>
      <TextField
        {...register("mailAddress", { required: true })}
        size="small"
        sx={{ width: { xs: "100%", sm: 400 } }}
      />
    </td>
  );
}
