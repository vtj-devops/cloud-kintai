import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Alert,
  Button,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  CreateAppConfigInput,
  UpdateAppConfigInput,
} from "@shared/api/graphql/types";
import { useContext, useEffect, useMemo, useState } from "react";

import { useAppDispatchV2 } from "@/app/hooks";
import { AppConfigContext } from "@/context/AppConfigContext";
import { AuthContext } from "@/context/AuthContext";
import {
  getDefaultWorkflowCategoryOrder,
  type WorkflowCategoryOrderItem,
} from "@/entities/workflow/lib/workflowLabels";
import useWorkflowTemplates from "@/entities/workflow-template/model/useWorkflowTemplates";
import {
  setSnackbarError,
  setSnackbarSuccess,
} from "@/shared/lib/store/snackbarSlice";
import { formatDateSlash } from "@/shared/lib/time";

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

export default function AdminWorkflowCategorySettings() {
  const WORKFLOW_TEMPLATE_ORGANIZATION_ID = "default";
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
  const [templateName, setTemplateName] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null,
  );
  const [templateSaving, setTemplateSaving] = useState(false);

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

  const handleToggleEnabled = (index: number) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const handleReset = () => {
    setItems(getDefaultWorkflowCategoryOrder());
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    const workflowCategoryOrder = {
      categories: resetDisplayOrder(items).map((item) => ({
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
      dispatch(setSnackbarSuccess("ワークフロー種別設定を保存しました。"));
    } catch (error) {
      console.error(error);
      dispatch(setSnackbarError("ワークフロー種別設定の保存に失敗しました。"));
    } finally {
      setSaving(false);
    }
  };

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateTitle("");
    setTemplateContent("");
    setEditingTemplateId(null);
  };

  const handleTemplateSubmit = async () => {
    const normalizedName = templateName.trim();
    const normalizedTitle = templateTitle.trim();
    const normalizedContent = templateContent.trim();

    if (!normalizedName || !normalizedTitle || !normalizedContent) {
      dispatch(
        setSnackbarError(
          "テンプレート名・タイトルテンプレート・詳細内容テンプレートを入力してください。",
        ),
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
        dispatch(setSnackbarSuccess("テンプレートを更新しました。"));
      } else {
        await createTemplate({
          name: normalizedName,
          title: normalizedTitle,
          content: normalizedContent,
        });
        dispatch(setSnackbarSuccess("テンプレートを作成しました。"));
      }
      resetTemplateForm();
    } catch (error) {
      console.error(error);
      dispatch(setSnackbarError("テンプレートの保存に失敗しました。"));
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
      dispatch(setSnackbarSuccess("テンプレートを削除しました。"));
    } catch (error) {
      console.error(error);
      dispatch(setSnackbarError("テンプレートの削除に失敗しました。"));
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.5}>
        <Typography variant="h6">ワークフロー種別</Typography>
        <Typography variant="body2" color="text.secondary">
          表示順序の変更と有効/無効の切り替えを行えます。
        </Typography>
      </Stack>

      <Alert severity="info">
        並び順は新規申請画面とワークフロー一覧の種別フィルタに反映されます。
      </Alert>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          {items.map((item, index) => (
            <Stack
              key={item.category}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ justifyContent: "space-between" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ width: 24 }}
                >
                  {index + 1}
                </Typography>
                <Typography variant="body1">{item.label}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                  size="small"
                  onClick={() =>
                    setItems((prev) => moveItem(prev, index, index - 1))
                  }
                  disabled={index === 0}
                  aria-label={`${item.label}を上へ移動`}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() =>
                    setItems((prev) => moveItem(prev, index, index + 1))
                  }
                  disabled={index === items.length - 1}
                  aria-label={`${item.label}を下へ移動`}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <FormControlLabel
                  control={
                    <Switch
                      checked={item.enabled}
                      onChange={() => handleToggleEnabled(index)}
                    />
                  }
                  label={item.enabled ? "有効" : "無効"}
                  sx={{ ml: 1 }}
                />
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Paper>

      <Stack
        direction="row"
        spacing={1}
        justifyContent="space-between"
        sx={{ pb: 4 }}
      >
        <Button
          variant="outlined"
          startIcon={<RestartAltIcon />}
          onClick={handleReset}
          disabled={saving}
        >
          デフォルトに戻す
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? "保存中..." : "保存"}
        </Button>
      </Stack>

      <Stack spacing={0.5}>
        <Typography variant="h6">ワークフローテンプレート</Typography>
        <Typography variant="body2" color="text.secondary">
          「その他」申請で利用するテンプレートを管理できます。新しいものが上に表示されます。
        </Typography>
      </Stack>

      <Alert severity="info">
        テンプレート適用時は、申請フォームの入力内容を上書きする確認が表示されます。
      </Alert>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">
            {editingTemplateId ? "テンプレート編集" : "テンプレート作成"}
          </Typography>
          <TextField
            label="テンプレート名"
            size="small"
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
          />
          <TextField
            label="タイトルテンプレート"
            size="small"
            value={templateTitle}
            onChange={(event) => setTemplateTitle(event.target.value)}
          />
          <TextField
            label="詳細内容テンプレート"
            size="small"
            multiline
            minRows={5}
            value={templateContent}
            onChange={(event) => setTemplateContent(event.target.value)}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {editingTemplateId && (
              <Button variant="outlined" onClick={resetTemplateForm}>
                キャンセル
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleTemplateSubmit}
              disabled={templateSaving}
            >
              {templateSaving
                ? "保存中..."
                : editingTemplateId
                  ? "更新"
                  : "作成"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1">テンプレート一覧</Typography>
          {templateError && <Alert severity="error">{templateError}</Alert>}
          {templateLoading ? (
            <Typography variant="body2" color="text.secondary">
              読み込み中...
            </Typography>
          ) : templates.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              テンプレートはまだありません。
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>テンプレート名</TableCell>
                  <TableCell>タイトルテンプレート</TableCell>
                  <TableCell>作成日</TableCell>
                  <TableCell align="right">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>{template.title}</TableCell>
                    <TableCell>{formatDateSlash(template.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleTemplateEdit(template.id)}
                        aria-label="テンプレートを編集"
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleTemplateDelete(template.id)}
                        aria-label="テンプレートを削除"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
