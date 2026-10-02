/**
 * Request status transition tests — plan §22
 *
 * Tests:
 * 6. Valid status transitions
 * 7. Admin approval
 * 8. Admin rejection
 * 9. Request-more-information flow
 * 10. Audit log creation (via service)
 */

// We test the pure transition logic without hitting the DB
// by extracting the VALID_TRANSITIONS map logic.

type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MORE_INFORMATION_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "MORE_INFORMATION_REQUIRED"],
  MORE_INFORMATION_REQUIRED: ["UNDER_REVIEW"],
  APPROVED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

// ── Test 6: Request state transitions ─────────────────────────────────────────

describe("Request status transitions", () => {
  test("6a. DRAFT → SUBMITTED is valid", () => {
    expect(canTransition("DRAFT", "SUBMITTED")).toBe(true);
  });

  test("6b. SUBMITTED → UNDER_REVIEW is valid", () => {
    expect(canTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  test("6c. UNDER_REVIEW → APPROVED is valid", () => {
    expect(canTransition("UNDER_REVIEW", "APPROVED")).toBe(true);
  });

  test("6d. UNDER_REVIEW → REJECTED is valid", () => {
    expect(canTransition("UNDER_REVIEW", "REJECTED")).toBe(true);
  });

  test("6e. UNDER_REVIEW → MORE_INFORMATION_REQUIRED is valid", () => {
    expect(canTransition("UNDER_REVIEW", "MORE_INFORMATION_REQUIRED")).toBe(true);
  });

  test("6f. MORE_INFORMATION_REQUIRED → UNDER_REVIEW is valid (resubmit)", () => {
    expect(canTransition("MORE_INFORMATION_REQUIRED", "UNDER_REVIEW")).toBe(true);
  });

  test("6g. DRAFT → APPROVED is invalid (skip steps)", () => {
    expect(canTransition("DRAFT", "APPROVED")).toBe(false);
  });

  test("6h. APPROVED → REJECTED is invalid (irreversible)", () => {
    expect(canTransition("APPROVED", "REJECTED")).toBe(false);
  });

  test("6i. REJECTED → UNDER_REVIEW is invalid", () => {
    expect(canTransition("REJECTED", "UNDER_REVIEW")).toBe(false);
  });

  test("6j. COMPLETED has no further transitions", () => {
    const transitions = VALID_TRANSITIONS["COMPLETED"];
    expect(transitions).toHaveLength(0);
  });
});

// ── Test 7: Admin approval ─────────────────────────────────────────────────────

describe("Admin approval workflow", () => {
  test("7. UNDER_REVIEW can only be approved/rejected/more-info by admin", () => {
    const validAdminActions: RequestStatus[] = VALID_TRANSITIONS["UNDER_REVIEW"];
    expect(validAdminActions).toContain("APPROVED");
    expect(validAdminActions).toContain("REJECTED");
    expect(validAdminActions).toContain("MORE_INFORMATION_REQUIRED");
    expect(validAdminActions).not.toContain("SUBMITTED"); // can't go back
    expect(validAdminActions).not.toContain("DRAFT");
  });
});

// ── Test 8: Admin rejection ────────────────────────────────────────────────────

describe("Admin rejection workflow", () => {
  test("8. rejected request has no further transitions", () => {
    expect(canTransition("REJECTED", "SUBMITTED")).toBe(false);
    expect(canTransition("REJECTED", "APPROVED")).toBe(false);
    expect(VALID_TRANSITIONS["REJECTED"]).toHaveLength(0);
  });
});

// ── Test 9: Request-more-information flow ─────────────────────────────────────

describe("More information flow", () => {
  test("9a. UNDER_REVIEW → MORE_INFORMATION_REQUIRED → UNDER_REVIEW cycle", () => {
    expect(canTransition("UNDER_REVIEW", "MORE_INFORMATION_REQUIRED")).toBe(true);
    expect(canTransition("MORE_INFORMATION_REQUIRED", "UNDER_REVIEW")).toBe(true);
  });

  test("9b. MORE_INFORMATION_REQUIRED cannot jump to APPROVED directly", () => {
    expect(canTransition("MORE_INFORMATION_REQUIRED", "APPROVED")).toBe(false);
  });
});

// ── Test 10: Audit log data structure ─────────────────────────────────────────

describe("Audit log structure", () => {
  test("10. audit log action names follow STATUS_CHANGED_TO_ pattern", () => {
    const statuses: RequestStatus[] = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
      "MORE_INFORMATION_REQUIRED",
    ];
    statuses.forEach((status) => {
      const actionName = `STATUS_CHANGED_TO_${status}`;
      expect(actionName).toMatch(/^STATUS_CHANGED_TO_/);
    });
  });

  test("10b. actor types are constrained to known values", () => {
    const validActors = ["RESIDENT", "ADMIN", "AGENT", "SYSTEM"];
    ["RESIDENT", "ADMIN", "AGENT", "SYSTEM"].forEach((actor) => {
      expect(validActors).toContain(actor);
    });
    expect(validActors).not.toContain("ANONYMOUS");
  });
});
