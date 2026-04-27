import { createLogger } from "@shared/lib/logger";
import { SubsectionTitle } from "@shared/ui/typography";
import { updatePassword } from "aws-amplify/auth";
import React, { useCallback, useState } from "react";
import { Controller } from "react-hook-form";

import type { PasswordChangeInputs, PasswordControl, UseProfileFormReturn } from "../hooks/useProfileForm";
import { InlineAlert } from "./InlineAlert";
import { PasswordField } from "./PasswordField";
import { ProfileSectionHeader } from "./ProfileSectionHeader";

const logger = createLogger("Profile");

interface ProfileSecurityTabProps {
  passwordControl: PasswordControl;
  handlePasswordSubmit: UseProfileFormReturn["handlePasswordSubmit"];
  getPasswordValues: UseProfileFormReturn["getPasswordValues"];
  resetPasswordForm: UseProfileFormReturn["resetPasswordForm"];
  isPasswordValid: boolean;
  isPasswordSubmitting: boolean;
}

export const ProfileSecurityTab = React.memo(function ProfileSecurityTab({
  passwordControl,
  handlePasswordSubmit,
  getPasswordValues,
  resetPasswordForm,
  isPasswordValid,
  isPasswordSubmitting,
}: ProfileSecurityTabProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  const onPasswordChange = useCallback(
    async (data: PasswordChangeInputs) => {
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
            setPasswordChangeError("パスワードの変更に失敗しました。もう一度お試しください。");
          }
        } else {
          setPasswordChangeError("パスワードの変更に失敗しました。もう一度お試しください。");
        }
      }
    },
    [resetPasswordForm],
  );

  return (
    <div className="w-full max-w-[920px] space-y-5">
      <ProfileSectionHeader
        title="セキュリティ"
        description="パスワードを更新して、ログイン情報を管理します。"
      />
      <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
        <div className="space-y-4">
          <SubsectionTitle className="text-base font-semibold text-slate-900">
            パスワード変更
          </SubsectionTitle>
          {passwordChangeSuccess ? (
            <InlineAlert
              variant="success"
              onClose={() => setPasswordChangeSuccess(false)}
            >
              パスワードを変更しました。
            </InlineAlert>
          ) : null}
          {passwordChangeError ? (
            <InlineAlert variant="error" onClose={() => setPasswordChangeError(null)}>
              {passwordChangeError}
            </InlineAlert>
          ) : null}
          <div className="grid max-w-[760px] gap-4">
            <Controller
              name="currentPassword"
              control={passwordControl}
              rules={{ required: "現在のパスワードを入力してください" }}
              render={({ field, fieldState }) => (
                <PasswordField
                  label="現在のパスワード"
                  type={showCurrentPassword ? "text" : "password"}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  showPassword={showCurrentPassword}
                  onToggleVisibility={() => setShowCurrentPassword(!showCurrentPassword)}
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
                    /[A-Z]/.test(value) || "大文字を1文字以上含めてください",
                  hasLowerCase: (value) =>
                    /[a-z]/.test(value) || "小文字を1文字以上含めてください",
                  hasNumber: (value) =>
                    /[0-9]/.test(value) || "数字を1文字以上含めてください",
                  hasSpecialChar: (value) =>
                    /[^A-Za-z0-9]/.test(value) || "記号を1文字以上含めてください",
                },
              }}
              render={({ field, fieldState }) => (
                <PasswordField
                  label="新しいパスワード"
                  type={showNewPassword ? "text" : "password"}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  helperText="8文字以上で、大文字・小文字・数字・記号を含めてください"
                  showPassword={showNewPassword}
                  onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={passwordControl}
              rules={{
                required: "パスワードを再入力してください",
                validate: (value) =>
                  value === getPasswordValues("newPassword") || "パスワードが一致しません",
              }}
              render={({ field, fieldState }) => (
                <PasswordField
                  label="新しいパスワード(確認)"
                  type={showConfirmPassword ? "text" : "password"}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  showPassword={showConfirmPassword}
                  onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              )}
            />
          </div>
          <div>
            <button
              type="button"
              disabled={!isPasswordValid || isPasswordSubmitting}
              onClick={handlePasswordSubmit(onPasswordChange)}
              className="inline-flex w-full items-center justify-center rounded-[1rem] bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isPasswordSubmitting ? "変更中..." : "パスワードを変更"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
