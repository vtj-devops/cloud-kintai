import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  Link,
  Stack,
  styled,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { useAppDispatchV2 } from "@/app/hooks";
import * as MESSAGE_CODE from "@/errors";
import updateStaff from "@/hooks/useStaff/updateStaff";
import { AttendanceDate } from "@/lib/AttendanceDate";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/lib/reducers/snackbarReducer";

import Title from "../components/Title/Title";
import fetchStaff from "../hooks/useStaff/fetchStaff";
import {
  mappingStaffRole,
  roleLabelMap,
  StaffType,
} from "../hooks/useStaffs/useStaffs";
import { AuthContext } from "../Layout";

const NotificationSwitch = styled(Switch)(({ theme }) => ({
  padding: 8,
  "& .MuiSwitch-track": {
    borderRadius: 22 / 2,
    "&::before, &::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: 16,
      height: 16,
    },
    "&::before": {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main)
      )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
      left: 12,
    },
    "&::after": {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main)
      )}" d="M19,13H5V11H19V13Z" /></svg>')`,
      right: 12,
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "none",
    width: 16,
    height: 16,
    margin: 2,
  },
}));

export type StaffNotificationInputs = {
  workStart: boolean;
  workEnd: boolean;
};

export default function Profile() {
  const dispatch = useAppDispatchV2();
  const { cognitoUser } = useContext(AuthContext);
  const [staff, setStaff] = useState<StaffType | null | undefined>(undefined);

  const {
    control,
    setValue,
    handleSubmit,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<StaffNotificationInputs>({
    mode: "onChange",
  });

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
          role: mappingStaffRole(res.role),
        });

        setValue("workStart", res.notifications?.workStart ?? true);
        setValue("workEnd", res.notifications?.workEnd ?? true);
      })
      .catch((e: Error) => {
        console.log(e);
      });
  }, []);

  if (!cognitoUser || staff === undefined) {
    return null;
  }

  const onSubmit = (data: StaffNotificationInputs) => {
    if (!staff) return;
    updateStaff({
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
      notifications: {
        workStart: data.workStart,
        workEnd: data.workEnd,
      },
    })
      .then(() => dispatch(setSnackbarSuccess(MESSAGE_CODE.S05003)))
      .catch(() => dispatch(setSnackbarError(MESSAGE_CODE.E05003)));
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 2 }}>
      <Stack direction="column" spacing={2}>
        <Breadcrumbs>
          <Link href="/" color="inherit">
            TOP
          </Link>
          <Typography color="text.primary">個人設定</Typography>
        </Breadcrumbs>
        <Title>個人設定</Title>
        <TableContainer>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell sx={{ width: 200 }}>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    名前
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {cognitoUser.familyName} {cognitoUser.givenName} さん
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    メールアドレス
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {cognitoUser.mailAddress}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    権限
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {staff?.role ? roleLabelMap.get(staff.role) : "未設定"}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    利用開始日
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {staff?.usageStartDate
                      ? dayjs(staff.usageStartDate).format(
                          AttendanceDate.DisplayFormat
                        )
                      : "未設定"}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    通知設定
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="column" spacing={1}>
                    <FormControlLabel
                      control={
                        <Controller
                          name="workStart"
                          control={control}
                          render={({ field }) => (
                            <NotificationSwitch
                              {...field}
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          )}
                        />
                      }
                      label="勤務開始メール"
                    />
                    <FormControlLabel
                      control={
                        <Controller
                          name="workEnd"
                          control={control}
                          render={({ field }) => (
                            <NotificationSwitch
                              {...field}
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          )}
                        />
                      }
                      label="勤務終了メール"
                    />
                  </Stack>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box>
          <Button
            variant="contained"
            size="medium"
            disabled={!isValid || !isDirty || isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={16} />}
            onClick={handleSubmit(onSubmit)}
          >
            保存
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
