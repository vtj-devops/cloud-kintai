import type { ReactNode } from "react";

import PageLoader from "./PageLoader";

export type DataStateContainerProps = {
  isLoading: boolean;
  hasData: boolean;
  loadingContent?: ReactNode;
  emptyContent?: ReactNode;
  children: ReactNode;
};

export function DataStateContainer({
  isLoading,
  hasData,
  loadingContent,
  emptyContent = null,
  children,
}: DataStateContainerProps) {
  if (isLoading) {
    return <>{loadingContent ?? <PageLoader />}</>;
  }
  if (!hasData) {
    return <>{emptyContent}</>;
  }
  return <>{children}</>;
}
