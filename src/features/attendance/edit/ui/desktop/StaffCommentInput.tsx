import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { AttendanceEditInputs } from "@features/attendance/edit/model/common";
import { useContext, useEffect, useState } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";

export default function StaffCommentInput({
  register,
  setValue,
}: {
  register: UseFormRegister<AttendanceEditInputs>;
  setValue: UseFormSetValue<AttendanceEditInputs>;
}) {
  const { getReasons } = useContext(AppConfigContext);
  const { changeRequests } = useContext(AttendanceEditContext);
  const [reasons, setReasons] = useState<
    { reason: string; enabled: boolean }[]
  >([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReasons(getReasons().filter((reason) => reason.enabled));
  }, [getReasons]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start">
      <div className="w-full text-sm font-bold text-slate-900 md:w-[150px]">
        修正理由
      </div>
      <div className="min-w-0 flex-1">
        <textarea
          {...register("staffComment")}
          placeholder="修正理由欄：管理者へ伝えたいことを記載"
          disabled={changeRequests.length > 0}
          data-testid="staff-comment-input-desktop"
          rows={3}
          className="min-h-[108px] w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(15,168,94,0.35)] focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">クイック入力：</span>
          {reasons.map((reason, index) => (
            <button
              key={index}
              data-testid={`staff-comment-reason-chip-${index}`}
              type="button"
              disabled={changeRequests.length > 0}
              className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() =>
                setValue("staffComment", reason.reason, { shouldDirty: true })
              }
            >
              {reason.reason}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
