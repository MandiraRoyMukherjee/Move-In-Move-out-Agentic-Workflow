/**
 * Groq AI provider — server-side only.
 * Uses the Groq SDK. Structured around a simple interface so the provider
 * can be swapped (e.g., OpenAI, Anthropic) without changing callers.
 *
 * Model: llama-3.1-8b-instant (free tier, fast, capable)
 * Fallback: llama-3.1-70b-versatile if higher quality needed
 */

import Groq from "groq-sdk";

// Never import this file from the browser — API key is server-side only.
if (typeof window !== "undefined") {
  throw new Error("groq.ts must only be used server-side");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Best free model balancing speed and quality for structured JSON output
export const GROQ_MODEL = "llama-3.1-8b-instant";
export const GROQ_MODEL_SMART = "llama-3.3-70b-versatile";

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
  const maxTokens = options?.maxTokens ?? 1024;

  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
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
