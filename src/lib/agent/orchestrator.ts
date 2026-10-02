/**
 * Agent orchestrator — the core agentic loop.
 *
 * Flow (plan §13):
 *   user message
 *   → determine intent
 *   → load request state
 *   → load community config
 *   → extract information (LLM)
 *   → merge into request state
 *   → detect missing fields (deterministic)
 *   → if missing → ask user (LLM generates question)
 *   → if complete → validate against community rules (deterministic)
 *   → if invalid → explain + suggest alternative (LLM formats message)
 *   → if valid → generate summary (LLM)
 *   → return structured response
 *
 * The LLM is sandboxed: it extracts and formats language.
 * All rule enforcement is deterministic TypeScript.
 */

import { callLLMJson, GROQ_MODEL } from "@/lib/ai/groq";
import {
  buildSystemPrompt,
  buildSummaryPrompt,
  toConversationHistory,
} from "@/lib/agent/prompts";
import {
  detectMissingFields,
  validateAgainstCommunityRules,
  type MoveRequestData,
} from "@/lib/validation/request.validation";
import { getNextQuestion } from "@/lib/agent/missing-info";
import { getCommunityConfig } from "@/lib/services/community.service";
import type { AgentResponse, ConversationState } from "@/types/agent";

// ── Main orchestration function ───────────────────────────────────────────────

export interface OrchestrateParams {
  userMessage: string;
  type: "MOVE_IN" | "MOVE_OUT";
  residentId: string;
  communityId: string;
  residentName: string;
  communityName: string;
  existingState: ConversationState;
}

export interface OrchestrateResult {
  response: AgentResponse;
  updatedState: ConversationState;
  agentSummary?: string;
  agentRecommendation?: string;
}

