import "@/features/admin/staff/ui/styles.scss";

import { useAppDispatchV2 } from "@app/hooks";
import { AuthContext } from "@app/providers/auth/AuthContext";
import { isAttendanceManagementEnabled } from "@entities/staff/lib/attendanceManagement";
import { getWorkTypeLabel } from "@entities/staff/lib/workTypeOptions";
import {
  roleLabelMap,
  StaffRole,
  useStaffs,
} from "@entities/staff/model/useStaffs/useStaffs";
import {
  CreateStaffDialog,
  MoreActionButton,
  SyncCognitoUser,
} from "@features/admin/staff/ui/actions";
import { EditButton } from "@features/admin/staff/ui/EditButton";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import dayjs from "dayjs";
import { useContext, useMemo, useState } from "react";

import * as MESSAGE_CODE from "@/errors";

const STATUS_LABEL_MAP = new Map<string, string>([
  ["CONFIRMED", "確認済み"],
  ["FORCE_CHANGE_PASSWORD", "パスワード変更必要"],
]);
function getRoleLabel(role: StaffRole, owner?: boolean | null) {
  if (owner) {
    return roleLabelMap.get(StaffRole.OWNER) ?? "オーナー";
  }
  return roleLabelMap.get(role) ?? roleLabelMap.get(StaffRole.NONE) ?? "未設定";
}
export default function AdminStaff() {
  const dispatch = useAppDispatchV2();
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const {
    staffs,
    loading: staffLoading,
    error: staffError,
    refreshStaff,
    createStaff,
    updateStaff,
    deleteStaff,
  } = useStaffs({ isAuthenticated });
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredStaffs = useMemo(
    () =>
      staffs
        .filter((staff) => {
          if (!normalizedSearchQuery) {
            return true;
          }
          const familyName = staff.familyName ?? "";
          const givenName = staff.givenName ?? "";
          const fullName = `${familyName}${givenName}`.toLowerCase();
          const fullNameWithSpace = `${familyName} ${givenName}`.toLowerCase();
          const staffId = (staff.id ?? "").toLowerCase();
          const mailAddress = (staff.mailAddress ?? "").toLowerCase();
          return (
            fullName.includes(normalizedSearchQuery) ||
            fullNameWithSpace.includes(normalizedSearchQuery) ||
            staffId.includes(normalizedSearchQuery) ||
            mailAddress.includes(normalizedSearchQuery)
          );
        })
        .toSorted((a, b) => {
          const aSortKey = a.sortKey || "";
          const bSortKey = b.sortKey || "";
          return aSortKey.localeCompare(bSortKey);
        }),
    [normalizedSearchQuery, staffs],
  );
  const totalStaffCount = staffs.length;
  const enabledStaffCount = staffs.filter((staff) => staff.enabled).length;
  const passwordChangeRequiredCount = staffs.filter(
    (staff) => staff.status === "FORCE_CHANGE_PASSWORD",
  ).length;
  if (staffLoading) {
    return (
      <div className="w-full px-2 pt-2 sm:px-4 md:px-6">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-teal-500" />
        </div>
      </div>
    );
  }
  if (staffError) {
    dispatch(
      pushNotification({
        tone: "error",
        message: MESSAGE_CODE.E00001,
      }),
    );
    return null;
  }
  return (
    <div className="h-full w-full px-2 pb-3 pt-2 sm:px-4 md:px-6">
      <div className="space-y-2.5">
        <section className="admin-staff-hero">
          <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:justify-end sm:items-center">
            <CreateStaffDialog
              staffs={staffs}
              refreshStaff={refreshStaff}
              createStaff={createStaff}
              updateStaff={updateStaff}
            />
            <SyncCognitoUser
              staffs={staffs}
              refreshStaff={refreshStaff}
              createStaff={createStaff}
              updateStaff={updateStaff}
            />
          </div>
        </section>

        <section className="flex flex-col gap-1 md:flex-row">
          <div className="admin-staff-stat-card">
            <p className="admin-staff-stat-label text-xs leading-tight">
              登録スタッフ
            </p>
            <p className="admin-staff-stat-value text-2xl leading-none">
              {totalStaffCount}
            </p>
          </div>
          <div className="admin-staff-stat-card">
            <p className="admin-staff-stat-label text-xs leading-tight">
              有効アカウント
            </p>
            <p className="admin-staff-stat-value text-2xl leading-none">
              {enabledStaffCount}
            </p>
          </div>
          <div className="admin-staff-stat-card">
            <p className="admin-staff-stat-label text-xs leading-tight">
              パスワード変更待ち
            </p>
            <p className="admin-staff-stat-value warning text-2xl leading-none">
              {passwordChangeRequiredCount}
            </p>
          </div>
        </section>

        <section className="admin-staff-toolbar">
          <div className="w-full space-y-1.5">
            <p className="text-sm text-slate-600">
              まれにユーザー情報が同期されない場合があります。必要に応じて「ユーザー同期」を実行してください。
            </p>
            <label className="relative block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg
                  className="h-4 w-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="スタッフ名・スタッフID・メールで検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <p className="admin-staff-filter-result text-xs">
              表示件数: {filteredStaffs.length} / {totalStaffCount}
            </p>
          </div>
        </section>

        <section className="admin-staff-table-container overflow-auto">
          <table className="min-w-[1180px] text-sm">
            <thead>
              <tr className="admin-staff-table-header-row">
                <th className="admin-staff-table-header px-4 py-2 text-left" />
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  アカウント状態
                </th>
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  ステータス
                </th>
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  名前
                </th>
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  メールアドレス
                </th>
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  権限
                </th>
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  勤怠管理
                </th>
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  勤務形態
                </th>
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  汎用コード
                </th>
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  作成日時
                </th>
                <th className="admin-staff-table-header px-4 py-2 text-left">
                  更新日時
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStaffs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="admin-staff-empty">
                    条件に一致するスタッフが見つかりません。
                  </td>
                </tr>
              ) : (
                filteredStaffs.map((staff) => {
                  const fullName =
                    `${staff.familyName ?? ""} ${staff.givenName ?? ""}`.trim();
                  const accountStatusLabel = staff.enabled ? "有効" : "無効";
                  const statusLabel =
                    STATUS_LABEL_MAP.get(staff.status) ?? "***";
                  const roleLabel = getRoleLabel(staff.role, staff.owner);
                  const attendanceManaged =
                    isAttendanceManagementEnabled(staff);
                  const workTypeLabel = getWorkTypeLabel(
                    (staff as unknown as Record<string, unknown>).workType as
                      | string
                      | null,
                  );
                  return (
                    <tr key={staff.id} className="admin-staff-table-row">
                      <td className="admin-staff-action-cell whitespace-nowrap px-3 py-1.5">
                        <div className="flex items-center gap-0.5">
                          <EditButton staff={staff} />
                          <MoreActionButton
                            staff={staff}
                            updateStaff={updateStaff}
                            deleteStaff={deleteStaff}
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            staff.enabled
                              ? "border-teal-200 bg-teal-50 text-teal-700"
                              : "border-slate-300 bg-white text-slate-600"
                          }`}
                        >
                          {accountStatusLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            staff.status === "CONFIRMED"
                              ? "border-teal-200 bg-teal-50 text-teal-700"
                              : "border-amber-300 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <p className="admin-staff-name text-sm">
                          {fullName || "(未設定)"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {staff.mailAddress}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <span className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700">
                          {roleLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            attendanceManaged
                              ? "border-teal-200 bg-teal-50 text-teal-700"
                              : "border-slate-300 bg-white text-slate-600"
                          }`}
                        >
                          {attendanceManaged ? "対象" : "対象外"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {workTypeLabel}
                      </td>
                      <td className="admin-staff-sort-key whitespace-nowrap px-4 py-2">
                        {staff.sortKey || ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {dayjs(staff.createdAt).format("YYYY/MM/DD HH:mm")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {dayjs(staff.updatedAt).format("YYYY/MM/DD HH:mm")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
