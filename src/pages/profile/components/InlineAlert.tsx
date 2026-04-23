import { InlineAlert as SharedInlineAlert } from "@shared/ui/feedback/InlineAlert";
import React from "react";

interface InlineAlertProps {
  variant: "success" | "error";
  children: string;
  onClose?: () => void;
}

export const InlineAlert = React.memo(function InlineAlert({
  variant,
  children,
  onClose,
}: InlineAlertProps) {
  return (
    <SharedInlineAlert tone={variant} onClose={onClose}>
      {children}
    </SharedInlineAlert>
  );
});
