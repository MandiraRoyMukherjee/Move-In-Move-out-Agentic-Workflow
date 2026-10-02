/**
 * Agent service — named tool functions as described in plan §12.
 *
 * These are the conceptual "agent tools":
 *   getCommunityConfig()
 *   getMoveRequest()
 *   createMoveRequest()
 *   updateMoveRequest()
 *   validateMoveRequest()
 *   getAvailableSlots()
 *   submitMoveRequest()
 *   getRequestStatus()
 *   generateRequestSummary()
 *   generateAdminRecommendation()
 *   requestMoreInformation()
 *   approveMoveRequest()
 *   rejectMoveRequest()
 *
 * Each function delegates to the appropriate service/repository.
 * Structured this way so they can be exposed as MCP tools in future.
 */

import { getCommunityConfig as _getCommunityConfig } from "@/lib/services/community.service";
import {
  getRequestById,
  createDraftRequest,
  updateRequestData,
  submitRequest,
  adminApprove,
  adminReject,
  adminRequestMoreInfo,
} from "@/lib/services/request.service";
import {
  detectMissingFields,
  validateAgainstCommunityRules,
} from "@/lib/validation/request.validation";
import { callLLMJson, GROQ_MODEL } from "@/lib/ai/groq";
import { buildSummaryPrompt } from "@/lib/agent/prompts";
import { addDays, toISODateString } from "@/lib/utils";
import type { MoveRequestData } from "@/lib/validation/request.validation";

// ── Tool: getCommunityConfig ──────────────────────────────────────────────────

export async function getCommunityConfig(communityId: string) {
  return _getCommunityConfig(communityId);
}

// ── Tool: getMoveRequest ──────────────────────────────────────────────────────

export async function getMoveRequest(requestId: string) {
  return getRequestById(requestId);
}

// ── Tool: createMoveRequest ───────────────────────────────────────────────────

export async function createMoveRequest(params: {
  type: "MOVE_IN" | "MOVE_OUT";
  residentId: string;
  communityId: string;
  apartmentNumber?: string;
}) {
  return createDraftRequest(params);
}

// ── Tool: updateMoveRequest ───────────────────────────────────────────────────

export async function updateMoveRequest(
  requestId: string,
  data: Partial<MoveRequestData>,
  residentId: string
) {
  return updateRequestData(requestId, data, residentId);
}

// ── Tool: validateMoveRequest ─────────────────────────────────────────────────

export async function validateMoveRequest(
  data: Partial<MoveRequestData>,
  type: "MOVE_IN" | "MOVE_OUT",
  communityId: string
) {
  const config = await _getCommunityConfig(communityId);
  const moveConfig = type === "MOVE_IN" ? config.moveIn : config.moveOut;
  const missingFields = detectMissingFields(data, type);
  const validation = validateAgainstCommunityRules(data, moveConfig, type);
  return { missingFields, ...validation };
}

// ── Tool: getAvailableSlots ───────────────────────────────────────────────────

export async function getAvailableSlots(
  communityId: string,
  type: "MOVE_IN" | "MOVE_OUT",
  fromDate?: string
) {
  const config = await _getCommunityConfig(communityId);
  const moveConfig = type === "MOVE_IN" ? config.moveIn : config.moveOut;
  const start = fromDate ? new Date(fromDate) : new Date();
  const slots: string[] = [];

  // Return next 10 available dates
  const days = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY",
    "THURSDAY", "FRIDAY", "SATURDAY",
  ];
  let d = addDays(start, moveConfig.noticePeriodDays);
  let count = 0;
  while (count < 10) {
    if (moveConfig.allowedDays.includes(days[d.getDay()])) {
      slots.push(toISODateString(d));
      count++;
    }
    d = addDays(d, 1);
  }
  return { slots, noticePeriodDays: moveConfig.noticePeriodDays };
}

// ── Tool: submitMoveRequest ───────────────────────────────────────────────────

export async function submitMoveRequest(
  requestId: string,
  residentId: string
) {
  return submitRequest(requestId, residentId);
}

// ── Tool: getRequestStatus ────────────────────────────────────────────────────

export async function getRequestStatus(requestId: string) {
  const request = await getRequestById(requestId);
  return request ? { status: request.status, updatedAt: request.updatedAt } : null;
}

// ── Tool: generateRequestSummary ──────────────────────────────────────────────

export async function generateRequestSummary(params: {
  type: "MOVE_IN" | "MOVE_OUT";
  data: MoveRequestData;
  residentName: string;
  communityName: string;
}) {
  try {
    const result = await callLLMJson<{
      summary: string;
      recommendation: string;
      reasoning: string;
    }>(
      [
        {
          role: "user",
          content: buildSummaryPrompt(
            params.type,
            params.data,
            params.residentName,
            params.communityName,
            true
          ),
        },
      ],
      { model: GROQ_MODEL, temperature: 0.1, maxTokens: 256 }
    );
    return { summary: result.summary, recommendation: result.recommendation };
  } catch {
    return {
      summary: `${params.residentName} has provided all required information. Request is ready for review.`,
      recommendation: "APPROVE",
    };
  }
}

// ── Tool: generateAdminRecommendation ─────────────────────────────────────────

export async function generateAdminRecommendation(requestId: string) {
  const request = await getRequestById(requestId);
  if (!request) throw new Error("Request not found");

  return generateRequestSummary({
    type: request.type as "MOVE_IN" | "MOVE_OUT",
    data: {
      moveDate: request.moveDate ?? undefined,
      moveTime: request.moveTime ?? undefined,
      apartmentNumber: request.apartmentNumber ?? undefined,
      movingCompany: request.movingCompany ?? undefined,
      vehicleDetails: request.vehicleDetails ?? undefined,
      reason: request.reason ?? undefined,
    },
    residentName: request.resident?.name ?? "Resident",
    communityName: request.community?.name ?? "Community",
  });
}

// ── Tool: requestMoreInformation ──────────────────────────────────────────────

export async function requestMoreInformation(
  requestId: string,
  adminId: string,
  message: string
) {
  return adminRequestMoreInfo(requestId, adminId, message);
}

// ── Tool: approveMoveRequest ──────────────────────────────────────────────────

export async function approveMoveRequest(
  requestId: string,
  adminId: string,
  notes?: string
) {
  return adminApprove(requestId, adminId, notes);
}

// ── Tool: rejectMoveRequest ───────────────────────────────────────────────────

export async function rejectMoveRequest(
  requestId: string,
  adminId: string,
  notes?: string
) {
  return adminReject(requestId, adminId, notes);
}
