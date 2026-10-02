/**
 * Prisma seed script — creates demo data for the ANACITY prototype.
 *
 * Data created:
 *  - 1 community: Green Valley Apartments
 *  - 2 residents: John Doe (A-1204), Jane Smith (B-2203)
 *  - 4 move requests: pending move-in, pending move-out, approved, info-required
 *  - Audit logs for each request
 *
 * Run: npm run db:seed
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { generateRequestNumber } from "../src/lib/utils";

// Seed uses a direct client instance (not the singleton)
const adapter = new PrismaLibSql({ url: "file:./prisma/dev.db" });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding database...");

  // ── Clean existing data ───────────────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.moveRequest.deleteMany();
  await prisma.resident.deleteMany();
  await prisma.community.deleteMany();

  // ── Community ─────────────────────────────────────────────────────────────
  const communityConfig = {
    moveIn: {
      allowedDays: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ],
      startTime: "09:00",
      endTime: "18:00",
      noticePeriodDays: 2,
    },
    moveOut: {
      allowedDays: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ],
      noticePeriodDays: 7,
    },
  };

  const community = await prisma.community.create({
    data: {
      name: "Green Valley Apartments",
      config: JSON.stringify(communityConfig),
    },
  });
  console.log(`  ✓ Community: ${community.name} (${community.id})`);

  // ── Residents ─────────────────────────────────────────────────────────────
  const john = await prisma.resident.create({
    data: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+91-9876543210",
      apartmentNumber: "A-1204",
      communityId: community.id,
    },
  });

  const jane = await prisma.resident.create({
    data: {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+91-9876543211",
      apartmentNumber: "B-2203",
      communityId: community.id,
    },
  });
  console.log(`  ✓ Residents: ${john.name}, ${jane.name}`);

  // ── Scenario 1: Pending Move-In (Under Review) ────────────────────────────
  const moveInPending = await prisma.moveRequest.create({
    data: {
      requestNumber: generateRequestNumber(),
      type: "MOVE_IN",
      residentId: john.id,
      communityId: community.id,
      status: "UNDER_REVIEW",
      moveDate: getFutureDate(5), // 5 days from now
      moveTime: "10:00",
      apartmentNumber: "A-1204",
      movingCompany: "Swift Movers Pvt Ltd",
      vehicleDetails: "KA01AB1234 — 20ft Truck",
      agentSummary:
        "John Doe has provided all required information for the move-in request. " +
        "The requested date falls on a weekday within allowed hours. " +
        "Moving company and vehicle details are complete.",
      agentRecommendation: "APPROVE",
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        requestId: moveInPending.id,
        actorType: "RESIDENT",
        actorId: john.id,
        action: "REQUEST_CREATED",
        details: JSON.stringify({ type: "MOVE_IN" }),
      },
      {
        requestId: moveInPending.id,
        actorType: "AGENT",
        actorId: "agent",
        action: "AGENT_VALIDATED",
        details: JSON.stringify({
          result: "VALID",
          checks: ["allowed_day", "allowed_time", "notice_period"],
        }),
      },
      {
        requestId: moveInPending.id,
        actorType: "RESIDENT",
        actorId: john.id,
        action: "STATUS_CHANGED_TO_SUBMITTED",
        details: JSON.stringify({ from: "DRAFT", to: "SUBMITTED" }),
      },
      {
        requestId: moveInPending.id,
        actorType: "SYSTEM",
        actorId: "system",
        action: "STATUS_CHANGED_TO_UNDER_REVIEW",
        details: JSON.stringify({ from: "SUBMITTED", to: "UNDER_REVIEW" }),
      },
    ],
  });
  console.log(`  ✓ Move-In pending request: ${moveInPending.requestNumber}`);

  // ── Scenario 2: Pending Move-Out (Under Review) ───────────────────────────
  const moveOutPending = await prisma.moveRequest.create({
    data: {
      requestNumber: generateRequestNumber(),
      type: "MOVE_OUT",
      residentId: jane.id,
      communityId: community.id,
      status: "UNDER_REVIEW",
      moveDate: getFutureDate(10), // 10 days from now (meets 7-day notice)
      moveTime: "14:00",
      apartmentNumber: "B-2203",
      movingCompany: "City Movers",
      vehicleDetails: "MH04CD5678 — Mini Truck",
      reason: "Relocating to Pune for work",
      agentSummary:
        "Jane Smith is requesting to move out with 10 days notice, which meets the 7-day " +
        "requirement. All required information has been provided.",
      agentRecommendation: "APPROVE",
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        requestId: moveOutPending.id,
        actorType: "RESIDENT",
        actorId: jane.id,
        action: "REQUEST_CREATED",
        details: JSON.stringify({ type: "MOVE_OUT" }),
      },
      {
        requestId: moveOutPending.id,
        actorType: "RESIDENT",
        actorId: jane.id,
        action: "STATUS_CHANGED_TO_SUBMITTED",
        details: JSON.stringify({ from: "DRAFT", to: "SUBMITTED" }),
      },
      {
        requestId: moveOutPending.id,
        actorType: "SYSTEM",
        actorId: "system",
        action: "STATUS_CHANGED_TO_UNDER_REVIEW",
        details: JSON.stringify({ from: "SUBMITTED", to: "UNDER_REVIEW" }),
      },
    ],
  });
  console.log(`  ✓ Move-Out pending request: ${moveOutPending.requestNumber}`);

  // ── Scenario 3: Approved Move-In ──────────────────────────────────────────
  const moveInApproved = await prisma.moveRequest.create({
    data: {
      requestNumber: generateRequestNumber(),
      type: "MOVE_IN",
      residentId: jane.id,
      communityId: community.id,
      status: "APPROVED",
      moveDate: getPastDate(3), // 3 days ago
      moveTime: "09:00",
      apartmentNumber: "B-2203",
      movingCompany: "Agarwal Packers",
      vehicleDetails: "DL05EF9012 — Tempo",
      agentSummary:
        "All move-in details are complete and comply with community rules. Approved.",
      agentRecommendation: "APPROVE",
      adminNotes: "Documents verified. Approved.",
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        requestId: moveInApproved.id,
        actorType: "RESIDENT",
        actorId: jane.id,
        action: "REQUEST_CREATED",
        details: JSON.stringify({ type: "MOVE_IN" }),
      },
      {
        requestId: moveInApproved.id,
        actorType: "RESIDENT",
        actorId: jane.id,
        action: "STATUS_CHANGED_TO_SUBMITTED",
        details: JSON.stringify({ from: "DRAFT", to: "SUBMITTED" }),
      },
      {
        requestId: moveInApproved.id,
        actorType: "SYSTEM",
        actorId: "system",
        action: "STATUS_CHANGED_TO_UNDER_REVIEW",
        details: JSON.stringify({ from: "SUBMITTED", to: "UNDER_REVIEW" }),
      },
      {
        requestId: moveInApproved.id,
        actorType: "ADMIN",
        actorId: "admin",
        action: "STATUS_CHANGED_TO_APPROVED",
        details: JSON.stringify({
          from: "UNDER_REVIEW",
          to: "APPROVED",
          notes: "Documents verified.",
        }),
      },
    ],
  });
  console.log(`  ✓ Approved request: ${moveInApproved.requestNumber}`);

  // ── Scenario 4: More Information Required ─────────────────────────────────
  const moveOutInfoRequired = await prisma.moveRequest.create({
    data: {
      requestNumber: generateRequestNumber(),
      type: "MOVE_OUT",
      residentId: john.id,
      communityId: community.id,
      status: "MORE_INFORMATION_REQUIRED",
      moveDate: getFutureDate(8),
      moveTime: "11:00",
      apartmentNumber: "A-1204",
      movingCompany: "FastMove",
      adminNotes: "Please provide vehicle registration number.",
      agentSummary:
        "John Doe is requesting to move out with 8 days notice. " +
        "Vehicle details appear incomplete — registration number is missing.",
      agentRecommendation: "REQUEST_MORE_INFORMATION",
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        requestId: moveOutInfoRequired.id,
        actorType: "RESIDENT",
        actorId: john.id,
        action: "REQUEST_CREATED",
        details: JSON.stringify({ type: "MOVE_OUT" }),
      },
      {
        requestId: moveOutInfoRequired.id,
        actorType: "RESIDENT",
        actorId: john.id,
        action: "STATUS_CHANGED_TO_SUBMITTED",
        details: JSON.stringify({ from: "DRAFT", to: "SUBMITTED" }),
      },
      {
        requestId: moveOutInfoRequired.id,
        actorType: "SYSTEM",
        actorId: "system",
        action: "STATUS_CHANGED_TO_UNDER_REVIEW",
        details: JSON.stringify({ from: "SUBMITTED", to: "UNDER_REVIEW" }),
      },
      {
        requestId: moveOutInfoRequired.id,
        actorType: "ADMIN",
        actorId: "admin",
        action: "MORE_INFORMATION_REQUESTED",
        details: JSON.stringify({
          message: "Please provide vehicle registration number.",
        }),
      },
      {
        requestId: moveOutInfoRequired.id,
        actorType: "ADMIN",
        actorId: "admin",
        action: "STATUS_CHANGED_TO_MORE_INFORMATION_REQUIRED",
        details: JSON.stringify({
          from: "UNDER_REVIEW",
          to: "MORE_INFORMATION_REQUIRED",
        }),
      },
    ],
  });
  console.log(
    `  ✓ More-info-required request: ${moveOutInfoRequired.requestNumber}`
  );

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log("\nDemo accounts:");
  console.log(`  Resident 1: john.doe@example.com  (${john.id})`);
  console.log(`  Resident 2: jane.smith@example.com (${jane.id})`);
  console.log(`  Community:  Green Valley Apartments (${community.id})`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFutureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  // Ensure it lands on a weekday (Mon–Sat) for valid demo data
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() + 1); // skip Sunday
  return d.toISOString().split("T")[0];
}

function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
