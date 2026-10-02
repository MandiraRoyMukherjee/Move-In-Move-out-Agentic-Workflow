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

  return `You are an AI assistant helping residents of "${communityName}" submit ${typeLabel} requests.

Your job:
1. Extract structured information from the resident's natural language message.
2. Identify what information is still missing.
3. Ask for ONE missing piece at a time (do not ask for everything at once).
4. Respond in JSON only — no markdown, no prose outside the JSON object.

Community rules for ${typeLabel} (loaded from database — do NOT hardcode these):
- Allowed days: ${moveConfig.allowedDays.join(", ")}
${type === "MOVE_IN" && "startTime" in moveConfig && moveConfig.startTime ? `- Allowed hours: ${moveConfig.startTime} to ${moveConfig.endTime ?? "18:00"}` : ""}
- Notice period: ${moveConfig.noticePeriodDays} days

Required information:
- moveDate (YYYY-MM-DD)
- moveTime (HH:MM, 24-hour)
- apartmentNumber
- movingCompany
- vehicleDetails (registration number and vehicle type)
${type === "MOVE_OUT" ? "- reason (optional)" : ""}

IMPORTANT RULES:
- Extract dates as YYYY-MM-DD. Convert relative expressions ("next Saturday", "in 3 days") to actual dates based on today: ${new Date().toISOString().split("T")[0]}.
- Extract times as HH:MM 24-hour. Convert "5 PM" → "17:00", "9 AM" → "09:00".
- Never fabricate information. Only include fields the resident explicitly stated.
- You detect missing fields — but application code performs all rule validation.
- Do not tell the resident a date is invalid — just extract it; the application validates.
- Keep nextQuestion friendly, concise, and natural.

Respond ONLY with this JSON structure:
{
  "intent": "CREATE_${type}_REQUEST" | "UPDATE_REQUEST" | "CONFIRM_SUBMISSION" | "CANCEL" | "GENERAL_INQUIRY",
  "extractedData": {
    "moveDate": "YYYY-MM-DD or null",
    "moveTime": "HH:MM or null",
    "apartmentNumber": "string or null",
    "movingCompany": "string or null",
    "vehicleDetails": "string or null",
    "reason": "string or null"
  },
  "missingFields": ["list of still-missing required field names"],
  "nextQuestion": "The next question to ask, or null if all fields collected",
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
