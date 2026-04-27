import {
  STAFF_EXTERNAL_LINKS_LIMIT,
} from "@entities/staff/externalLink";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import React from "react";
import { Controller } from "react-hook-form";

import type { LinksControl, UseProfileFormReturn } from "../hooks/useProfileForm";
import { isValidUrl } from "../hooks/useProfileForm";
import { AutoSaveStatus } from "./AutoSaveStatus";
import { ProfileSectionHeader } from "./ProfileSectionHeader";

const inputBaseClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

interface ProfileLinksTabProps {
  linksControl: LinksControl;
  externalLinkFields: UseProfileFormReturn["externalLinkFields"];
  handleAddLink: () => void;
  handleRemoveLink: (index: number) => void;
  canAddMoreLinks: boolean;
  isAutoSaving: boolean;
  isAutoSavePending: boolean;
  lastSavedAt: Date | null;
  hasPendingLinkInput: boolean;
}

export const ProfileLinksTab = React.memo(function ProfileLinksTab({
  linksControl,
  externalLinkFields,
  handleAddLink,
  handleRemoveLink,
  canAddMoreLinks,
  isAutoSaving,
  isAutoSavePending,
  lastSavedAt,
  hasPendingLinkInput,
}: ProfileLinksTabProps) {
  return (
    <div className="w-full max-w-[920px] space-y-5">
      <ProfileSectionHeader
        title="個人リンク設定"
        description="自分専用のショートカットを登録できます。ヘッダーのリンク一覧から開く想定です。"
      />
      <AutoSaveStatus
        isSaving={isAutoSaving}
        isPending={isAutoSavePending}
        lastSavedAt={lastSavedAt}
        helperText={
          hasPendingLinkInput ? "表示名とURLがそろうまで保存されません。" : undefined
        }
      />
      <p className="text-sm leading-6 text-slate-500">アイコンは汎用リンク表示で扱われます。</p>
      {externalLinkFields.length === 0 ? (
        <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-sm text-slate-500">
          個人リンクはまだ登録されていません。
        </div>
      ) : null}
      <div className="space-y-3">
        {externalLinkFields.map((field, index) => (
          <div
            key={field.id}
            className="min-w-0 rounded-[1.6rem] border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">リンク {index + 1}</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Controller
                    name={`externalLinks.${index}.enabled`}
                    control={linksControl}
                    render={({ field: linkField }) => (
                      <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={linkField.value}
                          onChange={(event) => linkField.onChange(event.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        有効
                      </label>
                    )}
                  />
                  <button
                    type="button"
                    aria-label="リンクを削除"
                    onClick={() => handleRemoveLink(index)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </button>
                </div>
              </div>
              <div className="grid max-w-[760px] gap-4">
                <Controller
                  name={`externalLinks.${index}.label`}
                  control={linksControl}
                  rules={{
                    required: "表示名を入力してください",
                    maxLength: { value: 32, message: "32文字以内で入力してください" },
                  }}
                  render={({ field: linkField, fieldState }) => (
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">表示名</span>
                      <input
                        {...linkField}
                        className={[
                          inputBaseClassName,
                          fieldState.error
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                            : "",
                        ].join(" ")}
                      />
                      {fieldState.error?.message ? (
                        <p className="text-xs text-rose-600">{fieldState.error.message}</p>
                      ) : null}
                    </label>
                  )}
                />
                <Controller
                  name={`externalLinks.${index}.url`}
                  control={linksControl}
                  rules={{
                    required: "URLを入力してください",
                    validate: (value) =>
                      isValidUrl(value) || "https:// から始まるURLを入力してください",
                  }}
                  render={({ field: linkField, fieldState }) => (
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">URL</span>
                      <input
                        {...linkField}
                        placeholder="https://..."
                        className={[
                          inputBaseClassName,
                          fieldState.error
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                            : "",
                        ].join(" ")}
                      />
                      {fieldState.error?.message ? (
                        <p className="text-xs text-rose-600">{fieldState.error.message}</p>
                      ) : null}
                    </label>
                  )}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleAddLink}
          disabled={!canAddMoreLinks}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <AddCircleOutlineIcon fontSize="small" />
          リンクを追加
        </button>
        {!canAddMoreLinks ? (
          <p className="text-xs text-slate-500">
            最大{STAFF_EXTERNAL_LINKS_LIMIT}件まで追加できます。
          </p>
        ) : null}
      </div>
    </div>
  );
});