export async function orchestrate(
  params: OrchestrateParams
): Promise<OrchestrateResult> {
  const {
    userMessage,
    type,
    communityId,
    residentName,
    communityName,
    existingState,
  } = params;

  // ── 1. Load community config (from DB, not hardcoded) ──────────────────────
  const config = await getCommunityConfig(communityId);
  const moveConfig = type === "MOVE_IN" ? config.moveIn : config.moveOut;

  // ── 2. Append user message to conversation history ─────────────────────────
  const now = new Date().toISOString();
  const updatedMessages = [
    ...existingState.messages,
    { role: "user" as const, content: userMessage, timestamp: now },
  ];

  // ── 3. Call LLM for extraction ─────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(type, communityName, config);

  let llmOutput: AgentResponse;
  try {
    llmOutput = await callLLMJson<AgentResponse>(
      [
        { role: "system", content: systemPrompt },
        ...toConversationHistory(updatedMessages),
      ],
      { model: GROQ_MODEL, temperature: 0.1, maxTokens: 1000 }
    );
  } catch {
    // LLM failure — preserve state, return graceful error (plan §20)
    const errorResponse: AgentResponse = {
      intent: "UNKNOWN",
      extractedData: {},
      missingFields: detectMissingFields(existingState.collectedData, type),
      nextQuestion: null,
      validationErrors: [],
      isComplete: false,
      message:
        "I'm having trouble connecting right now. Your progress is saved — please try again in a moment.",
    };
    return {
      response: errorResponse,
      updatedState: {
        ...existingState,
        messages: [
          ...updatedMessages,
          {
            role: "assistant",
            content: errorResponse.message,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    };
  }

  // ── 4. Merge extracted data into state (additive — never overwrite) ─────────
  const merged: MoveRequestData = {
    ...existingState.collectedData,
  };

  // Only adopt non-null extracted values
  const extracted = llmOutput.extractedData ?? {};
  for (const [k, v] of Object.entries(extracted)) {
    if (v != null && String(v).trim() !== "" && String(v) !== "null") {
      (merged as Record<string, unknown>)[k] = v;
    }
  }

  // ── 5. Detect missing fields (deterministic) ───────────────────────────────
  const missing = detectMissingFields(merged, type);

  // ── 6. If still missing — ask for next field ───────────────────────────────
  if (missing.length > 0) {
    const question = getNextQuestion(missing, llmOutput.nextQuestion);
    const assistantMessage = question;
    const updatedState: ConversationState = {
      ...existingState,
      requestType: type,
      collectedData: merged,
      messages: [
        ...updatedMessages,
        {
          role: "assistant",
          content: assistantMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      isComplete: false,
      readyToSubmit: false,
    };

    return {
      response: {
        intent: llmOutput.intent ?? "UPDATE_REQUEST",
        extractedData: merged,
        missingFields: missing,
        nextQuestion: question,
        validationErrors: [],
        isComplete: false,
        message: assistantMessage,
      },
      updatedState,
    };
  }

  // ── 7. All fields present — validate against community rules ───────────────
  const validationResult = validateAgainstCommunityRules(merged, moveConfig, type);

  if (!validationResult.valid) {
    // Build a friendly message incorporating the validation errors
    const errorSummary = validationResult.errors.join(" ");
    const altMsg = validationResult.suggestedAlternative
      ? ` I've found that ${validationResult.suggestedAlternative} is available — would you like to use that date?`
      : " Please provide a valid date that meets the community requirements.";

    const assistantMessage = `I found an issue with your request: ${errorSummary}${altMsg}`;

    const updatedState: ConversationState = {
      ...existingState,
      requestType: type,
      collectedData: merged,
      messages: [
        ...updatedMessages,
        {
          role: "assistant",
          content: assistantMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      isComplete: false,
      readyToSubmit: false,
    };

    return {
      response: {
        intent: "UPDATE_REQUEST",
        extractedData: merged,
        missingFields: [],
        nextQuestion: null,
        validationErrors: validationResult.errors,
        isComplete: false,
        suggestedAlternative: validationResult.suggestedAlternative,
        message: assistantMessage,
      },
      updatedState,
    };
  }

  // ── 8. Valid and complete — generate AI summary ────────────────────────────
  let agentSummary: string | undefined;
  let agentRecommendation: string | undefined;

  try {
    const summaryOutput = await callLLMJson<{
      summary: string;
      recommendation: string;
      reasoning: string;
    }>(
      [
        {
          role: "user",
          content: buildSummaryPrompt(
            type,
            merged,
            residentName,
            communityName,
            true
          ),
        },
      ],
      { model: GROQ_MODEL, temperature: 0.1, maxTokens: 500 }
    );
    agentSummary = summaryOutput.summary;
    agentRecommendation = summaryOutput.recommendation;
  } catch {
    // Summary generation failure is non-fatal
    agentSummary = `${residentName} has provided all required information for their ${type === "MOVE_IN" ? "move-in" : "move-out"} request. The request is ready for admin review.`;
    agentRecommendation = "APPROVE";
  }

  // Build the confirmation summary message
  const summaryLines = [
    `Here's a summary of your ${type === "MOVE_IN" ? "move-in" : "move-out"} request:`,
    ``,
    `📅 **Date:** ${merged.moveDate}`,
    `🕐 **Time:** ${merged.moveTime}`,
    `🏠 **Apartment:** ${merged.apartmentNumber}`,
    `🚛 **Moving Company:** ${merged.movingCompany}`,
    `🚗 **Vehicle:** ${merged.vehicleDetails}`,
    merged.reason ? `📝 **Reason:** ${merged.reason}` : "",
    ``,
    `✅ All community rules have been checked and your request is valid.`,
    ``,
    `Ready to submit? Click **Confirm & Submit** to send this to the admin for review.`,
  ]
    .filter(Boolean)
    .join("\n");

  const updatedState: ConversationState = {
    ...existingState,
    requestType: type,
    collectedData: merged,
    messages: [
      ...updatedMessages,
      {
        role: "assistant",
        content: summaryLines,
        timestamp: new Date().toISOString(),
      },
    ],
    isComplete: true,
    readyToSubmit: true,
  };

  return {
    response: {
      intent: "CONFIRM_SUBMISSION",
      extractedData: merged,
      missingFields: [],
      nextQuestion: null,
      validationErrors: [],
      isComplete: true,
      readyToSubmit: true,
      message: summaryLines,
    },
    updatedState,
    agentSummary,
    agentRecommendation,
  };
}
