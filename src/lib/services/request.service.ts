/**
 * Request service — business logic for move request lifecycle.
 *
 * Key design principle (from plan §14):
 * - LLM → structured intent/action → this service → repository → DB
 * - Status transitions are validated here, never by LLM directly
 * - Every status change creates an audit log
 */

import {
  createMoveRequest,
  updateMoveRequest,
  findRequestById,
  findRequestsByResident,
  findAllRequests,
  countRequestsByStatus,
} from "@/lib/db/repositories/request.repository";
import { createAuditLog } from "@/lib/db/repositories/audit.repository";
import { generateRequestNumber } from "@/lib/utils";
import type { RequestStatus, RequestType } from "@/types/request";

// Valid status transitions — enforced server-side, never by LLM
const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "MORE_INFORMATION_REQUIRED"],
  MORE_INFORMATION_REQUIRED: ["UNDER_REVIEW"],
  APPROVED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

export async function createDraftRequest(params: {
  type: RequestType;
  residentId: string;
  communityId: string;
  apartmentNumber?: string;
}) {
  const requestNumber = generateRequestNumber();
  const request = await createMoveRequest({
    requestNumber,
    type: params.type,
    residentId: params.residentId,
    communityId: params.communityId,
    status: "DRAFT",
    apartmentNumber: params.apartmentNumber,
  });

  await createAuditLog({
    requestId: request.id,
    actorType: "RESIDENT",
    actorId: params.residentId,
    action: "REQUEST_CREATED",
    details: { type: params.type, requestNumber },
  });

  return request;
}

export async function updateRequestData(
  requestId: string,
  data: Partial<{
    moveDate: string;
    moveTime: string;
    apartmentNumber: string;
    movingCompany: string;
    vehicleDetails: string;
    reason: string;
    conversationState: string;
    agentSummary: string;
    agentRecommendation: string;
  }>,
  actorId: string
) {
  const updated = await updateMoveRequest(requestId, data);

  await createAuditLog({
    requestId,
    actorType: "RESIDENT",
    actorId,
    action: "REQUEST_UPDATED",
    details: { fields: Object.keys(data) },
  });

  return updated;
}

export async function transitionStatus(
  requestId: string,
  toStatus: RequestStatus,
  actorType: "RESIDENT" | "ADMIN" | "SYSTEM",
  actorId: string,
  notes?: string
) {
  const request = await findRequestById(requestId);
  if (!request) throw new Error(`Request not found: ${requestId}`);

  const current = request.status as RequestStatus;
  const allowed = VALID_TRANSITIONS[current] ?? [];

  if (!allowed.includes(toStatus)) {
    throw new Error(
      `Invalid transition: ${current} → ${toStatus}. Allowed: ${allowed.join(", ") || "none"}`
    );
  }

  const updateData: Parameters<typeof updateMoveRequest>[1] = {
    status: toStatus,
  };
  if (notes !== undefined) updateData.adminNotes = notes;

  const updated = await updateMoveRequest(requestId, updateData);

  await createAuditLog({
    requestId,
    actorType,
    actorId,
    action: `STATUS_CHANGED_TO_${toStatus}`,
    details: { from: current, to: toStatus, ...(notes ? { notes } : {}) },
  });

  return updated;
}

export async function submitRequest(requestId: string, residentId: string) {
  // First move to SUBMITTED
  const submitted = await transitionStatus(
    requestId,
    "SUBMITTED",
    "RESIDENT",
    residentId
  );

  // Immediately move to UNDER_REVIEW (system action)
  const underReview = await transitionStatus(
    submitted.id,
    "UNDER_REVIEW",
    "SYSTEM",
    "system"
  );

  return underReview;
}

export async function adminApprove(
  requestId: string,
  adminId: string,
  notes?: string
) {
  return transitionStatus(requestId, "APPROVED", "ADMIN", adminId, notes);
}

export async function adminReject(
  requestId: string,
  adminId: string,
  notes?: string
) {
  return transitionStatus(requestId, "REJECTED", "ADMIN", adminId, notes);
}

export async function adminRequestMoreInfo(
  requestId: string,
  adminId: string,
  message: string
) {
  const request = await findRequestById(requestId);
  if (!request) throw new Error(`Request not found: ${requestId}`);

  await updateMoveRequest(requestId, { adminNotes: message });
  const updated = await transitionStatus(
    requestId,
    "MORE_INFORMATION_REQUIRED",
    "ADMIN",
    adminId,
    message
  );

  await createAuditLog({
    requestId,
    actorType: "ADMIN",
    actorId: adminId,
    action: "MORE_INFORMATION_REQUESTED",
    details: { message },
  });

  return updated;
}

export async function getRequestById(id: string) {
  return findRequestById(id);
}

export async function getResidentRequests(residentId: string) {
  return findRequestsByResident(residentId);
}

export async function getAllRequests(filters?: {
  status?: RequestStatus;
  type?: RequestType;
}) {
  return findAllRequests(filters);
}

export async function getRequestStats(communityId?: string) {
  return countRequestsByStatus(communityId);
}
