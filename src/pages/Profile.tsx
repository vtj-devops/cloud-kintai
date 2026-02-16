import fetchStaff from "@entities/staff/model/useStaff/fetchStaff";
import updateStaff from "@entities/staff/model/useStaff/updateStaff";
import {
  mappingStaffRole,
  roleLabelMap,
  StaffType,
} from "@entities/staff/model/useStaffs/useStaffs";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  styled,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CommonBreadcrumbs from "@shared/ui/breadcrumbs/CommonBreadcrumbs";
import Title from "@shared/ui/typography/Title";
import { updatePassword } from "aws-amplify/auth";
import dayjs from "dayjs";
import { type SyntheticEvent, useContext, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { useAppDispatchV2 } from "@/app/hooks";
import { AttendanceDate } from "@/entities/attendance/lib/AttendanceDate";
import {
  STAFF_EXTERNAL_LINKS_LIMIT,
  StaffExternalLink,
} from "@/entities/staff/externalLink";
import * as MESSAGE_CODE from "@/errors";
import { predefinedIcons } from "@/shared/config/icons";
import { MARGINS } from "@/shared/config/uiDimensions";
import { createLogger } from "@/shared/lib/logger";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";

import { AuthContext } from "../context/AuthContext";

const logger = createLogger("Profile");

const NotificationSwitch = styled(Switch)(({ theme }) => ({
  padding: MARGINS.PADDING_STANDARD,
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
        theme.palette.getContrastText(theme.palette.primary.main),
      )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
      left: 12,
    },
    "&::after": {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.primary.main),
      )}" d="M19,13H5V11H19V13Z" /></svg>')`,
      right: 12,
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "none",
    width: 16,
    height: 16,
    margin: MARGINS.FORM_MARGIN,
  },
}));

export type StaffNotificationInputs = {
  workStart: boolean;
  workEnd: boolean;
};

type StaffProfileFormInputs = StaffNotificationInputs & {
  externalLinks: StaffExternalLink[];
};

type PasswordChangeInputs = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileTab = "general" | "notifications" | "links" | "security";

const DEFAULT_ICON_VALUE = predefinedIcons[0]?.value ?? "LinkIcons";

const createEmptyExternalLink = (): StaffExternalLink => ({
  label: "",
  url: "",
  icon: DEFAULT_ICON_VALUE,
  enabled: true,
});

const sanitizeExternalLinks = (links: StaffExternalLink[]) =>
  links
    .slice(0, STAFF_EXTERNAL_LINKS_LIMIT)
    .map((link) => ({
      ...link,
      label: link.label.trim(),
      url: link.url.trim(),
      icon: DEFAULT_ICON_VALUE,
    }))
    .filter((link) => link.label !== "" && link.url !== "");

const isValidUrl = (value: string) => /^https?:\/\//i.test(value.trim());

const isProfileTab = (value: string): value is ProfileTab =>
  value === "general" ||
  value === "notifications" ||
  value === "links" ||
  value === "security";

const ProfileLogoutButton = styled(Button)(({ theme }) => ({
  color: theme.palette.logout.contrastText,
  backgroundColor: theme.palette.logout.main,
  border: `3px solid ${theme.palette.logout.main}`,
  "&:hover": {
    color: theme.palette.logout.main,
    backgroundColor: theme.palette.logout.contrastText,
  },
}));

