/**
 * Move request validation tests — plan §22
 *
 * Tests:
 * 1. Valid move-in date
 * 2. Invalid move-in day (Sunday)
 * 3. Invalid move-in time (outside window)
 * 4. Notice period violation
 * 5. Missing information detection
 */

import {
  validateAgainstCommunityRules,
  detectMissingFields,
} from "@/lib/validation/request.validation";
import { addDays, toISODateString } from "@/lib/utils";
import type { MoveConfig } from "@/types/community";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOVE_IN_CONFIG: MoveConfig = {
  allowedDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
  startTime: "09:00",
  endTime: "18:00",
  noticePeriodDays: 2,
};

const MOVE_OUT_CONFIG: MoveConfig = {
  allowedDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
  noticePeriodDays: 7,
};

/** Returns an ISO date string for a future weekday (Mon–Sat) N days from now */
function futureWeekday(daysFromNow: number): string {
  let d = addDays(new Date(), daysFromNow);
  // Advance past Sunday if needed
  while (d.getDay() === 0) d = addDays(d, 1);
  return toISODateString(d);
}

/** Returns an ISO date string for the upcoming Sunday */
function upcomingSunday(): string {
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  return toISODateString(addDays(today, daysUntilSunday));
}

// ── Test 1: Valid move-in date ────────────────────────────────────────────────

describe("validateAgainstCommunityRules — move-in", () => {
  test("1. accepts a valid future weekday with valid time", () => {
    const moveDate = futureWeekday(3); // 3 days from now, skipping Sunday
    const result = validateAgainstCommunityRules(
      { moveDate, moveTime: "10:00" },
      MOVE_IN_CONFIG,
      "MOVE_IN"
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // ── Test 2: Invalid move-in day ─────────────────────────────────────────────

  test("2. rejects Sunday", () => {
    const moveDate = upcomingSunday();
    const result = validateAgainstCommunityRules(
      { moveDate, moveTime: "10:00" },
      MOVE_IN_CONFIG,
      "MOVE_IN"
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Sunday|not an allowed/i);
    expect(result.suggestedAlternative).toBeDefined();
  });

  // ── Test 3: Invalid move-in time ────────────────────────────────────────────

  test("3. rejects time before 09:00", () => {
    const moveDate = futureWeekday(3);
    const result = validateAgainstCommunityRules(
      { moveDate, moveTime: "07:00" },
      MOVE_IN_CONFIG,
      "MOVE_IN"
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/time must be between/i);
  });

  test("3b. rejects time after 18:00", () => {
    const moveDate = futureWeekday(3);
    const result = validateAgainstCommunityRules(
      { moveDate, moveTime: "20:00" },
      MOVE_IN_CONFIG,
      "MOVE_IN"
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/time must be between/i);
  });

  test("3c. accepts 09:00 exactly (boundary)", () => {
    const moveDate = futureWeekday(3);
    const result = validateAgainstCommunityRules(
      { moveDate, moveTime: "09:00" },
      MOVE_IN_CONFIG,
      "MOVE_IN"
    );
    expect(result.valid).toBe(true);
  });

  test("3d. accepts 18:00 exactly (boundary)", () => {
    const moveDate = futureWeekday(3);
    const result = validateAgainstCommunityRules(
      { moveDate, moveTime: "18:00" },
      MOVE_IN_CONFIG,
      "MOVE_IN"
    );
    expect(result.valid).toBe(true);
  });
});

// ── Test 4: Notice period violation ──────────────────────────────────────────

describe("validateAgainstCommunityRules — notice period", () => {
  test("4a. move-in rejects within notice period (< 2 days)", () => {
    const tomorrow = toISODateString(addDays(new Date(), 1));
    const result = validateAgainstCommunityRules(
      { moveDate: tomorrow },
      MOVE_IN_CONFIG,
      "MOVE_IN"
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/notice/i);
  });

  test("4b. move-out rejects within 7-day notice period", () => {
    const in3Days = toISODateString(addDays(new Date(), 3));
    const result = validateAgainstCommunityRules(
      { moveDate: in3Days },
      MOVE_OUT_CONFIG,
      "MOVE_OUT"
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/notice/i);
    expect(result.suggestedAlternative).toBeDefined();
  });

  test("4c. move-out accepts exactly at 7-day boundary", () => {
    // Find a weekday exactly 7 days from now (may need to advance past Sunday)
    let d = addDays(new Date(), 7);
    while (d.getDay() === 0) d = addDays(d, 1);
    const result = validateAgainstCommunityRules(
      { moveDate: toISODateString(d) },
      MOVE_OUT_CONFIG,
      "MOVE_OUT"
    );
    expect(result.valid).toBe(true);
  });

  test("4d. rejects past date regardless of notice", () => {
    const yesterday = toISODateString(addDays(new Date(), -1));
    const result = validateAgainstCommunityRules(
      { moveDate: yesterday },
      MOVE_IN_CONFIG,
      "MOVE_IN"
    );
    expect(result.valid).toBe(false);
  });
});

// ── Test 5: Missing information detection ─────────────────────────────────────

describe("detectMissingFields", () => {
  test("5a. all fields present — returns empty array", () => {
    const missing = detectMissingFields(
      {
        moveDate: "2026-10-15",
        moveTime: "10:00",
        apartmentNumber: "A-1204",
        movingCompany: "Swift Movers",
        vehicleDetails: "KA01AB1234",
      },
      "MOVE_IN"
    );
    expect(missing).toHaveLength(0);
  });

  test("5b. no fields present — returns all required fields", () => {
    const missing = detectMissingFields({}, "MOVE_IN");
    expect(missing).toContain("moveDate");
    expect(missing).toContain("moveTime");
    expect(missing).toContain("apartmentNumber");
    expect(missing).toContain("movingCompany");
    expect(missing).toContain("vehicleDetails");
    expect(missing).toHaveLength(5);
  });

  test("5c. partial data — returns only missing fields", () => {
    const missing = detectMissingFields(
      { moveDate: "2026-10-15", moveTime: "10:00" },
      "MOVE_IN"
    );
    expect(missing).not.toContain("moveDate");
    expect(missing).not.toContain("moveTime");
    expect(missing).toContain("apartmentNumber");
  });

  test("5d. move-out requires same fields (reason optional)", () => {
    const missing = detectMissingFields({}, "MOVE_OUT");
    expect(missing).not.toContain("reason"); // reason is optional for move-out
    expect(missing).toHaveLength(5);
  });
});
