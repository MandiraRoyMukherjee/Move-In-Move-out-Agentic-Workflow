/**
 * Move-In/Out chat UI — the AI-powered agentic conversation interface.
 *
 * Responsibilities:
 * - Displays conversation history
 * - Sends messages to /api/agent/chat
 * - Shows "thinking" state with contextual status
 * - Shows confirmation summary + submit button when complete
 * - Handles LLM failures gracefully (state is never lost)
 * - Submits via /api/requests/[id]/submit (human confirmation step)
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Send,
  Bot,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import type { ConversationState } from "@/types/agent";

interface Props {
  type: "MOVE_IN" | "MOVE_OUT";
  residentId: string;
  residentName: string;
  apartmentNumber: string;
  communityName: string;
  /** Optional override for the first message sent automatically on mount */
  initialMessage?: string;
}

const THINKING_MESSAGES = [
  "Agent is thinking…",
  "Checking community rules…",
  "Extracting your request details…",
  "Validating against community configuration…",
  "Preparing response…",
];

export function AgentChat({
  type,
  residentId,
  residentName,
  apartmentNumber,
  communityName,
  initialMessage,
}: Props) {
  const router = useRouter();
  const typeLabel = type === "MOVE_IN" ? "move-in" : "move-out";

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [thinkingMsg, setThinkingMsg] = useState(THINKING_MESSAGES[0]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [suggestedAlt, setSuggestedAlt] = useState<string | null>(null);
  const [state, setState] = useState<ConversationState>({
    requestType: type,
    collectedData: { apartmentNumber },
    messages: [],
    isComplete: false,
    readyToSubmit: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const thinkingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, loading]);

  // Cycle "thinking" messages for better UX
  const startThinking = useCallback(() => {
    let idx = 0;
    setThinkingMsg(THINKING_MESSAGES[0]);
    thinkingInterval.current = setInterval(() => {
      idx = (idx + 1) % THINKING_MESSAGES.length;
      setThinkingMsg(THINKING_MESSAGES[idx]);
    }, 1800);
  }, []);

  const stopThinking = useCallback(() => {
    if (thinkingInterval.current) {
      clearInterval(thinkingInterval.current);
      thinkingInterval.current = null;
    }
  }, []);

  // Send initial greeting on mount
  useEffect(() => {
    const greeting =
      initialMessage ??
      `Hi! I'd like to start a ${typeLabel} request for apartment ${apartmentNumber}.`;
    sendMessage(greeting, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage(message: string, silent = false) {
    if (!message.trim() || loading) return;

    // Optimistically add the user message
    if (!silent) {
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: "user",
            content: message,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    }
    setInput("");
    setLoading(true);
    setValidationErrors([]);
    setSuggestedAlt(null);
    startThinking();

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: message,
          type,
          residentId,
          state: silent ? state : {
            ...state,
            messages: [
              ...state.messages,
              {
                role: "user",
                content: message,
                timestamp: new Date().toISOString(),
              },
            ],
          },
          requestId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Agent error");
      }

      // Update local state from server response
      setState(data.updatedState);
      if (data.requestId) setRequestId(data.requestId);
      if (data.validationErrors?.length) setValidationErrors(data.validationErrors);
      if (data.suggestedAlternative) setSuggestedAlt(data.suggestedAlternative);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Agent unavailable — please retry."
      );
      // Don't add error to messages — state is preserved
    } finally {
      stopThinking();
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function handleSubmit() {
    if (!requestId) {
      toast.error("No request to submit.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");

      toast.success("Request submitted! Redirecting to your requests…");
      router.push(`/resident/requests/${requestId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-8rem)] max-w-2xl">
      {/* Header */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 capitalize">
            {typeLabel} Assistant
          </h1>
          <p className="text-sm text-gray-500">
            {residentName} · {communityName}
          </p>
        </div>
        {requestId && (
          <a
            href={`/resident/requests/${requestId}`}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            View request <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Chat messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {state.messages.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Starting conversation…
            </div>
          )}

          {state.messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500 italic">
                  {thinkingMsg}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              {validationErrors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          </div>
        )}

        {/* Suggested alternative quick-reply */}
        {suggestedAlt && !loading && (
          <div className="mx-4 mb-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Use suggested date?</span>
            <button
              onClick={() =>
                sendMessage(
                  `Yes, let's use ${suggestedAlt} instead.`
                )
              }
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              {suggestedAlt} →
            </button>
          </div>
        )}

        {/* Submit confirmation */}
        {state.isComplete && state.readyToSubmit && !loading && (
          <div className="mx-3 sm:mx-4 mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm text-green-800 font-medium">
                Request is complete and valid
              </span>
            </div>
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  sendMessage("I want to edit something.")
                }
                className="text-gray-600"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                loading={submitting}
                onClick={handleSubmit}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Confirm & Submit
              </Button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="p-3 border-t border-gray-100 flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || state.readyToSubmit}
            placeholder={
              state.readyToSubmit
                ? "Request is ready — confirm or edit above"
                : `Type your message… (Enter to send)`
            }
            rows={2}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none disabled:bg-gray-50 disabled:text-gray-400"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || state.readyToSubmit}
            loading={loading}
            size="sm"
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
