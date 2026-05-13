import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import AdminSettingsLayout from "@features/admin/layout/ui/AdminSettingsLayout";
import SettingsIcon from "@features/admin/layout/ui/SettingsIcon";
import {
  SettingsButton,
  SettingsTextField,
} from "@features/admin/layout/ui/SettingsPrimitives";
import {
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import { resolveThemeColor } from "@shared/config/theme";
import { useAppNotification } from "@shared/lib/useAppNotification";
import { usePageLeaveGuard } from "@shared/ui/feedback/usePageLeaveGuard";
import { SubsectionTitle } from "@shared/ui/typography";
import type { CSSProperties } from "react";
import { useContext, useEffect, useMemo, useState } from "react";

import { E15001, S15001 } from "@/errors";

const basePalette = [
  "#1976d2",
  "#1e88e5",
  "#2196f3",
  "#64b5f6",
  "#4dd0e1",
  "#00acc1",
  "#26c6da",
  "#43a047",
  "#66bb6a",
  "#7cb342",
  "#9ccc65",
  "#c0ca33",
  "#f9a825",
  "#ffb300",
  "#ffca28",
  "#ffb74d",
  "#ffa726",
  "#fb8c00",
  "#f4511e",
  "#ef5350",
  "#ec407a",
  "#ab47bc",
  "#ba68c8",
  "#9575cd",
  "#5c6bc0",
  "#42a5f5",
];

const isDarkColor = (color: string) => {
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  return brightness < 110;
};

const DEFAULT_BRAND_COLOR = resolveThemeColor();

const paletteCandidates = [
  DEFAULT_BRAND_COLOR,
  ...basePalette.filter(
    (color) => color.toLowerCase() !== DEFAULT_BRAND_COLOR.toLowerCase(),
  ),
];

const presetPalette = paletteCandidates
  .filter((color) => !isDarkColor(color))
  .slice(0, 20);
const TILE_SIZE = 44;
const MAX_TILES_PER_ROW = 10;

export default function AdminTheme() {
  const { notify } = useAppNotification();
  const {
    getThemeColor,
    getConfigId,
    saveConfig,
    fetchConfig,
    getThemeTokens,
  } = useContext(AppConfigContext);
  const [colorCode, setColorCode] = useState(DEFAULT_BRAND_COLOR);
  const [currentColor, setCurrentColor] = useState(DEFAULT_BRAND_COLOR);
  const [customMode, setCustomMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const isValidHex = useMemo(
    () => /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(colorCode),
    [colorCode],
  );
  const themeTokens = getThemeTokens();
  const adminPanelTokens = themeTokens.component.adminPanel;
  const panelSpacing = adminPanelTokens.sectionSpacing;

  useEffect(() => {
    const themeColor =
      typeof getThemeColor === "function"
        ? getThemeColor()
        : DEFAULT_BRAND_COLOR;
    if (!themeColor) return;
    setColorCode(themeColor);
    setCurrentColor(themeColor);
    const matchesPreset = presetPalette.some(
      (color) => color.toLowerCase() === themeColor.toLowerCase(),
    );
    setCustomMode(!matchesPreset);
  }, [getThemeColor]);

  const normalizeColor = (value: string) => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    const formatted = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    return formatted.toUpperCase();
  };

  const normalizedColorCode = normalizeColor(colorCode);
  const normalizedCurrentColor = normalizeColor(currentColor);
  const isDirty =
    normalizedColorCode !== "" &&
    normalizedColorCode !== normalizedCurrentColor;
  const { dialog } = usePageLeaveGuard({
    isDirty,
    isBusy: saving,
  });
  const previewTokens = useMemo(
    () => (isValidHex ? getThemeTokens(normalizedColorCode) : themeTokens),
    [isValidHex, normalizedColorCode, themeTokens, getThemeTokens],
  );
  const previewPanelTokens = previewTokens.component.adminPanel;
  const previewPanelDividerColor = previewPanelTokens.dividerColor;
  const previewPanelSurface = previewPanelTokens.surface;
  const brandPrimary = previewTokens.color.brand.primary.base;
  const focusRingColor = previewTokens.color.brand.primary.focusRing;
  const paletteTileGap = panelSpacing / 2;

  const handleHexInput = (value: string) => {
    if (!value) {
      setColorCode("");
      return;
    }
    setColorCode(value.startsWith("#") ? value : `#${value}`);
  };

  const handlePresetSelect = (color: string) => {
    setColorCode(color.toUpperCase());
    setCustomMode(false);
  };

  const handleSave = async () => {
    if (!isValidHex) {
      notify({
        title: "エラー",
        description: E15001,
        tone: "error",
      });
      return;
    }

    const payloadColor = normalizeColor(colorCode);
    if (!payloadColor) {
      notify({
        title: "エラー",
        description: E15001,
        tone: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const id = getConfigId();
      if (id) {
        await saveConfig({
          id,
          themeColor: payloadColor,
        } as UpdateAppConfigInput);
      } else {
        await saveConfig({
          name: "default",
          themeColor: payloadColor,
        } as CreateAppConfigInput);
      }
      await fetchConfig();
      setCurrentColor(payloadColor);
      notify({ title: S15001, tone: "success" });
    } catch (error) {
      console.error(error);
      notify({
        title: "エラー",
        description: E15001,
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminSettingsLayout description="テーマを選択すると、ヘッダーとフッターの配色が変更されます。">
      {dialog}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <SubsectionTitle className="text-sm font-semibold text-slate-800">
              テーマカラー
            </SubsectionTitle>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_SIZE}px, 1fr))`,
                maxWidth: `${
                  MAX_TILES_PER_ROW * TILE_SIZE +
                  (MAX_TILES_PER_ROW - 1) * paletteTileGap
                }px`,
              }}
            >
              {presetPalette.map((color) => {
                const isSelected =
                  normalizedColorCode !== "" &&
                  normalizedColorCode === normalizeColor(color);
                return (
                  <button
                    key={color}
                    onClick={() => handlePresetSelect(color)}
                    type="button"
                    className="rounded-md border-2 transition focus:outline-none"
                    aria-label={`テーマカラー ${color}`}
                    style={{
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      borderColor: isSelected
                        ? brandPrimary
                        : previewPanelDividerColor,
                      backgroundColor: color,
                      boxShadow: isSelected
                        ? `0 0 0 2px ${focusRingColor}`
                        : "none",
                    }}
                  />
                );
              })}
              <button
                onClick={() => setCustomMode(true)}
                type="button"
                className="flex items-center justify-center rounded-md border-2 border-dashed bg-transparent focus:outline-none"
                aria-label="その他のカラーコードを入力"
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  borderColor: customMode
                    ? brandPrimary
                    : previewPanelDividerColor,
                  color: customMode ? brandPrimary : "#64748b",
                  boxShadow: customMode
                    ? `0 0 0 2px ${focusRingColor}`
                    : "none",
                }}
              >
                <SettingsIcon name="plus" />
              </button>
            </div>
          </div>

          {customMode && (
            <div className="flex flex-col gap-2">
              <SubsectionTitle className="text-sm font-semibold text-slate-800">
                カラーコードを直接指定
              </SubsectionTitle>
              <SettingsTextField
                label="#RRGGBB"
                value={colorCode}
                onChange={handleHexInput}
                errorText={
                  isValidHex ? "" : "正しい16進数カラーコードを入力してください"
                }
                className="max-w-[240px]"
                inputClassName="uppercase"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <SubsectionTitle className="text-sm font-semibold text-slate-800">
              プレビュー
            </SubsectionTitle>
            <div
              className="p-4 rounded-lg border max-w-sm flex flex-col gap-2"
              style={{
                borderColor: previewPanelDividerColor,
                backgroundColor: previewPanelSurface,
              }}
            >
              <h4 className="text-base font-medium text-slate-800">
                管理パネルプレビュー
              </h4>
              <p
                className="text-xs text-slate-500 pb-2 border-b"
                style={{ borderColor: previewPanelDividerColor }}
              >
                選択したカラーがフォーカスリングやボタンにどう反映されるかを確認できます。
              </p>
              <SettingsButton
                className="mt-1 self-start [--app-button-bg:var(--preview-brand-primary)] [--app-button-border:var(--preview-brand-primary)] [--app-button-hover-bg:var(--preview-brand-primary)] [--app-button-hover-border:var(--preview-brand-primary)] [--app-button-color:var(--preview-brand-contrast)] [--app-button-hover-color:var(--preview-brand-contrast)] [--ds-shadow-focus:0_0_0_2px_var(--preview-focus-ring)]"
                style={
                  {
                    "--preview-brand-primary": brandPrimary,
                    "--preview-brand-contrast":
                      previewTokens.color.brand.primary.contrastText,
                    "--preview-focus-ring": focusRingColor,
                  } as CSSProperties
                }
              >
                プライマリボタン
              </SettingsButton>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <SettingsButton
              onClick={handleSave}
              disabled={!isValidHex || saving || !isDirty}
            >
              {saving ? "保存中..." : "保存"}
            </SettingsButton>
          </div>
        </div>
      </div>
    </AdminSettingsLayout>
  );
}
