/**
 * MoveRequest repository — all DB operations for move requests.
 * Never update status directly from here; use the service layer which
 * validates transitions and creates audit logs.
 */

import { prisma } from "@/lib/db/prisma";
import type { RequestStatus, RequestType } from "@/types/request";

export async function findRequestById(id: string) {
  return prisma.moveRequest.findUnique({
    where: { id },
    include: {
      resident: true,
      community: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function findRequestByNumber(requestNumber: string) {
  return prisma.moveRequest.findUnique({
    where: { requestNumber },
    include: { resident: true, community: true },
  });
}

export async function findRequestsByResident(residentId: string) {
  return prisma.moveRequest.findMany({
    where: { residentId },
    include: { community: true, auditLogs: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function findRequestsByCommunity(
  communityId: string,
  filters?: {
    status?: RequestStatus;
    type?: RequestType;
  }
) {
  return prisma.moveRequest.findMany({
    where: {
      communityId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
    },
    include: {
      resident: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findAllRequests(filters?: {
  status?: RequestStatus;
  type?: RequestType;
}) {
  return prisma.moveRequest.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
    },
    include: {
      resident: true,
      community: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMoveRequest(data: {
  requestNumber: string;
  type: RequestType;
  residentId: string;
  communityId: string;
  status?: RequestStatus;
  moveDate?: string;
  moveTime?: string;
  apartmentNumber?: string;
  movingCompany?: string;
  vehicleDetails?: string;
  reason?: string;
  conversationState?: string;
}) {
  return prisma.moveRequest.create({
    data: {
      ...data,
      status: data.status ?? "DRAFT",
    },
    include: { resident: true, community: true },
  });
}

export async function updateMoveRequest(
  id: string,
  data: Partial<{
    status: RequestStatus;
    moveDate: string;
    moveTime: string;
    apartmentNumber: string;
    movingCompany: string;
    vehicleDetails: string;
    documents: string;
    reason: string;
    agentSummary: string;
    agentRecommendation: string;
    adminNotes: string;
    conversationState: string;
  }>
) {
  return prisma.moveRequest.update({
    where: { id },
    data,
    include: { resident: true, community: true },
  });
}

export async function countRequestsByStatus(communityId?: string) {
  const where = communityId ? { communityId } : {};
  const [total, submitted, underReview, moreInfo, approved, rejected] =
    await Promise.all([
      prisma.moveRequest.count({ where }),
      prisma.moveRequest.count({ where: { ...where, status: "SUBMITTED" } }),
      prisma.moveRequest.count({ where: { ...where, status: "UNDER_REVIEW" } }),
      prisma.moveRequest.count({
        where: { ...where, status: "MORE_INFORMATION_REQUIRED" },
      }),
      prisma.moveRequest.count({ where: { ...where, status: "APPROVED" } }),
      prisma.moveRequest.count({ where: { ...where, status: "REJECTED" } }),
    ]);

  return { total, submitted, underReview, moreInfo, approved, rejected };
}
