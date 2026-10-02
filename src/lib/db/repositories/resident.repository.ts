/**
 * Resident repository — thin wrapper over Prisma for resident DB operations.
 */

import { prisma } from "@/lib/db/prisma";

export async function findResidentById(id: string) {
  return prisma.resident.findUnique({
    where: { id },
    include: { community: true },
  });
}

export async function findResidentByEmail(email: string) {
  return prisma.resident.findUnique({
    where: { email },
    include: { community: true },
  });
}

export async function findResidentsByCommunity(communityId: string) {
  return prisma.resident.findMany({
    where: { communityId },
    orderBy: { name: "asc" },
  });
}

export async function createResident(data: {
  name: string;
  email: string;
  phone?: string;
  apartmentNumber: string;
  communityId: string;
}) {
  return prisma.resident.create({ data });
}
