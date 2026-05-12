import { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import { useWorkflowDetailContext } from "@features/workflow/detail-panel/model/WorkflowDetailContext";
import { PANEL_HEIGHTS } from "@shared/config/uiDimensions";
import { AppButton } from "@shared/ui/button";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { shouldTruncateWorkflowMessage } from "../model/workflowCommentUtils";
import type { WorkflowCommentMessage } from "../types";

type Props = {
  messages: WorkflowCommentMessage[];
  staffs: StaffType[];
  currentStaff?: StaffType;
  expandedMessages: Record<string, boolean>;
  onToggle: (id: string) => void;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  formatSender: (sender?: string) => string;
};

const INITIAL_VISIBLE_COUNT = 30;
const LOAD_MORE_COUNT = 20;
const TOP_THRESHOLD_PX = 32;
const BOTTOM_STICK_THRESHOLD_PX = 64;

const MOBILE_BREAKPOINT_QUERY = "(max-width: 640px)";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return false;
    }
    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  });

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
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

export function WorkflowCommentThreadView({
  messages,
  staffs,
  currentStaff,
  expandedMessages,
  onToggle,
  input,
  setInput,
  onSend,
  sending,
  formatSender,
}: Props) {
  const isMobile = useIsMobile();
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const prependAnchorHeightRef = useRef<number | null>(null);

  const visibleMessages = useMemo(() => {
    const start = Math.max(messages.length - visibleCount, 0);
    return messages.slice(start);
  }, [messages, visibleCount]);

  const hasOlderMessages = visibleMessages.length < messages.length;

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (prependAnchorHeightRef.current !== null) {
      const heightDiff =
        container.scrollHeight - prependAnchorHeightRef.current;
      container.scrollTop += heightDiff;
      prependAnchorHeightRef.current = null;
      return;
    }

    if (stickToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [visibleMessages]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    stickToBottomRef.current = distanceFromBottom <= BOTTOM_STICK_THRESHOLD_PX;

    if (
      container.scrollTop <= TOP_THRESHOLD_PX &&
      hasOlderMessages &&
      prependAnchorHeightRef.current === null
    ) {
      prependAnchorHeightRef.current = container.scrollHeight;
      setVisibleCount((prev) =>
        Math.min(prev + LOAD_MORE_COUNT, messages.length),
      );
    }
  };

  const sendDisabled = sending || !input.trim();

  return (
    <div className="min-w-0">
      <p className="mb-2 text-sm text-slate-500">
        申請に関するやり取りをこの場で記録します。
      </p>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-w-0 overflow-auto rounded-[20px] border border-slate-300/30 bg-slate-50 p-5"
        style={{
          maxHeight: isMobile ? 360 : PANEL_HEIGHTS.SCROLLABLE_MAX,
        }}
      >
        <div className="flex flex-col gap-4">
          {visibleMessages.map((message) => {
            const displayName = formatSender(message.sender);
            const staff = message.staffId
              ? staffs.find((item) => item.id === message.staffId)
              : undefined;

            const avatarText = staff
              ? `${(staff.familyName || "").slice(0, 1)}${(
                  staff.givenName || ""
                ).slice(0, 1)}` || displayName.slice(0, 1)
              : displayName.slice(0, 1);

            const isSystem = message.staffId === "system";
            const isMine = Boolean(
              currentStaff && message.staffId === currentStaff.id,
            );
            const expanded = Boolean(expandedMessages[message.id]);
            const isTruncated = shouldTruncateWorkflowMessage(
              message.text,
              expanded,
            );

            const avatarBackgroundClass = isSystem
              ? "bg-slate-500"
              : isMine
                ? "bg-emerald-600"
                : "bg-emerald-900";

            return (
              <div
                key={message.id}
                className={[
                  "flex min-w-0 flex-col",
                  isMine ? "items-end" : "items-start",
                ].join(" ")}
              >
                <div
                  className={[
                    "mb-1 flex w-full min-w-0 items-center gap-3",
                    isMine ? "flex-row-reverse justify-end" : "justify-start",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white",
                      avatarBackgroundClass,
                    ].join(" ")}
                  >
                    {avatarText}
                  </div>

                  <div
                    className={[
                      "flex min-w-0 gap-1",
                      isMine
                        ? "flex-col items-end sm:flex-row-reverse sm:items-center"
                        : "flex-col items-start sm:flex-row sm:items-center",
                    ].join(" ")}
                  >
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {displayName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {message.time}
                    </span>
                  </div>
                </div>

                <div
                  className={[
                    "min-w-0 max-w-full rounded-xl border px-4 py-3 text-sm leading-6 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.28)] sm:max-w-[90%]",
                    isMine
                      ? "border-emerald-800/30 bg-emerald-500 text-white"
                      : "border-slate-300/60 bg-white text-slate-900",
                  ].join(" ")}
                >
                  <div
                    className="whitespace-pre-wrap break-words"
                    style={
                      isTruncated
                        ? {
                            display: "-webkit-box",
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }
                        : undefined
                    }
                  >
                    {message.text}
                  </div>

                  {isTruncated && (
                    <button
                      type="button"
                      onClick={() => onToggle(message.id)}
                      className={[
                        "mt-1 text-xs font-medium underline decoration-transparent transition hover:decoration-current",
                        isMine ? "text-white" : "text-emerald-700",
                      ].join(" ")}
                    >
                      {expanded ? "折りたたむ" : "もっと見る"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                onSend();
              }
            }}
            disabled={sending}
            rows={2}
            placeholder="メッセージを入力..."
            className="w-full resize-y rounded-[18px] border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <p className="ml-1 mt-1 text-xs text-slate-500">
            Cmd/Ctrl+Enterで送信
          </p>
        </div>

        <AppButton
          onClick={onSend}
          disabled={sendDisabled}
          size="sm"
          className="w-full shrink-0 sm:w-auto"
        >
          送信
        </AppButton>
      </div>
    </div>
  );
}

export default function WorkflowCommentThread() {
  const {
    workflow,
    staffs,
    currentStaff,
    messages,
    expandedMessages,
    toggleExpanded,
    input,
    setInput,
    sending,
    formatSender,
    sendMessage,
  } = useWorkflowDetailContext();

  return (
    <WorkflowCommentThreadView
      key={workflow?.id ?? "workflow-comment-thread"}
      messages={messages}
      staffs={staffs}
      currentStaff={currentStaff}
      expandedMessages={expandedMessages}
      onToggle={toggleExpanded}
      input={input}
      setInput={setInput}
      onSend={sendMessage}
      sending={sending}
      formatSender={formatSender}
    />
  );
}
