import { Container, Stack } from "@mui/material";
import CommonBreadcrumbs, {
  type BreadcrumbItem,
} from "@shared/ui/breadcrumbs/CommonBreadcrumbs";
import Title from "@shared/ui/typography/Title";
import type { ReactNode } from "react";

import { designTokenVar } from "@/shared/designSystem";

const PAGE_PADDING_TOP = designTokenVar("component.page.paddingTop", "24px");
const PAGE_SECTION_GAP = designTokenVar("component.page.sectionGap", "16px");

interface PageProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
  maxWidth?: "xl" | "lg" | "md" | "sm" | false;
  showDefaultHeader?: boolean;
}

export default function Page({
  title,
  breadcrumbs = [{ label: "TOP", href: "/" }],
  children,
  maxWidth = "xl",
  showDefaultHeader = true,
}: PageProps) {
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters
      className="pt-6"
      style={{ paddingTop: PAGE_PADDING_TOP }}
    >
      <Stack direction="column" spacing={0} style={{ gap: PAGE_SECTION_GAP }}>
        {showDefaultHeader && (
          <>
            <CommonBreadcrumbs items={breadcrumbs} current={title} />
            <Title>{title}</Title>
          </>
        )}
        {children}
      </Stack>
    </Container>
  );
}
