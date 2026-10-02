/**
 * Agent prompt templates.
 *
 * Structured JSON output is required for all agent responses (plan §15).
 * The LLM extracts, summarises, and recommends — it never validates rules.
 * Deterministic validation is performed in request.validation.ts.
 */

import type { ConversationMessage } from "@/types/agent";
import type { CommunityConfig } from "@/types/community";
import type { MoveRequestData } from "@/lib/validation/request.validation";

/**
 * System prompt for the move-request assistant.
 * Community rules are injected at runtime — never hardcoded.
 */
export function buildSystemPrompt(
  type: "MOVE_IN" | "MOVE_OUT",
  communityName: string,
  config: CommunityConfig
): string {
  const moveConfig = type === "MOVE_IN" ? config.moveIn : config.moveOut;
  const typeLabel = type === "MOVE_IN" ? "move-in" : "move-out";

  const timeRule =
    type === "MOVE_IN" && "startTime" in moveConfig && moveConfig.startTime
      ? `- Allowed hours: ${moveConfig.startTime} to ${moveConfig.endTime ?? "18:00"}`
      : "";

  const reasonNote =
    type === "MOVE_OUT"
      ? `- reason for moving out (OPTIONAL — skip if not provided, do NOT ask for it)`
      : "";

  return `You are an AI assistant helping residents of "${communityName}" submit ${typeLabel} requests.

Your job:
1. Extract structured information from the resident's natural language message.
2. Identify what required information is still missing.
3. Ask for ONE missing required piece at a time — do not ask for everything at once.
4. Respond in JSON only — no markdown, no prose outside the JSON object.

Community rules for ${typeLabel} (loaded from database — do NOT hardcode these):
- Allowed days: ${moveConfig.allowedDays.join(", ")}
${timeRule}
- Minimum notice period: ${moveConfig.noticePeriodDays} days before move date
- Today's date: ${new Date().toISOString().split("T")[0]}

Required fields (you must collect all of these):
- moveDate (YYYY-MM-DD)
- moveTime (HH:MM, 24-hour)
- apartmentNumber
- movingCompany
- vehicleDetails (registration number and vehicle type)
${reasonNote}

EXTRACTION RULES:
- Convert relative dates to YYYY-MM-DD based on today (${new Date().toISOString().split("T")[0]}). E.g. "next Saturday", "in 3 days", "tomorrow".
- Convert times to HH:MM 24-hour. E.g. "5 PM" → "17:00", "9 AM" → "09:00", "noon" → "12:00".
- Only include fields the resident explicitly stated. Never fabricate values.
- Do NOT validate dates/times yourself — just extract them. The application validates.
- For move-out: do NOT ask for reason if resident hasn't mentioned it — it is optional.
- Keep nextQuestion friendly, concise, and conversational.
- missingFields must only contain fields that are REQUIRED and still absent.

Respond ONLY with this exact JSON structure (no other text):
{
  "intent": "CREATE_${type}_REQUEST",
  "extractedData": {
    "moveDate": "YYYY-MM-DD or null",
    "moveTime": "HH:MM or null",
    "apartmentNumber": "string or null",
    "movingCompany": "string or null",
    "vehicleDetails": "string or null",
    "reason": "string or null"
  },
  "missingFields": ["array of required field names still missing"],
  "nextQuestion": "Next question to ask the resident, or null if all required fields are collected",
  "message": "A natural, friendly message to show the resident"
}`;
}

/**
 * Build the summary generation prompt for agent summary + recommendation.
 */
export function buildSummaryPrompt(
  type: "MOVE_IN" | "MOVE_OUT",
  data: MoveRequestData,
  residentName: string,
  communityName: string,
  validationPassed: boolean
): string {
  return `Generate a concise admin summary and recommendation for this ${type === "MOVE_IN" ? "move-in" : "move-out"} request.

Resident: ${residentName}
Community: ${communityName}
Request type: ${type === "MOVE_IN" ? "Move-In" : "Move-Out"}
Move date: ${data.moveDate ?? "not provided"}
Move time: ${data.moveTime ?? "not provided"}
Apartment: ${data.apartmentNumber ?? "not provided"}
Moving company: ${data.movingCompany ?? "not provided"}
Vehicle: ${data.vehicleDetails ?? "not provided"}
${data.reason ? `Reason: ${data.reason}` : ""}
Community rule validation: ${validationPassed ? "PASSED" : "FAILED"}

Respond ONLY with this JSON:
{
  "summary": "2-3 sentence summary of the request for the admin. Include key details and validation status.",
  "recommendation": "APPROVE" | "REJECT" | "REQUEST_MORE_INFORMATION",
  "reasoning": "One sentence explaining the recommendation."
}`;
}

/**
 * Convert stored conversation messages to LLM message format.
 */
export function toConversationHistory(
  messages: ConversationMessage[]
): { role: "user" | "assistant"; content: string }[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}
