import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import {
  createSelectReasonHandler,
  getEnabledReasons,
  ReasonItem,
} from "@features/attendance/edit/ui/mobile/staffCommentInputUtils";
import { StaffCommentReasonButtons } from "@features/attendance/edit/ui/mobile/StaffCommentReasonButtons";
import { StaffCommentTextarea } from "@features/attendance/edit/ui/mobile/StaffCommentTextarea";
import { SectionTitle } from "@shared/ui/typography";
import { useContext, useMemo, useState } from "react";

export default function StaffCommentInput() {
  const { changeRequests, register, setValue, watch, getValues } = useContext(
    AttendanceEditContext,
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const { getReasons } = useContext(AppConfigContext);
  const reasons: ReasonItem[] = useMemo(
    () => getEnabledReasons(getReasons()),
    [getReasons],
  );

  if (!register || !setValue) {
    return null;
  }

  const isDisabled = changeRequests.length > 0;
  const staffCommentRegister = register("staffComment", { required: false });
  const handleSelectReason = createSelectReasonHandler(setValue);
  const staffCommentValue = watch
    ? ((watch("staffComment") as string | null | undefined) ?? "")
    : ((getValues?.("staffComment") as string | null | undefined) ?? "");

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-sm leading-none text-slate-700 transition-[border-color,background-color] duration-150 ease-in-out hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(16_185_129/0.18)]"
            onClick={() => setIsExpanded(true)}
            aria-label="修正理由入力を全画面で開く"
          >
            ⤢
          </button>
        </div>
        <StaffCommentTextarea
          disabled={isDisabled}
          registerProps={staffCommentRegister}
        />
        <StaffCommentReasonButtons
          reasons={reasons}
          disabled={isDisabled}
          onSelectReason={handleSelectReason}
        />
      </div>
      {isExpanded ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-slate-900/45"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-comment-expanded-title"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="flex w-full flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-[14px] py-3">
              <SectionTitle
                id="staff-comment-expanded-title"
                className="m-0 text-base font-bold text-slate-900"
              >
                修正理由入力
              </SectionTitle>
              <button
                type="button"
                className="rounded-[10px] border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-700"
                onClick={() => setIsExpanded(false)}
              >
                閉じる
              </button>
            </div>
            <textarea
              value={staffCommentValue}
              className="w-full flex-1 resize-none border-none p-[14px] text-sm leading-[1.7] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="修正理由欄：管理者へ伝えたいことを記載"
              disabled={isDisabled}
              onChange={(e) =>
                setValue("staffComment", e.target.value, {
                  shouldDirty: true,
                })
              }
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
