import GroupContainer from "@shared/ui/group-container/GroupContainer";
import dayjs from "dayjs";

type AttendanceEditorAdditionalBottomContentProps = {
  updatedAt?: string | null;
  enabledSendMail: boolean;
  onToggleSendMail: () => void;
};

export function AttendanceEditorAdditionalBottomContent({
  updatedAt,
  enabledSendMail,
  onToggleSendMail,
}: AttendanceEditorAdditionalBottomContentProps) {
  return (
    <GroupContainer hideAccent hideBorder>
      {updatedAt && (
        <div className="flex items-center">
          <div className="w-[150px] font-bold">最終更新日時</div>
          <div className="grow">
            <div className="pl-1 text-base text-slate-500">
              {dayjs(updatedAt).format("YYYY/MM/DD HH:mm:ss")}
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center">
          <div className="w-[150px] font-bold">メール設定</div>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={enabledSendMail}
              onChange={onToggleSendMail}
              className="h-4 w-4 accent-emerald-600"
            />
            <span>スタッフに変更通知メールを送信する</span>
          </div>
        </div>
      </div>
    </GroupContainer>
  );
}