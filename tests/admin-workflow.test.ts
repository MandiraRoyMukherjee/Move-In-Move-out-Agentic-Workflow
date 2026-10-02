/**
 * Admin workflow tests — plan §22
 * Tests the agent service logic directly (no DB required).
 */

// Mock AI and DB modules before imports
jest.mock("@/lib/ai/groq", () => ({
  callLLMJson: jest.fn(),
  callLLM: jest.fn(),
  GROQ_MODEL: "test-model",
  GROQ_MODEL_SMART: "test-model-smart",
}));
jest.mock("@/lib/db/prisma", () => ({}));
jest.mock("@/lib/db/repositories/request.repository", () => ({
  findRequestById: jest.fn(),
  createMoveRequest: jest.fn(),
  updateMoveRequest: jest.fn(),
  findAllRequests: jest.fn(),
  countRequestsByStatus: jest.fn(),
}));
jest.mock("@/lib/db/repositories/audit.repository", () => ({
  createAuditLog: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/lib/services/community.service", () => ({
  getCommunityConfig: jest.fn().mockResolvedValue({
    moveIn: {
      allowedDays: [
        "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
      ],
      startTime: "09:00",
      endTime: "18:00",
      noticePeriodDays: 2,
    },
    moveOut: {
      allowedDays: [
        "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
      ],
      noticePeriodDays: 7,
    },
  }),
}));

import {
  validateMoveRequest,
  getAvailableSlots,
} from "@/lib/services/agent.service";
import { addDays, toISODateString } from "@/lib/utils";

function futureWeekday(n: number): string {
  let d = addDays(new Date(), n);
  while (d.getDay() === 0) d = addDays(d, 1);
  return toISODateString(d);
}

describe("Agent service — validateMoveRequest", () => {
  test("returns valid=true for complete valid data", async () => {
    const result = await validateMoveRequest(
      {
        moveDate: futureWeekday(5),
        moveTime: "10:00",
        apartmentNumber: "A-1204",
        movingCompany: "Swift Movers",
        vehicleDetails: "KA01AB1234",
      },
      "MOVE_IN",
      "community-1"
    );
    expect(result.valid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  test("returns missingFields when required fields absent", async () => {
    const result = await validateMoveRequest(
      { moveDate: futureWeekday(5) },
      "MOVE_IN",
      "community-1"
    );
    // missingFields are returned even when date validation passes
    expect(result.missingFields.length).toBeGreaterThan(0);
    expect(result.missingFields).toContain("movingCompany");
  });

  test("returns valid=false with notice period violation", async () => {
    const tomorrow = toISODateString(addDays(new Date(), 1));
    const result = await validateMoveRequest(
      {
        moveDate: tomorrow,
        moveTime: "10:00",
        apartmentNumber: "A-1204",
        movingCompany: "Swift Movers",
        vehicleDetails: "KA01AB1234",
      },
      "MOVE_IN",
      "community-1"
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/notice/i);
  });
});

describe("Agent service — getAvailableSlots", () => {
  test("returns 10 available slots all on allowed days", async () => {
    const { slots } = await getAvailableSlots("community-1", "MOVE_IN");
    expect(slots).toHaveLength(10);
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const allowedDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    slots.forEach((slot) => {
      const day = days[new Date(slot + "T00:00:00").getDay()];
      expect(allowedDays).toContain(day);
    });
  });

  test("all slots are at least 2 days from today (notice period)", async () => {
    const { slots, noticePeriodDays } = await getAvailableSlots(
      "community-1",
      "MOVE_IN"
    );
    const earliest = addDays(new Date(), noticePeriodDays);
    earliest.setHours(0, 0, 0, 0);
    slots.forEach((slot) => {
      const slotDate = new Date(slot + "T00:00:00");
      expect(slotDate >= earliest).toBe(true);
    });
  });

  test("move-out slots respect 7-day notice period", async () => {
    const { slots, noticePeriodDays } = await getAvailableSlots(
      "community-1",
      "MOVE_OUT"
    );
    expect(noticePeriodDays).toBe(7);
    const earliest = addDays(new Date(), 7);
    earliest.setHours(0, 0, 0, 0);
    slots.forEach((slot) => {
      const slotDate = new Date(slot + "T00:00:00");
      expect(slotDate >= earliest).toBe(true);
    });
  });
});
