/**
 * Groq AI provider — server-side only.
 * Uses the Groq SDK. Structured around a simple interface so the provider
 * can be swapped (e.g., OpenAI, Anthropic) without changing callers.
 *
 * Model: openai/gpt-oss-20b — available on Groq free tier, fast JSON output
 * Fallback: openai/gpt-oss-120b for higher quality
 *
 * NOTE: response_format: json_object is NOT used — this model works best with
 * strong system prompt instructions + JSON extraction from text output.
 */

import Groq from "groq-sdk";

// Never import this file from the browser — API key is server-side only.
if (typeof window !== "undefined") {
  throw new Error("groq.ts must only be used server-side");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Current working models on Groq free tier
export const GROQ_MODEL = "openai/gpt-oss-20b";
export const GROQ_MODEL_SMART = "openai/gpt-oss-120b";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * Call the Groq LLM with a list of messages.
 * Returns the assistant's response text.
 * Throws on API failure — callers should handle this gracefully.
 */
export async function callLLM(
  messages: LLMMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<LLMResponse> {
  const model = options?.model ?? GROQ_MODEL;
  const temperature = options?.temperature ?? 0.1; // Low temp for deterministic structured output
  const maxTokens = options?.maxTokens ?? 1500; // gpt-oss-20b needs more tokens for JSON

  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    // response_format json_object not used — openai/gpt-oss-20b works better
    // with explicit JSON instructions in the system prompt + text extraction
  });

  const content = completion.choices[0]?.message?.content ?? "";
  return {
    content,
    model,
    usage: completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
        }
      : undefined,
  };
}

/**
 * Call the LLM expecting a JSON object back.
 * Parses and returns the object, throws if parsing fails.
 */
export async function callLLMJson<T = Record<string, unknown>>(
  messages: LLMMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<T> {
  const response = await callLLM(messages, {
    ...options,
    jsonMode: true,
  });

  try {
    return JSON.parse(response.content) as T;
  } catch {
    // Attempt to extract JSON from the response
    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(
      `LLM returned non-JSON response: ${response.content.slice(0, 200)}`
    );
  }
}
