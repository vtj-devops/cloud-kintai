import {
  DailyReportFormChangeHandler,
  DailyReportFormFields,
} from "@features/attendance/daily-report";
import { SubsectionTitle } from "@shared/ui/typography";
import { type FormEvent } from "react";

import { buildSavedAtLabel } from "../dailyReportHelpers";
import type { DailyReportForm } from "../dailyReportTypes";
import {
  ActionButton,
  AlertBox,
  DividerLine,
  VStack,
} from "./DailyReportLayoutParts";

interface CreateReportSectionProps {
  createForm: DailyReportForm;
  createFormLastSavedAt: string | null;
  canSubmit: boolean;
  isSubmitting: boolean;
  onChange: DailyReportFormChangeHandler;
  onClear: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function CreateReportSection({
  createForm,
  createFormLastSavedAt,
  canSubmit,
  isSubmitting,
  onChange,
  onClear,
  onSaveDraft,
  onSubmit,
}: CreateReportSectionProps) {
  const handlePreventSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };
  const createFormLastSavedAtLabel = buildSavedAtLabel(createFormLastSavedAt);

  return (
    <VStack className="dr-gap-6">
      <div>
        <p className="daily-report-summary-lead">新しい日報を登録</p>
        <SubsectionTitle className="dr-section-heading">日報作成フォーム</SubsectionTitle>
      </div>
      <AlertBox tone="warning">
        この日報はまだ提出されていません。下書き保存後、必ず「提出する」ボタンをクリックしてください。
      </AlertBox>
      <DividerLine />
      <form onSubmit={handlePreventSubmit}>
        <VStack>
          <DailyReportFormFields form={createForm} onChange={onChange} />
          {createFormLastSavedAt && (
            <p className="dr-saved-at">
              最終保存: {createFormLastSavedAtLabel}
            </p>
          )}
          <div className="dr-form-actions">
            <ActionButton tone="ghost" onClick={onClear}>
              クリア
            </ActionButton>
            <ActionButton
              tone="secondary"
              disabled={!canSubmit || isSubmitting}
              onClick={onSaveDraft}
            >
              下書き保存
            </ActionButton>
            <ActionButton
              tone="primary"
              disabled={!canSubmit || isSubmitting}
              onClick={onSubmit}
              data-testid="daily-report-submit-button"
            >
              提出する
            </ActionButton>
          </div>
        </VStack>
      </form>
    </VStack>
  );
}
