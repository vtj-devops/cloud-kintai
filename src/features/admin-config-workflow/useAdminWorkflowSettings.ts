import { useAppDispatchV2 } from "@app/hooks";
import { AuthContext } from "@app/providers/auth/AuthContext";
import { AppConfigContext } from "@entities/app-config/model/AppConfigContext";
import {
  getDefaultWorkflowCategoryOrder,
  type WorkflowCategoryOrderItem,
} from "@entities/workflow/lib/workflowLabels";
import useWorkflowTemplates from "@entities/workflow-template/model/useWorkflowTemplates";
import {
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import { pushNotification } from "@shared/lib/store/notificationSlice";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";

const WORKFLOW_TEMPLATE_ORGANIZATION_ID = "default";
const CATEGORY_AUTO_SAVE_DELAY = 600;

const resetDisplayOrder = (
  items: WorkflowCategoryOrderItem[],
): WorkflowCategoryOrderItem[] =>
  items.map((item, index) => ({
    ...item,
    displayOrder: index,
  }));

const moveItem = (
  items: WorkflowCategoryOrderItem[],
  from: number,
  to: number,
): WorkflowCategoryOrderItem[] => {
  if (to < 0 || to >= items.length) {
    return items;
  }

  const moved = items[from];
  if (!moved) {
    return items;
  }

  const withoutMoved = items.toSpliced(from, 1);
  const next = withoutMoved.toSpliced(to, 0, moved);
  return resetDisplayOrder(next);
};

export function useAdminWorkflowSettings() {
  const dispatch = useAppDispatchV2();
  const { authStatus } = useContext(AuthContext);
  const isAuthenticated = authStatus === "authenticated";
  const { getWorkflowCategoryOrder, getConfigId, saveConfig, fetchConfig } =
    useContext(AppConfigContext);
  const {
    templates,
    loading: templateLoading,
    error: templateError,
    createTemplate,
    updateTemplate,
    removeTemplate,
  } = useWorkflowTemplates({
    isAuthenticated,
    organizationId: WORKFLOW_TEMPLATE_ORGANIZATION_ID,
  });

  const [configId, setConfigId] = useState<string | null>(null);
  const [items, setItems] = useState<WorkflowCategoryOrderItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [categorySaveToken, setCategorySaveToken] = useState(0);
  const [templateName, setTemplateName] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [templateSaving, setTemplateSaving] = useState(false);
  const [initialTemplateName, setInitialTemplateName] = useState("");
  const [initialTemplateTitle, setInitialTemplateTitle] = useState("");
  const [initialTemplateContent, setInitialTemplateContent] = useState("");

  useEffect(() => {
    setItems(getWorkflowCategoryOrder());
    setConfigId(getConfigId());
  }, [getConfigId, getWorkflowCategoryOrder]);

  const hasChanges = useMemo(() => {
    const current = JSON.stringify(resetDisplayOrder(items));
    const original = JSON.stringify(
      resetDisplayOrder(getWorkflowCategoryOrder()),
    );
    return current !== original;
  }, [getWorkflowCategoryOrder, items]);

  const hasTemplateChanges =
    templateName !== initialTemplateName ||
    templateTitle !== initialTemplateTitle ||
    templateContent !== initialTemplateContent;

  const persistWorkflowCategoryOrder = useCallback(
    async (nextItems: WorkflowCategoryOrderItem[]) => {
      setSaving(true);

      const workflowCategoryOrder = {
        categories: resetDisplayOrder(nextItems).map((item) => ({
          category: item.category,
          label: item.label,
          displayOrder: item.displayOrder,
          enabled: item.enabled,
        })),
      };

      try {
        if (configId) {
          await saveConfig({
            id: configId,
            workflowCategoryOrder,
          } as UpdateAppConfigInput);
        } else {
          await saveConfig({
            name: "default",
            workflowCategoryOrder,
          } as CreateAppConfigInput);
        }

        await fetchConfig();
        setConfigId(getConfigId());
      } catch (error) {
        console.error(error);
        dispatch(
          pushNotification({
            tone: "error",
            message: "ワークフロー種別設定の保存に失敗しました。",
          }),
        );
      } finally {
        setSaving(false);
      }
    },
    [configId, dispatch, fetchConfig, getConfigId, saveConfig],
  );

  useEffect(() => {
    if (categorySaveToken === 0 || !hasChanges) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistWorkflowCategoryOrder(items);
    }, CATEGORY_AUTO_SAVE_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, [categorySaveToken, hasChanges, items, persistWorkflowCategoryOrder]);

  const handleToggleEnabled = (index: number) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, enabled: !item.enabled } : item,
      ),
    );
    setCategorySaveToken((prev) => prev + 1);
  };

  const handleMoveItem = (from: number, to: number) => {
    setItems((prev) => moveItem(prev, from, to));
    setCategorySaveToken((prev) => prev + 1);
  };

  const handleReset = () => {
    setItems(getDefaultWorkflowCategoryOrder());
    setCategorySaveToken((prev) => prev + 1);
  };

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateTitle("");
    setTemplateContent("");
    setEditingTemplateId(null);
    setInitialTemplateName("");
    setInitialTemplateTitle("");
    setInitialTemplateContent("");
  };

  const handleTemplateSubmit = async () => {
    const normalizedName = templateName.trim();
    const normalizedTitle = templateTitle.trim();
    const normalizedContent = templateContent.trim();

    if (!normalizedName || !normalizedTitle || !normalizedContent) {
      dispatch(
        pushNotification({
          tone: "error",
          message:
            "テンプレート名・タイトルテンプレート・詳細内容テンプレートを入力してください。",
        }),
      );
      return;
    }

    if (templateSaving) {
      return;
    }

    setTemplateSaving(true);
    try {
      if (editingTemplateId) {
        await updateTemplate({
          id: editingTemplateId,
          name: normalizedName,
          title: normalizedTitle,
          content: normalizedContent,
        });
        dispatch(
          pushNotification({
            tone: "success",
            message: "テンプレートを更新しました。",
          }),
        );
      } else {
        await createTemplate({
          name: normalizedName,
          title: normalizedTitle,
          content: normalizedContent,
        });
        dispatch(
          pushNotification({
            tone: "success",
            message: "テンプレートを作成しました。",
          }),
        );
      }

      resetTemplateForm();
    } catch (error) {
      console.error(error);
      dispatch(
        pushNotification({
          tone: "error",
          message: "テンプレートの保存に失敗しました。",
        }),
      );
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleTemplateEdit = (templateId: string) => {
    const target = templates.find((template) => template.id === templateId);
    if (!target) {
      return;
    }

    setEditingTemplateId(target.id);
    setTemplateName(target.name);
    setTemplateTitle(target.title);
    setTemplateContent(target.content);
    setInitialTemplateName(target.name);
    setInitialTemplateTitle(target.title);
    setInitialTemplateContent(target.content);
  };

  const handleTemplateDelete = async (templateId: string) => {
    const target = templates.find((template) => template.id === templateId);
    if (!target) {
      return;
    }

    const confirmed = window.confirm(
      `テンプレート「${target.name}」を削除します。よろしいですか？`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await removeTemplate(templateId);
      if (editingTemplateId === templateId) {
        resetTemplateForm();
      }
      dispatch(
        pushNotification({
          tone: "success",
          message: "テンプレートを削除しました。",
        }),
      );
    } catch (error) {
      console.error(error);
      dispatch(
        pushNotification({
          tone: "error",
          message: "テンプレートの削除に失敗しました。",
        }),
      );
    }
  };

  return {
    items,
    saving,
    hasChanges,
    templates,
    templateLoading,
    templateError,
    templateName,
    setTemplateName,
    templateTitle,
    setTemplateTitle,
    templateContent,
    setTemplateContent,
    editingTemplateId,
    templateSaving,
    hasTemplateChanges,
    isDirty: hasChanges || hasTemplateChanges,
    isBusy: saving || templateSaving,
    handleToggleEnabled,
    handleMoveItem,
    handleReset,
    resetTemplateForm,
    handleTemplateSubmit,
    handleTemplateEdit,
    handleTemplateDelete,
  };
}
