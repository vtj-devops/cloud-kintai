import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { getDesignTokens } from "@shared/designSystem";
import { SubsectionTitle } from "@shared/ui/typography";
import { type ReactNode, useContext, useMemo } from "react";

type Props = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export default function GroupSection({
  title,
  description,
  actions,
  children,
}: Props) {
  const { getThemeTokens } = useContext(AppConfigContext);
  const tokens = useMemo(
    () =>
      typeof getThemeTokens === "function"
        ? getThemeTokens()
        : getDesignTokens(),
    [getThemeTokens]
  );
  const adminPanelTokens = tokens.component.adminPanel;
  const panelSpacing = adminPanelTokens.sectionSpacing;
  const dividerColor = adminPanelTokens.dividerColor;
  const brandAccent = tokens.color.brand.primary.base;
  const surfaceColor = adminPanelTokens.surface;
  const groupContainerTokens = tokens.component.groupContainer;
  const titleColor = tokens.color.brand.primary.dark ?? brandAccent;
  const panelHalfGap = panelSpacing / 2;

  return (
    <section
      className="flex flex-col"
      style={{
        gap: `${panelHalfGap}px`,
        border: `1px solid ${dividerColor}`,
        borderLeft: `${groupContainerTokens.accentWidth}px solid ${brandAccent}`,
        backgroundColor: surfaceColor,
        padding: `${panelSpacing}px`,
        borderRadius: "20px",
      }}
    >
      <div className="flex flex-col" style={{ gap: `${panelHalfGap}px` }}>
        <div
          className="flex items-center justify-between"
          style={{ gap: "8px" }}
        >
          <SubsectionTitle className="m-0 text-lg font-semibold" style={{ color: titleColor }}>
            {title}
          </SubsectionTitle>
          {actions && <div>{actions}</div>}
        </div>
        {description && (
          <p className="m-0 text-sm text-slate-500">{description}</p>
        )}
        <div className="h-px w-full" style={{ backgroundColor: dividerColor }} />
        <div style={{ paddingTop: `${panelHalfGap}px` }}>{children}</div>
      </div>
    </section>
  );
}
