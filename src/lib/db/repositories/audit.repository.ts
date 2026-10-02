/**
 * AuditLog repository — create and query audit trail entries.
 */

import { prisma } from "@/lib/db/prisma";
import type { ActorType } from "@/types/request";

export async function createAuditLog(data: {
  requestId: string;
  actorType: ActorType;
  actorId: string;
  action: string;
  details?: Record<string, unknown> | string;
}) {
  const details =
    typeof data.details === "string"
      ? data.details
      : data.details
        ? JSON.stringify(data.details)
        : undefined;

  return prisma.auditLog.create({
    data: {
      requestId: data.requestId,
      actorType: data.actorType,
      actorId: data.actorId,
      action: data.action,
      details,
    },
  });
}

export async function findAuditLogsByRequest(requestId: string) {
  return prisma.auditLog.findMany({
    where: { requestId },
    orderBy: { createdAt: "asc" },
  });
}
