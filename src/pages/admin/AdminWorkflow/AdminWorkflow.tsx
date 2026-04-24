import { AuthContext } from "@app/providers/auth/AuthContext";
import useAppConfig from "@entities/app-config/model/useAppConfig";
import { useStaffs } from "@entities/staff/model/useStaffs/useStaffs";
import {
  CATEGORY_LABELS,
  getWorkflowCategoryLabel,
  STATUS_LABELS,
} from "@entities/workflow/lib/workflowLabels";
import useWorkflows from "@entities/workflow/model/useWorkflows";
import SettingsIcon from "@features/admin/layout/ui/SettingsIcon";
import AdminWorkflowSettingsDialog from "@features/admin-config-workflow/AdminWorkflowSettingsDialog";
import { useSplitView } from "@features/splitView";
import { WorkflowCategory, WorkflowStatus } from "@shared/api/graphql/types";
import StatusChip from "@shared/ui/chips/StatusChip";
import { SubsectionTitle } from "@shared/ui/typography";
import {
  ComponentType,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import WorkflowCarouselDialog from "./components/WorkflowCarouselDialog";
import WorkflowDetailPanel from "./components/WorkflowDetailPanel";

const STATUS_EXCLUDED_FROM_DEFAULT: WorkflowStatus[] = [
  WorkflowStatus.CANCELLED,
  WorkflowStatus.APPROVED,
];

const MOBILE_BREAKPOINT_QUERY = "(max-width: 640px)";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return isMobile;
};

function OpenInPanelIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
      <path
        d="M7 5h8v8m0-8-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 11v4H5V7h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AdminWorkflow() {
  const isMobile = useIsMobile();
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { workflows, loading, error } = useWorkflows({
    isAuthenticated,
  });
  const { config, getAbsentEnabled, getWorkflowCategoryOrder } = useAppConfig();
  const {
    staffs,
    loading: staffLoading,
    error: staffError,
  } = useStaffs({ isAuthenticated });
  const { enableSplitMode, setRightPanel } = useSplitView();
  const navigate = useNavigate();

  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilterOverride, setStatusFilterOverride] = useState<
    WorkflowStatus[] | null
  >(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null,
  );

  const categories = useMemo(
    () =>
      getWorkflowCategoryOrder()
        .filter((item) => item.enabled)
        .filter(
          (item) =>
            item.category !== WorkflowCategory.ABSENCE || getAbsentEnabled(),
        ),
    [config, getAbsentEnabled, getWorkflowCategoryOrder],
  );

  const statuses = Array.from(
    new Set((workflows || []).map((workflow) => workflow.status).filter(Boolean)),
  ) as WorkflowStatus[];

  const defaultStatusFilter = useMemo(
    () =>
      statuses.filter(
      (status) => !STATUS_EXCLUDED_FROM_DEFAULT.includes(status),
      ),
    [statuses],
  );
  const statusFilter = statusFilterOverride ?? defaultStatusFilter;

  const filteredWorkflows = (workflows || []).filter((workflow) => {
    if (categoryFilter && workflow.category !== categoryFilter) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(workflow.status)) {
      return false;
    }
    return true;
  });

  const sortedWorkflows = filteredWorkflows.toSorted((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const workflowsById = new Map(
    sortedWorkflows.map((workflow) => [workflow.id, workflow]),
  );

  const staffNamesById = useMemo(
    () =>
      new Map(
        staffs.map((staff) => [
          staff.id,
          `${staff.familyName || ""}${staff.givenName || ""}` || "不明",
        ]),
      ),
    [staffs],
  );

  const filteredWorkflowIds = sortedWorkflows.map((workflow) => workflow.id);

  const rowsPerPageOptions = isMobile ? [10] : [10, 25, 50];
  const activeRowsPerPage = rowsPerPageOptions.includes(rowsPerPage)
    ? rowsPerPage
    : rowsPerPageOptions[0];
  const totalPages = Math.max(
    1,
    Math.ceil(sortedWorkflows.length / activeRowsPerPage),
  );
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedWorkflows = sortedWorkflows.slice(
    currentPage * activeRowsPerPage,
    currentPage * activeRowsPerPage + activeRowsPerPage,
  );

  const createWorkflowPanelComponent = useCallback(
    (workflowId: string): ComponentType<{ panelId: string }> => {
      const WorkflowPanel = () => <WorkflowDetailPanel workflowId={workflowId} />;
      WorkflowPanel.displayName = `WorkflowPanel_${workflowId}`;
      return WorkflowPanel;
    },
    [],
  );

  const handleOpenInRightPanel = (workflowId: string) => {
    const workflow = workflowsById.get(workflowId);
    enableSplitMode();
    setRightPanel({
      id: `workflow-${workflowId}`,
      title: `申請内容 - ${workflow?.createdAt?.split("T")[0] ?? workflowId}`,
      component: createWorkflowPanelComponent(workflowId),
    });
  };

  const handleOpenCarousel = () => {
    if (filteredWorkflowIds.length === 0) return;
    setSelectedWorkflowId(filteredWorkflowIds[0]);
    setIsCarouselOpen(true);
  };

  const toggleStatusFilter = (status: WorkflowStatus) => {
    setStatusFilterOverride((current) => {
      const base = current ?? defaultStatusFilter;
      if (base.includes(status)) {
        return base.filter((item) => item !== status);
      }
      return [...base, status];
    });
    setPage(0);
  };

  if (loading || staffLoading) {
    return (
      <div className="w-full">
        <div className="h-1 w-full overflow-hidden bg-slate-200">
          <div className="h-full w-1/3 animate-pulse bg-emerald-600" />
        </div>
      </div>
    );
  }

  if (error || staffError) {
    return (
      <p className="px-4 py-6 text-sm text-rose-700">
        データ取得中に問題が発生しました。管理者に連絡してください。
      </p>
    );
  }

  return (
    <div className="h-full w-full px-3 pt-2 sm:px-4 lg:px-6">
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.38)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-2xl">
                ワークフロー管理
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                申請一覧の確認と承認対応を行う画面です。申請カテゴリやテンプレートの設定は、右上の設定ボタンからまとめて見直せます。
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsDialogOpen(true)}
              className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
              aria-label="ワークフロー設定を開く"
            >
              <SettingsIcon name="settings" className="text-current" />
              <span>設定</span>
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex min-w-0 flex-col gap-1 text-sm text-slate-600">
            <span className="font-medium">種別</span>
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setPage(0);
              }}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">すべて</option>
              {categories.map((category) => (
                <option key={category.category} value={category.category}>
                  {CATEGORY_LABELS[category.category] || category.label}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2 lg:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-600">
              ステータス
            </span>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={statusFilter.length === 0}
                  onChange={() => {
                    setStatusFilterOverride([]);
                    setPage(0);
                  }}
                  className="h-3.5 w-3.5 accent-emerald-600"
                />
                すべて
              </label>

              {statuses.map((status) => (
                <label
                  key={status}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={statusFilter.includes(status)}
                    onChange={() => toggleStatusFilter(status)}
                    className="h-3.5 w-3.5 accent-emerald-600"
                  />
                  {STATUS_LABELS[status] || status}
                </label>
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">{filteredWorkflows.length} 件の申請</p>
            <button
              type="button"
              onClick={handleOpenCarousel}
              disabled={filteredWorkflowIds.length === 0}
              className="inline-flex h-10 items-center justify-center rounded-md border border-emerald-700/60 bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600"
            >
              まとめて確認
            </button>
          </div>

          {paginatedWorkflows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              条件に一致する申請はありません。
            </p>
          ) : isMobile ? (
            <div className="space-y-2">
              {paginatedWorkflows.map((workflow) => {
                const staff = staffs.find((item) => item.id === workflow.staffId);
                const staffName = staff
                  ? `${staff.familyName || ""}${staff.givenName || ""}`
                  : workflow.staffId || "不明";
                const categoryLabel = getWorkflowCategoryLabel(workflow);

                return (
                  <article
                    key={workflow.id}
                    onClick={() => navigate(`/admin/workflow/${workflow.id}`)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 transition hover:border-emerald-400 hover:shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <SubsectionTitle className="m-0 text-sm font-semibold text-slate-900">
                        {categoryLabel}
                      </SubsectionTitle>
                      <button
                        type="button"
                        title="右側で開く"
                        aria-label="右側で開く"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenInRightPanel(workflow.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700"
                      >
                        <OpenInPanelIcon />
                      </button>
                    </div>

                    <p className="mb-2 text-sm text-slate-800">{staffName}</p>

                    <div className="flex items-center justify-between gap-2">
                      <StatusChip status={workflow.status} />
                      <span className="text-xs text-slate-500">
                        {workflow.createdAt ? workflow.createdAt.split("T")[0] : ""}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="w-12 px-2 py-2" />
                    <th className="px-2 py-2 font-medium">種別</th>
                    <th className="px-2 py-2 font-medium">申請者</th>
                    <th className="px-2 py-2 font-medium">ステータス</th>
                    <th className="px-2 py-2 font-medium">作成日</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWorkflows.map((workflow) => {
                    const staff = staffs.find((item) => item.id === workflow.staffId);
                    const staffName = staff
                      ? `${staff.familyName || ""}${staff.givenName || ""}`
                      : workflow.staffId || "不明";
                    const categoryLabel = getWorkflowCategoryLabel(workflow);

                    return (
                      <tr
                        key={workflow.id}
                        onClick={() => navigate(`/admin/workflow/${workflow.id}`)}
                        className="cursor-pointer border-b border-slate-100 transition hover:bg-emerald-50/60"
                      >
                        <td
                          className="px-2 py-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            title="右側で開く"
                            aria-label="右側で開く"
                            onClick={() => handleOpenInRightPanel(workflow.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700"
                          >
                            <OpenInPanelIcon />
                          </button>
                        </td>
                        <td className="px-2 py-2 text-slate-900">{categoryLabel}</td>
                        <td className="px-2 py-2 text-slate-900">{staffName}</td>
                        <td className="px-2 py-2">
                          <StatusChip status={workflow.status} />
                        </td>
                        <td className="px-2 py-2 text-slate-600">
                          {workflow.createdAt ? workflow.createdAt.split("T")[0] : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0">
              ページ {currentPage + 1} / {totalPages}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2">
                <span>表示件数</span>
                <select
                  value={activeRowsPerPage}
                  onChange={(event) => {
                    setRowsPerPage(Number(event.target.value));
                    setPage(0);
                  }}
                  className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                >
                  {rowsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage <= 0}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-3 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                前へ
              </button>

              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-3 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                次へ
              </button>
            </div>
          </div>
        </section>

        {isCarouselOpen && selectedWorkflowId && (
          <WorkflowCarouselDialog
            key={selectedWorkflowId}
            open={isCarouselOpen}
            onClose={() => {
              setIsCarouselOpen(false);
              setSelectedWorkflowId(null);
            }}
            selectedWorkflowId={selectedWorkflowId}
            filteredWorkflowIds={filteredWorkflowIds}
            workflowsById={workflowsById}
            staffNamesById={staffNamesById}
            onOpenInRightPanel={(workflowId) => {
              handleOpenInRightPanel(workflowId);
              setIsCarouselOpen(false);
              setSelectedWorkflowId(null);
            }}
            enableApprovalActions
          />
        )}

        {isSettingsDialogOpen && (
          <AdminWorkflowSettingsDialog
            open={isSettingsDialogOpen}
            onClose={() => setIsSettingsDialogOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
