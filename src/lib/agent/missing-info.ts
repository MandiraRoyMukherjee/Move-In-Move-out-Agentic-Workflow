/**
 * Missing-information detection helpers.
 *
 * Provides human-readable questions for each required field,
 * keeping the "ask one at a time" UX consistent regardless of
 * whether the LLM generates a question.
 */

import type { MoveRequestData } from "@/lib/validation/request.validation";

export const FIELD_QUESTIONS: Record<string, string> = {
  moveDate: "What date would you like to move? (e.g. next Monday, 15 July)",
  moveTime: "What time would you like to start the move? (e.g. 10 AM, 2:30 PM)",
  apartmentNumber: "What is your apartment number?",
  movingCompany: "Which moving company will you be using?",
  vehicleDetails:
    "What is the vehicle registration number and type? (e.g. KA01AB1234 — 20ft truck)",
  reason: "What is the reason for moving out? (optional)",
};

export const FIELD_LABELS: Record<string, string> = {
  moveDate: "move date",
  moveTime: "move time",
  apartmentNumber: "apartment number",
  movingCompany: "moving company",
  vehicleDetails: "vehicle details",
  reason: "reason",
};

/**
 * Return the first missing required field and its default question.
 */
export function getNextQuestion(
  missingFields: string[],
  llmQuestion?: string | null
): string {
  if (missingFields.length === 0) return "";
  const field = missingFields[0];
  return llmQuestion?.trim() || FIELD_QUESTIONS[field] || `Please provide your ${FIELD_LABELS[field] ?? field}.`;
}

/**
 * Build a progress summary string showing what's been collected so far.
 */
export function buildProgressSummary(data: Partial<MoveRequestData>): string {
  const collected: string[] = [];
  if (data.moveDate) collected.push(`📅 Date: ${data.moveDate}`);
  if (data.moveTime) collected.push(`🕐 Time: ${data.moveTime}`);
  if (data.apartmentNumber) collected.push(`🏠 Apt: ${data.apartmentNumber}`);
  if (data.movingCompany) collected.push(`🚛 Company: ${data.movingCompany}`);
  if (data.vehicleDetails) collected.push(`🚗 Vehicle: ${data.vehicleDetails}`);
  if (data.reason) collected.push(`📝 Reason: ${data.reason}`);
  return collected.join(" · ");
}