export default function Profile() {
  const dispatch = useAppDispatchV2();
  const { cognitoUser, signOut } = useContext(AuthContext);
  const [staff, setStaff] = useState<StaffType | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<ProfileTab>("general");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(
    null,
  );

  const {
    control,
    setValue,
    handleSubmit,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<StaffProfileFormInputs>({
    mode: "onChange",
    defaultValues: {
      workStart: true,
      workEnd: true,
      externalLinks: [],
    },
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { isValid: isPasswordValid, isSubmitting: isPasswordSubmitting },
    reset: resetPasswordForm,
    getValues: getPasswordValues,
  } = useForm<PasswordChangeInputs>({
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    fields: externalLinkFields,
    append: appendExternalLink,
    remove: removeExternalLink,
  } = useFieldArray({
    control,
    name: "externalLinks",
  });

  const canAddMoreLinks =
    externalLinkFields.length < STAFF_EXTERNAL_LINKS_LIMIT;

  const handleAddLink = () => {
    if (!canAddMoreLinks) return;
    appendExternalLink(createEmptyExternalLink());
  };

  const handleRemoveLink = (index: number) => {
    removeExternalLink(index);
  };

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

        const normalizedExternalLinks = (res.externalLinks ?? [])
          .filter((link): link is NonNullable<typeof link> => Boolean(link))
          .map((link) => ({
            label: link.label,
            url: link.url,
            icon: DEFAULT_ICON_VALUE,
            enabled: link.enabled,
          }));

        setValue("workStart", res.notifications?.workStart ?? true, {
          shouldDirty: false,
        });
        setValue("workEnd", res.notifications?.workEnd ?? true, {
          shouldDirty: false,
        });
        setValue("externalLinks", normalizedExternalLinks, {
          shouldDirty: false,
        });
      })
      .catch((e: Error) => {
        logger.error("Failed to load staff data:", e);
      });
  }, [cognitoUser, setValue]);

  if (!cognitoUser || staff === undefined) {
    return null;
  }

  const onSubmit = (data: StaffProfileFormInputs) => {
    if (!staff) return;
    const preparedLinks = sanitizeExternalLinks(data.externalLinks ?? []);
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
      externalLinks: preparedLinks,
    })
      .then(() => dispatch(setSnackbarSuccess(MESSAGE_CODE.S05003)))
      .catch(() => dispatch(setSnackbarError(MESSAGE_CODE.E05003)));
  };

  const handleTabChange = (_: SyntheticEvent, value: string) => {
    if (isProfileTab(value)) {
      setActiveTab(value);
      // Reset password change messages when switching tabs
      setPasswordChangeSuccess(false);
      setPasswordChangeError(null);
    }
  };

  const onPasswordChange = async (data: PasswordChangeInputs) => {
    setPasswordChangeError(null);
    setPasswordChangeSuccess(false);

    try {
      await updatePassword({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordChangeSuccess(true);
      resetPasswordForm();
      logger.info("Password changed successfully");
    } catch (error) {
      logger.error("Failed to change password:", error);
      if (error instanceof Error) {
        if (error.name === "NotAuthorizedException") {
          setPasswordChangeError("現在のパスワードが正しくありません。");
        } else if (error.name === "InvalidPasswordException") {
          setPasswordChangeError(
            "新しいパスワードは8文字以上で、大文字・小文字・数字・記号を含める必要があります。",
          );
        } else if (error.name === "LimitExceededException") {
          setPasswordChangeError(
            "試行回数が上限に達しました。しばらくしてから再度お試しください。",
          );
        } else {
          setPasswordChangeError(
            "パスワードの変更に失敗しました。もう一度お試しください。",
          );
        }
      } else {
        setPasswordChangeError(
          "パスワードの変更に失敗しました。もう一度お試しください。",
        );
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 2, px: { xs: 2, sm: 3 } }}>
      <Stack direction="column" spacing={{ xs: 1.5, sm: 2 }}>
        <CommonBreadcrumbs
          items={[{ label: "TOP", href: "/" }]}
          current="個人設定"
        />
        <Title>個人設定</Title>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="一般設定" value="general" />
            <Tab label="通知設定" value="notifications" />
            <Tab label="個人リンク設定" value="links" />
            <Tab label="セキュリティ" value="security" />
          </Tabs>
        </Box>
        <Box sx={{ pt: 2 }}>
          {activeTab === "general" && (
            <Box>
              <Stack spacing={1.5} sx={{ maxWidth: { xs: "100%", sm: 720 } }}>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      名前
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {cognitoUser.familyName} {cognitoUser.givenName} さん
                    </Typography>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      メールアドレス
                    </Typography>
                    <Typography variant="body1">
                      {cognitoUser.mailAddress}
                    </Typography>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      権限
                    </Typography>
                    <Typography variant="body1">
                      {staff?.role ? roleLabelMap.get(staff.role) : "未設定"}
                    </Typography>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      利用開始日
                    </Typography>
                    <Typography variant="body1">
                      {staff?.usageStartDate
                        ? dayjs(staff.usageStartDate).format(
                            AttendanceDate.DisplayFormat,
                          )
                        : "未設定"}
                    </Typography>
                  </Stack>
                </Paper>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      ログアウト
                    </Typography>
                    <ProfileLogoutButton
                      onClick={signOut}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      ログアウト
                    </ProfileLogoutButton>
                  </Stack>
                </Paper>
              </Stack>
            </Box>
          )}
          {activeTab === "links" && (
            <Stack
              direction="column"
              spacing={2}
              sx={{ maxWidth: { xs: "100%", sm: 720 } }}
            >
              {externalLinkFields.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  個人リンクはまだ登録されていません。
                </Typography>
              )}
              {externalLinkFields.map((field, index) => (
                <Paper
                  key={field.id}
                  variant="outlined"
                  sx={{ p: { xs: 2, sm: 2.5 } }}
                >
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={{ xs: 1, sm: 0 }}
                    >
                      <Typography variant="subtitle2">
                        リンク {index + 1}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Controller
                          name={`externalLinks.${index}.enabled`}
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Switch
                                  {...field}
                                  checked={field.value}
                                  onChange={(e) =>
                                    field.onChange(e.target.checked)
                                  }
                                />
                              }
                              label="有効"
                            />
                          )}
                        />
                        <IconButton
                          aria-label="リンクを削除"
                          onClick={() => handleRemoveLink(index)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                    <Controller
                      name={`externalLinks.${index}.label`}
                      control={control}
                      rules={{
                        required: "表示名を入力してください",
                        maxLength: {
                          value: 32,
                          message: "32文字以内で入力してください",
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label="表示名"
                          size="small"
                          fullWidth
                          error={Boolean(fieldState.error)}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                    <Controller
                      name={`externalLinks.${index}.url`}
                      control={control}
                      rules={{
                        required: "URLを入力してください",
                        validate: (value) =>
                          isValidUrl(value) ||
                          "https:// から始まるURLを入力してください",
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          label="URL"
                          placeholder="https://..."
                          size="small"
                          fullWidth
                          error={Boolean(fieldState.error)}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                    <Typography variant="caption" color="text.secondary">
                      アイコンは「その他」で固定されています。
                    </Typography>
                  </Stack>
                </Paper>
              ))}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  variant="outlined"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleAddLink}
                  disabled={!canAddMoreLinks}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  リンクを追加
                </Button>
                {!canAddMoreLinks && (
                  <Typography variant="caption" color="text.secondary">
                    最大{STAFF_EXTERNAL_LINKS_LIMIT}件まで追加できます。
                  </Typography>
                )}
              </Stack>
            </Stack>
          )}
          {activeTab === "notifications" && (
            <Stack
              direction="column"
              spacing={2}
              sx={{ maxWidth: { xs: "100%", sm: 720 } }}
            >
              <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    通知設定
                  </Typography>
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
                </Stack>
              </Paper>
            </Stack>
          )}
          {activeTab === "security" && (
            <Stack
              direction="column"
              spacing={2}
              sx={{ maxWidth: { xs: "100%", sm: 720 } }}
            >
              <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    パスワード変更
                  </Typography>
                  {passwordChangeSuccess && (
                    <Alert
                      severity="success"
                      onClose={() => setPasswordChangeSuccess(false)}
                    >
                      パスワードを変更しました。
                    </Alert>
                  )}
                  {passwordChangeError && (
                    <Alert
                      severity="error"
                      onClose={() => setPasswordChangeError(null)}
                    >
                      {passwordChangeError}
                    </Alert>
                  )}
                  <Controller
                    name="currentPassword"
                    control={passwordControl}
                    rules={{
                      required: "現在のパスワードを入力してください",
                    }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="現在のパスワード"
                        type={showCurrentPassword ? "text" : "password"}
                        size="small"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="パスワードの表示切り替え"
                                onClick={() =>
                                  setShowCurrentPassword(!showCurrentPassword)
                                }
                                edge="end"
                              >
                                {showCurrentPassword ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="newPassword"
                    control={passwordControl}
                    rules={{
                      required: "新しいパスワードを入力してください",
                      minLength: {
                        value: 8,
                        message: "パスワードは8文字以上で入力してください",
                      },
                      validate: {
                        hasUpperCase: (value) =>
                          /[A-Z]/.test(value) ||
                          "大文字を1文字以上含めてください",
                        hasLowerCase: (value) =>
                          /[a-z]/.test(value) ||
                          "小文字を1文字以上含めてください",
                        hasNumber: (value) =>
                          /[0-9]/.test(value) ||
                          "数字を1文字以上含めてください",
                        hasSpecialChar: (value) =>
                          /[^A-Za-z0-9]/.test(value) ||
                          "記号を1文字以上含めてください",
                      },
                    }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="新しいパスワード"
                        type={showNewPassword ? "text" : "password"}
                        size="small"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={
                          fieldState.error?.message ||
                          "8文字以上で、大文字・小文字・数字・記号を含めてください"
                        }
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="パスワードの表示切り替え"
                                onClick={() =>
                                  setShowNewPassword(!showNewPassword)
                                }
                                edge="end"
                              >
                                {showNewPassword ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="confirmPassword"
                    control={passwordControl}
                    rules={{
                      required: "パスワードを再入力してください",
                      validate: (value) =>
                        value === getPasswordValues("newPassword") ||
                        "パスワードが一致しません",
                    }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="新しいパスワード(確認)"
                        type={showConfirmPassword ? "text" : "password"}
                        size="small"
                        fullWidth
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="パスワードの表示切り替え"
                                onClick={() =>
                                  setShowConfirmPassword(!showConfirmPassword)
                                }
                                edge="end"
                              >
                                {showConfirmPassword ? (
                                  <VisibilityOffIcon />
                                ) : (
                                  <VisibilityIcon />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                  <Box>
                    <Button
                      variant="contained"
                      size="medium"
                      disabled={!isPasswordValid || isPasswordSubmitting}
                      startIcon={
                        isPasswordSubmitting && <CircularProgress size={16} />
                      }
                      onClick={handlePasswordSubmit(onPasswordChange)}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      パスワードを変更
                    </Button>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          )}
        </Box>
        <Box sx={{ pb: 2 }}>
          <Button
            variant="contained"
            size="medium"
            disabled={!isValid || !isDirty || isSubmitting}
            startIcon={isSubmitting && <CircularProgress size={16} />}
            onClick={handleSubmit(onSubmit)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            保存
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}
