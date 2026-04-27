import clsx from "clsx";
import React from "react";

export type CardProps = {
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
};

export function Card({ children, className, "data-testid": testId }: CardProps) {
  return (
    <div
      data-testid={testId}
      className={clsx(
        "rounded-xl border border-slate-300/40 bg-white px-3 py-3 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.45)] md:px-4 md:py-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
