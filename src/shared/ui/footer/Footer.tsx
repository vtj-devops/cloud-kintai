import { Typography } from "@mui/material";

import { designTokenVar } from "@/shared/designSystem";

interface FooterProps {
  themeColor?: string;
}

const FOOTER_BACKGROUND = designTokenVar(
  "component.footer.background",
  "#0B6D53"
);
const FOOTER_TEXT = designTokenVar("component.footer.textColor", "#FFFFFF");
const FOOTER_DIVIDER = designTokenVar(
  "component.footer.dividerColor",
  "#D9E2DD"
);
const FOOTER_PADDING_X = designTokenVar("component.footer.paddingX", "16px");
const FOOTER_PADDING_Y = designTokenVar("component.footer.paddingY", "12px");

const Footer = ({ themeColor }: FooterProps) => (
  <footer
    role="contentinfo"
    className="border-t"
    style={{
      backgroundColor: themeColor ?? FOOTER_BACKGROUND,
      color: FOOTER_TEXT,
      borderColor: FOOTER_DIVIDER,
    }}
  >
    <div
      className="text-center"
      style={{
        paddingTop: FOOTER_PADDING_Y,
        paddingBottom: FOOTER_PADDING_Y,
        paddingLeft: FOOTER_PADDING_X,
        paddingRight: FOOTER_PADDING_X,
        textAlign: "center",
      }}
    >
      <Typography variant="body1" align="center" className="text-center font-medium">
        © 2026 Virtual Tech Japan Inc.
      </Typography>
    </div>
  </footer>
);

export default Footer;
