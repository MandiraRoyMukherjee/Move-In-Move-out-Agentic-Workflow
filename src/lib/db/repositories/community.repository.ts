/**
 * Community repository — thin wrapper over Prisma for community DB operations.
 * Business logic lives in the service layer, not here.
 */

import { prisma } from "@/lib/db/prisma";
import type { CommunityConfig } from "@/types/community";

export async function findAllCommunities() {
  return prisma.community.findMany({ orderBy: { name: "asc" } });
}

export async function findCommunityById(id: string) {
  return prisma.community.findUnique({ where: { id } });
}

export async function findCommunityWithResidents(id: string) {
  return prisma.community.findUnique({
    where: { id },
    include: { residents: true },
  });
}

export async function createCommunity(data: {
  name: string;
  config: CommunityConfig;
}) {
  return prisma.community.create({
    data: {
      name: data.name,
      config: JSON.stringify(data.config),
    },
  });
}

export function parseCommunityConfig(configJson: string): CommunityConfig {
  try {
    return JSON.parse(configJson) as CommunityConfig;
  } catch {
    throw new Error("Invalid community config JSON");
  }
}
