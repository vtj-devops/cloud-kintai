import AppIconButton from "@shared/ui/button/AppIconButton";
import SettingsIcon from "@features/admin/layout/ui/SettingsIcon";
import {
  SettingsButton,
  SettingsCheckbox,
  SettingsSelect,
  SettingsTextField,
} from "@features/admin/layout/ui/SettingsPrimitives";
import { predefinedIcons } from "@shared/config/icons";
import { SubsectionTitle } from "@shared/ui/typography";

interface Link {
  label: string;
  url: string;
  enabled: boolean;
  icon: string;
}

interface LinkListSectionProps {
  links: Link[];
  onAddLink: () => void;
  onLinkChange: (
    index: number,
    field: "label" | "url" | "enabled" | "icon",
    value: string | boolean
  ) => void;
  onRemoveLink: (index: number) => void;
}

const LinkListSection = ({
  links,
  onAddLink,
  onLinkChange,
  onRemoveLink,
}: LinkListSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <SubsectionTitle className="text-base font-semibold text-slate-800">リンク集</SubsectionTitle>
      <p className="text-sm text-slate-500">
        ヘッダーのリンク集に表示するリンクを設定してください。
        <br />
        URL内で<code className="bg-slate-100 px-1 rounded text-pink-600">{"{staffName}"}</code>
        を使用すると、スタッフ名が動的に挿入されます。
      </p>
    </div>
    <div className="flex flex-col gap-3">
      {links.map((link, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          {/* カードヘッダー */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              リンク {index + 1}
            </span>
            <AppIconButton
              tone="danger"
              aria-label="削除"
              onClick={() => onRemoveLink(index)}
            >
              <SettingsIcon name="delete" />
            </AppIconButton>
          </div>
          {/* カードボディ */}
          <div className="flex flex-col gap-3 p-4">
            {/* 行1: ラベル + URL */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr]">
              <SettingsTextField
                label="ラベル"
                value={link.label}
                onChange={(value) => onLinkChange(index, "label", value)}
              />
              <SettingsTextField
                label="URL"
                value={link.url}
                onChange={(value) => onLinkChange(index, "url", value)}
              />
            </div>
            {/* 行2: アイコン + プレビュー + 有効 */}
            <div className="flex items-end gap-3">
              <SettingsSelect
                label="アイコン"
                value={link.icon}
                onChange={(value) => onLinkChange(index, "icon", value)}
                className="w-[200px] min-w-[160px]"
                options={predefinedIcons.map((icon) => ({
                  value: icon.value,
                  label: icon.label,
                }))}
              />
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2">
                {(predefinedIcons.find((icon) => icon.value === link.icon) ?? predefinedIcons[0])?.component}
              </div>
              <SettingsCheckbox
                checked={link.enabled}
                onChange={(checked) => onLinkChange(index, "enabled", checked)}
                label="有効"
              />
            </div>
          </div>
        </div>
      ))}
      <SettingsButton
        variant="secondary"
        size="sm"
        onClick={onAddLink}
      >
        <SettingsIcon name="plus" />
        リンクを追加
      </SettingsButton>
    </div>
  </div>
);

export default LinkListSection;
