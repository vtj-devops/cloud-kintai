import {
  StaffRole,
  StaffType,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import {
  ApproverMultipleMode,
  ApproverSettingMode,
} from "@shared/api/graphql/types";
// Breadcrumbs/Title removed per admin UI simplification
import dayjs from "dayjs";
import { Activity, useContext, useEffect, useMemo, useState } from "react";
import { Control, Controller, useForm, UseFormRegister } from "react-hook-form";
import { useParams } from "react-router-dom";

import { useAppDispatchV2 } from "@/app/hooks";
import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";
import WORK_TYPE_OPTIONS from "@/entities/staff/lib/workTypeOptions";
import * as MESSAGE_CODE from "@/errors";
import {
  StaffNameTableCell,
  StaffRoleTableCell,
} from "@/features/admin/staff/ui/editor";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";

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

  if (staffLoading) return <LinearProgress />;
  if (staffError) {
    dispatch(setSnackbarError(MESSAGE_CODE.E05001));
    return null;
  }

  const onSubmit = async (data: Inputs) => {
    if (!staffId) return;
    setSaving(true);
    try {
      const staff = staffs.find((s) => s.cognitoUserId === staffId);
      if (!staff) {
        dispatch(setSnackbarError("スタッフが見つかりません"));
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

      // approver related
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

      // only include developer if explicitly present (defensive for backend schema)
      if (typeof data.developer !== "undefined") {
        payload.developer = data.developer;
      }

      await updateStaff(payload);
      dispatch(setSnackbarSuccess("保存しました"));
    } catch {
      dispatch(setSnackbarError(MESSAGE_CODE.E05002));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 2, pb: 8 }}>
      <Stack spacing={2}>
        {/* breadcrumbs and page title removed */}

        <Box>
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
        </Box>

        <TableContainer>
          <Table>
            <TableBody>
              <Activity mode={tabIndex === 0 ? "visible" : "hidden"}>
                <>
                  <TableRow>
                    <TableCell>スタッフID</TableCell>
                    <TableCell>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Cognito ID:
                          </Typography>
                          <Typography variant="body1">
                            {getValues("staffId")}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Internal ID:
                          </Typography>
                          <Typography variant="body1">
                            {getValues("internalId")}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>汎用コード</TableCell>
                    <TableCell>
                      <TextField
                        {...register("sortKey")}
                        size="small"
                        sx={{ width: 400 }}
                        placeholder="例：1、2、3...やZZ001、ZZ002...など"
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>スタッフ名</TableCell>
                    <StaffNameTableCell register={register} />
                  </TableRow>

                  <TableRow>
                    <TableCell>メールアドレス</TableCell>
                    <MailAddressTableCell register={register} />
                  </TableRow>

                  <TableRow>
                    <TableCell>権限</TableCell>
                    <StaffRoleTableCell control={control} setValue={setValue} />
                  </TableRow>

                  {cognitoUser?.owner && (
                    <TableRow>
                      <TableCell>オーナー権限</TableCell>
                      <TableCell>
                        <Controller
                          name="owner"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onChange={() => {
                                setValue("owner", !field.value);
                                field.onChange(!field.value);
                              }}
                            />
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  <TableRow>
                    <TableCell>利用開始日</TableCell>
                    <TableCell>
                      <Controller
                        name="usageStartDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(v) => {
                              // convert dayjs to ISO string (or null)
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
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>勤怠管理対象</TableCell>
                    <TableCell>
                      <Controller
                        name="attendanceManagementEnabled"
                        control={control}
                        render={({ field }) => (
                          <Stack spacing={1}>
                            <Switch
                              checked={field.value ?? true}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              オフにすると勤怠チェックでエラーとして扱われなくなります
                            </Typography>
                          </Stack>
                        )}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>勤務形態</TableCell>
                    <TableCell>
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
                                sx={{ width: 400 }}
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
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>シフトグループ</TableCell>
                    <TableCell>
                      {shiftGroupOptions.length === 0 ? (
                        <Typography color="text.secondary">
                          利用可能なシフトグループがありません。管理画面の「シフト設定」で登録してください。
                        </Typography>
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
                                    sx={{ width: 400 }}
                                    placeholder="所属させるシフトグループを選択"
                                    onBlur={field.onBlur}
                                  />
                                )}
                              />
                            );
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>承認者設定</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>

                  <ApproverSettingTableRows
                    control={control}
                    watch={watch}
                    staffs={staffs}
                    currentCognitoUserId={cognitoUser?.id}
                  />
                </>
              </Activity>

              <Activity mode={tabIndex === 1 ? "visible" : "hidden"}>
                <TableRow>
                  <TableCell>
                    <Controller
                      name="developer"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          data-testid="developer-flag-checkbox"
                          checked={Boolean(field.value)}
                          onChange={() => {
                            setValue("developer", !field.value, {
                              shouldDirty: true,
                            });
                            field.onChange(!field.value);
                          }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">開発者フラグ</Typography>
                  </TableCell>
                </TableRow>
              </Activity>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 4, mb: 8 }}>
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
        </Box>
      </Stack>
    </Container>
  );
}

// Helper components

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
        <TableRow>
          <TableCell />
          <TableCell>
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
                        sx={{ width: 400 }}
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
          </TableCell>
        </TableRow>
      )}

      {approverSetting === ApproverSettingMode.MULTIPLE && (
        <>
          <TableRow>
            <TableCell />
            <TableCell>
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
                          sx={{ width: 400 }}
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
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell />
            <TableCell>
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
            </TableCell>
          </TableRow>

          {approverMultipleMode === ApproverMultipleMode.ORDER && (
            <TableRow>
              <TableCell />
              <TableCell>
                <Stack spacing={1}>
                  {selectedMultipleOptions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      承認順を設定するスタッフを選択してください。
                    </Typography>
                  ) : (
                    selectedMultipleOptions.map((option, index) => (
                      <Box
                        key={option.value}
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        <Chip label={index + 1} size="small" />
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Stack>
                      </Box>
                    ))
                  )}
                  <Typography variant="caption" color="text.secondary">
                    選択した順番が承認順として利用されます。
                  </Typography>
                </Stack>
              </TableCell>
            </TableRow>
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
    <TableCell>
      <TextField
        {...register("mailAddress", { required: true })}
        size="small"
        sx={{ width: 400 }}
      />
    </TableCell>
  );
}
