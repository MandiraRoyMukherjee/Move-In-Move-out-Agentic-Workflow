/**
 * Deterministic request validation — Zod schemas + community rule checks.
 *
 * Key design (plan §16):
 *   LLM  →  extracts dates/text
 *   THIS →  validates data against community rules
 *   DB   →  stores only valid data
 *
 * The LLM is never trusted for rule enforcement.
 */

import { z } from "zod";
import type { MoveConfig } from "@/types/community";
import { getDayOfWeek, addDays, toISODateString } from "@/lib/utils";

// ── Zod schemas ───────────────────────────────────────────────────────────────

export const MoveRequestDataSchema = z.object({
  moveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  moveTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM")
    .optional(),
  apartmentNumber: z.string().min(1).optional(),
  movingCompany: z.string().min(1).optional(),
  vehicleDetails: z.string().min(1).optional(),
  reason: z.string().optional(),
});

export type MoveRequestData = z.infer<typeof MoveRequestDataSchema>;

// Required fields for move-in
const MOVE_IN_REQUIRED: (keyof MoveRequestData)[] = [
  "moveDate",
  "moveTime",
  "apartmentNumber",
  "movingCompany",
  "vehicleDetails",
];

// Required fields for move-out
const MOVE_OUT_REQUIRED: (keyof MoveRequestData)[] = [
  "moveDate",
  "moveTime",
  "apartmentNumber",
  "movingCompany",
  "vehicleDetails",
];

export const FIELD_LABELS: Record<string, string> = {
  moveDate: "move date",
  moveTime: "move time",
  apartmentNumber: "apartment number",
  movingCompany: "moving company name",
  vehicleDetails: "vehicle details (registration number and type)",
  reason: "reason for moving out",
};

// ── Missing field detection ───────────────────────────────────────────────────

export function detectMissingFields(
  data: Partial<MoveRequestData>,
  type: "MOVE_IN" | "MOVE_OUT"
): string[] {
  const required = type === "MOVE_IN" ? MOVE_IN_REQUIRED : MOVE_OUT_REQUIRED;
  return required.filter((f) => !data[f] || String(data[f]).trim() === "");
}

// ── Community rule validation ─────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAlternative?: string;
}

export function validateAgainstCommunityRules(
  data: Partial<MoveRequestData>,
  config: MoveConfig,
  type: "MOVE_IN" | "MOVE_OUT"
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.moveDate) {
    return { valid: false, errors: ["Move date is required"], warnings };
  }

  const moveDate = new Date(data.moveDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Date must be in the future
  if (moveDate < today) {
    errors.push("Move date cannot be in the past.");
  }

  // 2. Notice period check
  const noticeDays = config.noticePeriodDays;
  const earliestAllowed = addDays(today, noticeDays);
  if (moveDate < earliestAllowed) {
    const altDate = findNextAllowedDate(earliestAllowed, config.allowedDays);
    const suggested = altDate ? toISODateString(altDate) : null;
    errors.push(
      `${type === "MOVE_IN" ? "Move-in" : "Move-out"} requires at least ${noticeDays} day${noticeDays !== 1 ? "s" : ""} notice. ` +
        `The earliest allowed date is ${toISODateString(earliestAllowed)}.` +
        (suggested ? ` Next available: ${suggested}.` : "")
    );
    return {
      valid: false,
      errors,
      warnings,
      suggestedAlternative: suggested ?? undefined,
    };
  }

  // 3. Allowed day check
  const dayOfWeek = getDayOfWeek(data.moveDate);
  if (!config.allowedDays.includes(dayOfWeek)) {
    const nextAllowed = findNextAllowedDate(moveDate, config.allowedDays);
    const suggested = nextAllowed ? toISODateString(nextAllowed) : null;
    errors.push(
      `${dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase()} is not an allowed ${type === "MOVE_IN" ? "move-in" : "move-out"} day. ` +
        `Allowed days: ${config.allowedDays.map((d) => d.charAt(0) + d.slice(1).toLowerCase()).join(", ")}.` +
        (suggested ? ` Next available: ${suggested}.` : "")
    );
    return {
      valid: false,
      errors,
      warnings,
      suggestedAlternative: suggested ?? undefined,
    };
  }

  // 4. Time window check (move-in only — moveOut config may not have startTime)
  if ("startTime" in config && config.startTime && data.moveTime) {
    const [rh, rm] = data.moveTime.split(":").map(Number);
    const [sh, sm] = config.startTime.split(":").map(Number);
    const [eh, em] = (config.endTime ?? "18:00").split(":").map(Number);

    const requestMins = rh * 60 + rm;
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (requestMins < startMins || requestMins > endMins) {
      errors.push(
        `Move time must be between ${config.startTime} and ${config.endTime ?? "18:00"}. ` +
          `Requested time ${data.moveTime} is outside the allowed window.`
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function findNextAllowedDate(
  from: Date,
  allowedDays: string[]
): Date | null {
  const MAX_SEARCH = 14; // search up to 2 weeks ahead
  const d = new Date(from);
  for (let i = 0; i < MAX_SEARCH; i++) {
    const day = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ][d.getDay()];
    if (allowedDays.includes(day)) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return null;
}
