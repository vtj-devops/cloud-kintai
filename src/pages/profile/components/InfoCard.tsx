import React from "react";

interface InfoCardProps {
  label: string;
  value: string;
}

export const InfoCard = React.memo(function InfoCard({ label, value }: InfoCardProps) {
  return (
    <div className="min-w-0 rounded-[1.35rem] border border-emerald-100/80 bg-white/85 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
      <p className="text-xs font-medium tracking-[0.04em] text-slate-500">{label}</p>
      <p className="mt-1.5 break-words text-[0.95rem] font-semibold text-slate-900">{value}</p>
    </div>
  );
});
