import { AttendanceChangeRequest } from "@shared/api/graphql/types";

export default function ChangeRequestingAlert({
  changeRequests,
}: {
  changeRequests: AttendanceChangeRequest[];
}) {
  if (changeRequests.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[18px] border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
      変更リクエスト申請中です。承認されるまで新しい申請はできません。
    </div>
  );
}
