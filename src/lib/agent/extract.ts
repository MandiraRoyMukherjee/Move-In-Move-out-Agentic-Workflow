/**
 * Natural-language extraction module.
 *
 * Wraps the LLM call specifically for structured data extraction from
 * a user message. Keeps extraction logic separate from orchestration.
 *
 * Returns null on LLM failure — orchestrator handles the fallback.
 */

import { callLLMJson, GROQ_MODEL } from "@/lib/ai/groq";
import type { AgentExtractedData } from "@/types/agent";

export interface ExtractionInput {
  userMessage: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  systemPrompt: string;
}

export interface ExtractionResult {
  intent: string;
  extractedData: AgentExtractedData;
  missingFields: string[];
  nextQuestion: string | null;
  message: string;
}

/**
 * Call the LLM to extract structured data from the user's message.
 * Returns null on failure — callers must handle gracefully.
 */
export async function extractFromMessage(
  input: ExtractionInput
): Promise<ExtractionResult | null> {
  try {
    const result = await callLLMJson<ExtractionResult>(
      [
        { role: "system", content: input.systemPrompt },
        ...input.conversationHistory,
        { role: "user", content: input.userMessage },
      ],
      { model: GROQ_MODEL, temperature: 0.1, maxTokens: 512 }
    );

    // Sanitise: strip "null" strings from extracted data
    const sanitised: AgentExtractedData = {};
    for (const [k, v] of Object.entries(result.extractedData ?? {})) {
      if (v != null && String(v).trim() !== "" && String(v).toLowerCase() !== "null") {
        (sanitised as Record<string, unknown>)[k] = v;
      }
    }

    return { ...result, extractedData: sanitised };
  } catch {
    return null;
  }
}
