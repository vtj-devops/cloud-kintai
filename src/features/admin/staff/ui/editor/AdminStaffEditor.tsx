import { useAppDispatchV2 } from "@app/hooks";
import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import WORK_TYPE_OPTIONS from "@entities/staff/lib/workTypeOptions";
import {
  StaffType,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import {
  buildEditStaffUpdatePayload,
  EDIT_STAFF_DEFAULT_VALUES,
  StaffFormValues,
  toShiftGroupOptions,
} from "@features/admin/staff/model/staffForm";
import {
  StaffNameTableCell,
  StaffRoleTableCell,
} from "@features/admin/staff/ui/editor";
import { ApproverSettingTableRows } from "@features/admin/staff/ui/shared/ApproverSettingTableRows";
import {
  Autocomplete,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import {
  ApproverSettingMode,
} from "@shared/api/graphql/types";
import { AppTabs } from "@shared/ui/tabs";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { ProgressBar } from "@shared/ui/feedback";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import { PageTitle } from "@shared/ui/typography";
import dayjs from "dayjs";
import { useContext, useEffect, useMemo, useState } from "react";
import { Controller, useForm, UseFormRegister } from "react-hook-form";
import { useParams } from "react-router-dom";

import * as MESSAGE_CODE from "@/errors";

type Inputs = StaffFormValues;
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
    defaultValues: EDIT_STAFF_DEFAULT_VALUES,
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
    () => toShiftGroupOptions(getShiftGroups()),
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
      const payload = buildEditStaffUpdatePayload({
        id: staff.id,
        data,
      });
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

        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/95">
          <AppTabs
            value={tabIndex}
            onChange={setTabIndex}
            appearance="underline"
            panelPadding={0}
            tabsProps={{ "aria-label": "スタッフ編集タブ" }}
            items={[
              {
                value: 0,
                label: "全般",
                content: (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px]">
                      <tbody>
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
                            labelCellClassName={LABEL_CELL_CLASS}
                            valueCellClassName={VALUE_CELL_CLASS}
                          />
                        </>
                      </tbody>
                    </table>
                  </div>
                ),
              },
              {
                value: 1,
                label: "高度設定",
                disabled: !cognitoUser?.owner,
                content: (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px]">
                      <tbody>
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
                      </tbody>
                    </table>
                  </div>
                ),
              },
            ]}
          />
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
