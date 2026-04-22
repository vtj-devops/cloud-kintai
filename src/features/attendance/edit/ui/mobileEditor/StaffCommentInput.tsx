import "./StaffCommentInput.scss";

import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import { AttendanceEditContext } from "@features/attendance/edit/model/AttendanceEditProvider";
import {
  createSelectReasonHandler,
  getEnabledReasons,
  ReasonItem,
} from "@features/attendance/edit/ui/mobileEditor/staffCommentInputUtils";
import { StaffCommentReasonButtons } from "@features/attendance/edit/ui/mobileEditor/StaffCommentReasonButtons";
import { StaffCommentTextarea } from "@features/attendance/edit/ui/mobileEditor/StaffCommentTextarea";
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
      <div className="staff-comment-input">
        <div className="staff-comment-input__header">
          <button
            type="button"
            className="staff-comment-input__expand-button"
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
          className="staff-comment-input__overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-comment-expanded-title"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="staff-comment-input__overlay-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="staff-comment-input__overlay-header">
              <SectionTitle
                id="staff-comment-expanded-title"
                className="staff-comment-input__overlay-title"
              >
                修正理由入力
              </SectionTitle>
              <button
                type="button"
                className="staff-comment-input__close-button"
                onClick={() => setIsExpanded(false)}
              >
                閉じる
              </button>
            </div>
            <textarea
              value={staffCommentValue}
              className="staff-comment-input__overlay-textarea"
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
