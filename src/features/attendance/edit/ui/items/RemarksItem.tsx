import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import { RemarksInputField } from "@features/attendance/edit/ui/items/RemarksInputField";
import { toStringArray } from "@features/attendance/edit/ui/items/remarksItemUtils";
import { RemarksTags } from "@features/attendance/edit/ui/items/RemarksTags";
import { SectionTitle } from "@shared/ui/typography";
import { useContext, useState } from "react";

export default function RemarksItem() {
  const { getValues, setValue, control, watch, readOnly } = useContext(
    AttendanceEditContext,
  );
  const [isExpanded, setIsExpanded] = useState(false);

  if (!getValues) return null;

  const tags = watch
    ? toStringArray(watch("remarkTags"))
    : toStringArray(getValues("remarkTags"));
  const remarksValue = watch
    ? ((watch("remarks") as string | null | undefined) ?? "")
    : ((getValues("remarks") as string | null | undefined) ?? "");

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-slate-400/80 bg-white p-2 transition-[border-color,box-shadow] duration-150 ease-in-out focus-within:border-emerald-500/50 focus-within:shadow-[0_0_0_3px_rgb(16_185_129/0.12)]">
            <div className="flex w-full flex-wrap items-center gap-2">
              <RemarksTags tags={tags} />
              <button
                type="button"
                className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-sm leading-none text-slate-700 transition-[border-color,background-color] duration-150 ease-in-out hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgb(16_185_129/0.18)]"
                onClick={() => setIsExpanded(true)}
                aria-label="備考入力を全画面で開く"
              >
                ⤢
              </button>
            </div>

            <div className="w-full">
              <RemarksInputField
                control={control}
                getValues={getValues}
                setValue={setValue}
                readOnly={!!readOnly}
              />
            </div>
          </div>
        </div>
      </div>
      {isExpanded ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-slate-900/45"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remarks-expanded-title"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="flex w-full flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-[14px] py-3">
              <SectionTitle id="remarks-expanded-title" className="m-0 text-base font-bold text-slate-900">
                備考入力
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
              value={remarksValue}
              className="w-full flex-1 resize-none border-none p-[14px] text-sm leading-[1.7] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="備考を入力してください（タグは上に表示されます）"
              disabled={!!readOnly}
              onChange={(e) =>
                setValue?.("remarks", e.target.value, {
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
