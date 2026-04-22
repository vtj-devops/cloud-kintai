import type { CognitoUser } from "@entities/staff/model/useCognitoUser";
import type { StaffType } from "@entities/staff/model/useStaffs/useStaffs";
import type {
  GetWorkflowQuery,
  WorkflowComment,
  WorkflowCommentInput,
} from "@shared/api/graphql/types";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { WorkflowCommentMessage } from "../types";
import { submitWorkflowComment } from "./submitWorkflowComment";
import {
  commentsToWorkflowMessages,
  formatWorkflowCommentSender,
} from "./workflowCommentUtils";

type UseWorkflowCommentThreadParams = {
  workflow: NonNullable<GetWorkflowQuery["getWorkflow"]> | null;
  staffs: StaffType[];
  cognitoUser?: CognitoUser | null;
  onWorkflowChange: (
    workflow: NonNullable<GetWorkflowQuery["getWorkflow"]>,
  ) => void;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
};

type UseWorkflowCommentThreadResult = {
  currentStaff?: StaffType;
  messages: WorkflowCommentMessage[];
  expandedMessages: Record<string, boolean>;
  toggleExpanded: (id: string) => void;
  input: string;
  setInput: (value: string) => void;
  sending: boolean;
  formatSender: (sender?: string) => string;
  sendMessage: () => void;
};

const useWorkflowCommentThread = ({
  workflow,
  staffs,
  cognitoUser,
  onWorkflowChange,
  notifySuccess,
  notifyError,
}: UseWorkflowCommentThreadParams): UseWorkflowCommentThreadResult => {
  const [messages, setMessages] = useState<WorkflowCommentMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<
    Record<string, boolean>
  >({});

  const currentStaff = useMemo(() => {
    if (!cognitoUser?.id) return undefined;
    return staffs.find((s) => s.cognitoUserId === cognitoUser.id);
  }, [cognitoUser, staffs]);

  const formatSender = useCallback(formatWorkflowCommentSender, []);

  const mapCommentsToMessages = useCallback(
    (comments?: Array<WorkflowComment | null> | null) =>
      commentsToWorkflowMessages(comments, staffs),
    [staffs],
  );

  useEffect(() => {
    setMessages(mapCommentsToMessages(workflow?.comments || []));
  }, [workflow, mapCommentsToMessages]);

  useEffect(() => {
    setExpandedMessages({});
  }, [workflow?.id]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const sendMessage = useCallback(() => {
    void (async () => {
      if (sending) return;
      if (!input.trim()) return;
      if (!workflow?.id) return;

      const senderStaff = currentStaff;
      const senderDisplay = senderStaff
        ? `${senderStaff.familyName} ${senderStaff.givenName}`
        : cognitoUser
          ? `${cognitoUser.familyName ?? ""} ${
              cognitoUser.givenName ?? ""
            }`.trim() || "不明なユーザー"
          : "不明なユーザー";

      const newComment: WorkflowCommentInput = {
        id: `c-${Date.now()}`,
        staffId: senderStaff?.id ?? cognitoUser?.id ?? "system",
        text: input.trim(),
        createdAt: new Date().toISOString(),
      };

      const optimisticMsg: WorkflowCommentMessage = {
        id: newComment.id,
        sender: senderDisplay,
        staffId: newComment.staffId,
        text: newComment.text,
        time: new Date(newComment.createdAt).toLocaleString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInput("");
      setSending(true);
      try {
        const updated = await submitWorkflowComment({
          workflowId: workflow.id,
          newComment,
          actorStaffId: senderStaff?.id ?? "system",
          actorDisplayName: senderDisplay,
          staffs,
        });
        onWorkflowChange(updated);
        setMessages(mapCommentsToMessages(updated.comments || []));
        notifySuccess("コメントを送信しました");
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : String(error);
        notifyError(message);
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMsg.id),
        );
      } finally {
        setSending(false);
      }
    })();
  }, [
    sending,
    input,
    workflow,
    currentStaff,
    cognitoUser,
    onWorkflowChange,
    mapCommentsToMessages,
    notifySuccess,
    notifyError,
    staffs,
  ]);

  return {
    currentStaff,
    messages,
    expandedMessages,
    toggleExpanded,
    input,
    setInput,
    sending,
    formatSender,
    sendMessage,
  };
};

export default useWorkflowCommentThread;
