import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { UseFormRegisterReturn } from "react-hook-form";

type StaffCommentTextareaProps = {
  disabled: boolean;
  registerProps: UseFormRegisterReturn<keyof AttendanceEditInputs>;
};

export function StaffCommentTextarea({
  disabled,
  registerProps,
}: StaffCommentTextareaProps) {
  return (
    <textarea
      {...registerProps}
      placeholder="修正理由欄：管理者へ伝えたいことを記載"
      disabled={disabled}
      data-testid="staff-comment-input-mobile"
      rows={3}
      className="w-full min-h-[72px] resize-y rounded-md border border-slate-300 bg-white px-[10px] py-2 text-sm leading-relaxed text-slate-900 transition-[border-color,box-shadow] duration-150 ease-in-out placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
    />
  );
}
