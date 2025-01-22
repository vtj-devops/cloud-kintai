import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  LinearProgress,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import {
  Control,
  Controller,
  useForm,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { useAppDispatchV2 } from "../../../app/hooks";
import Title from "../../../components/Title/Title";
import * as MESSAGE_CODE from "../../../errors";
import addUserToGroup from "../../../hooks/common/addUserToGroup";
import removeUserFromGroup from "../../../hooks/common/removeUserFromGroup";
import updateCognitoUser from "../../../hooks/common/updateCognitoUser";
import { Staff } from "../../../hooks/useStaffs/common";
import useStaffs, { StaffRole } from "../../../hooks/useStaffs/useStaffs";
import { AuthContext } from "../../../Layout";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "../../../lib/reducers/snackbarReducer";
import { ROLE_OPTIONS } from "../AdminStaff/CreateStaffDialog";

type Inputs = {
  staffId?: Staff["sub"];
  familyName?: Staff["familyName"] | null;
  givenName?: Staff["givenName"] | null;
  mailAddress?: Staff["mailAddress"];
  owner: boolean;
  beforeRoles: StaffRole[];
  role: string;
  usageStartDate?: Staff["usageStartDate"] | null;
  sortKey: string;
};

const defaultValues: Inputs = {
  staffId: undefined,
  mailAddress: undefined,
  owner: false,
  beforeRoles: [],
  role: StaffRole.STAFF,
  sortKey: "1",
};

export default function AdminStaffEditor() {
  const { cognitoUser } = useContext(AuthContext);
  const dispatch = useAppDispatchV2();
  const { staffId } = useParams();

  const [saving, setSaving] = useState(false);

  const {
    staffs,
    loading: staffLoading,
    error: staffError,
    updateStaff,
  } = useStaffs();

  const {
    register,
    control,
    setValue,
    getValues,
    handleSubmit,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<Inputs>({
    mode: "onChange",
    defaultValues,
  });

  const onSubmit = (data: Inputs) => {
    const {
      familyName,
      givenName,
      mailAddress,
      beforeRoles,
      role,
      owner,
      usageStartDate,
    } = data;

    if (!familyName || !givenName || !mailAddress || !role) {
      dispatch(setSnackbarError(MESSAGE_CODE.E05003));
      return;
    }

    setSaving(true);
    updateCognitoUser(mailAddress, familyName, givenName, mailAddress, owner)
      .then(async () => {
        if (beforeRoles.length >= 1 && beforeRoles[0] !== role) {
          const removeGroupsResponse = await Promise.all(
            beforeRoles.map(async (r) => {
              await removeUserFromGroup(mailAddress, String(r)).catch((e) => {
                throw e;
              });
            })
          )
            .then(() => true)
            .catch(() => false);

          if (!removeGroupsResponse) {
            dispatch(setSnackbarError(MESSAGE_CODE.E05003));
            return;
          }

          await addUserToGroup(mailAddress, role).catch(() => {
            dispatch(setSnackbarError(MESSAGE_CODE.E05003));
          });
        }

        const staff = staffs.find((s) => s.cognitoUserId === staffId);
        if (!staff) {
          dispatch(setSnackbarError(MESSAGE_CODE.E05001));
          return;
        }

        await updateStaff({
          id: staff.id,
          familyName,
          givenName,
          mailAddress,
          owner,
          role,
          usageStartDate: usageStartDate?.toISOString() || null,
          sortKey: data.sortKey,
        })
          .then(() => {
            dispatch(setSnackbarSuccess(MESSAGE_CODE.S05003));
          })
          .catch(() => {
            dispatch(setSnackbarError(MESSAGE_CODE.E05003));
          });
      })
      .catch(() => {
        dispatch(setSnackbarError(MESSAGE_CODE.E05003));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  useEffect(() => {
    if (!staffId || staffLoading || staffs.length === 0) {
      return;
    }

    const staff = staffs.find((s) => s.cognitoUserId === staffId);
    if (!staff) {
      dispatch(setSnackbarError(MESSAGE_CODE.E05001));
      return;
    }

    setValue("staffId", staff.cognitoUserId);
    setValue("familyName", staff.familyName);
    setValue("givenName", staff.givenName);
    setValue("mailAddress", staff.mailAddress);
    setValue("owner", staff.owner || false);
    setValue("beforeRoles", [staff.role]);
    setValue("role", staff.role);
    setValue(
      "usageStartDate",
      staff.usageStartDate ? dayjs(staff.usageStartDate) : null
    );
    setValue("sortKey", staff.sortKey || "");
  }, [staffId, staffLoading]);

  if (staffLoading) {
    return <LinearProgress />;
  }

  if (staffError) {
    dispatch(setSnackbarError(MESSAGE_CODE.E05001));
    return null;
  }

  const makeStaffName = () => {
    const staff = staffs.find((s) => s.cognitoUserId === staffId);
    if (!staff) {
      return "(未設定)";
    }

    const { familyName, givenName } = staff;
    if (!familyName || !givenName) {
      return "(未設定)";
    }

    return `${familyName} ${givenName}`;
  };

  return (
    <Container maxWidth="xl" sx={{ height: 1, pt: 2 }}>
      <Stack spacing={2}>
        <Breadcrumbs>
          <Link to="/" color="inherit">
            TOP
          </Link>
          <Link to="/admin/staff" color="inherit">
            スタッフ一覧
          </Link>
          <Typography color="text.primary">{makeStaffName()}</Typography>
          <Typography color="text.primary">スタッフ編集</Typography>
        </Breadcrumbs>
        <Title>スタッフ編集</Title>
        <TableContainer>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>スタッフID</TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {getValues("staffId")}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>汎用コード</TableCell>
                <TableCell>
                  <Typography variant="body1">
                    <TextField
                      {...register("sortKey")}
                      size="small"
                      placeholder="例：1、2、3...やZZ001、ZZ002...など"
                      helperText="このコードを利用してスタッフ一覧などの表示順を指定します。"
                      sx={{ width: 400 }}
                    />
                  </Typography>
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
                  <Typography variant="body1">
                    <Controller
                      name="usageStartDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          {...field}
                          value={field.value}
                          format="YYYY/M/D"
                          slotProps={{
                            textField: { size: "small" },
                          }}
                        />
                      )}
                    />
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box>
          <Button
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

function StaffRoleTableCell({
  control,
  setValue,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<Inputs, any>;
  setValue: UseFormSetValue<Inputs>;
}) {
  return (
    <TableCell>
      <Box>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              value={
                ROLE_OPTIONS.find(
                  (option) => String(option.value) === field.value
                ) ?? null
              }
              options={ROLE_OPTIONS}
              renderInput={(params) => (
                <TextField {...params} size="small" sx={{ width: 400 }} />
              )}
              onChange={(_, data) => {
                if (!data) return;
                setValue("role", data.value);
                field.onChange(data.value);
              }}
            />
          )}
        />
      </Box>
    </TableCell>
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

function StaffNameTableCell({
  register,
}: {
  register: UseFormRegister<Inputs>;
}) {
  return (
    <TableCell>
      <Stack direction="row" spacing={1}>
        <TextField
          {...register("familyName", { required: true })}
          size="small"
          label="姓"
        />
        <TextField
          {...register("givenName", { required: true })}
          size="small"
          label="名"
        />
      </Stack>
    </TableCell>
  );
}
