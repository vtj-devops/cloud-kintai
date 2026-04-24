import { type ChangeEvent, type ReactNode, useEffect, useState } from "react";

import {
  DailyReportFormChangeHandler,
  DailyReportFormData,
} from "../model/types";

export type DailyReportFormFieldsProps = {
  form: DailyReportFormData;
  onChange: DailyReportFormChangeHandler;
};

type FieldProps = {
  label: string;
  children: ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-sm font-medium leading-6 text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function handleInputChange(
  onChange: DailyReportFormChangeHandler,
  field: keyof DailyReportFormData,
) {
  return (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    onChange(field, event.target.value);
  };
}

const INPUT_CLASS_NAME =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";
const CONTENT_PLACEHOLDER = "例) サマリ/実施タスク/課題などをまとめて記入";

export function DailyReportFormFields({
  form,
  onChange,
}: DailyReportFormFieldsProps) {
  const [isMobileContentExpanded, setIsMobileContentExpanded] = useState(false);
  const contentChangeHandler = handleInputChange(onChange, "content");

  useEffect(() => {
    if (!isMobileContentExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileContentExpanded]);

  return (
    <>
      <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-7">
        <div className="sm:col-span-2">
          <Field label="タイトル">
            <input
              type="text"
              value={form.title}
              onChange={handleInputChange(onChange, "title")}
              className={INPUT_CLASS_NAME}
              data-testid="daily-report-title-input"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <label className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium leading-6 text-slate-700">
                内容
              </span>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-slate-300 text-slate-700 sm:hidden"
                onClick={() => setIsMobileContentExpanded(true)}
                aria-label="全画面で入力"
                title="全画面で入力"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M4 10V4h6M20 10V4h-6M4 14v6h6M20 14v6h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <textarea
              value={form.content}
              onChange={contentChangeHandler}
              rows={6}
              placeholder={CONTENT_PLACEHOLDER}
              className={`${INPUT_CLASS_NAME} min-h-[10rem] resize-y`}
              data-testid="daily-report-content-input"
            />
          </label>
        </div>
      </div>

      {isMobileContentExpanded && (
        <div className="fixed inset-0 z-[80] bg-white p-4 sm:hidden">
          <div className="flex h-full flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="m-0 text-sm font-semibold text-slate-900">内容</p>
              <button
                type="button"
                className="inline-flex items-center rounded-sm border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                onClick={() => setIsMobileContentExpanded(false)}
              >
                閉じる
              </button>
            </div>
            <textarea
              value={form.content}
              onChange={contentChangeHandler}
              placeholder={CONTENT_PLACEHOLDER}
              autoFocus
              className={`${INPUT_CLASS_NAME} min-h-0 flex-1 resize-none`}
            />
          </div>
        </div>
      )}
    </>
  );
}
