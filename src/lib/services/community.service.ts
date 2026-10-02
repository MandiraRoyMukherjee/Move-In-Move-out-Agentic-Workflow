/**
 * Community service — business logic for community config retrieval.
 * Parses the JSON config string from the DB into a typed CommunityConfig.
 */

import {
  findCommunityById,
  findAllCommunities,
  parseCommunityConfig,
} from "@/lib/db/repositories/community.repository";
import type { CommunityConfig } from "@/types/community";

export async function getCommunityConfig(
  communityId: string
): Promise<CommunityConfig> {
  const community = await findCommunityById(communityId);
  if (!community) throw new Error(`Community not found: ${communityId}`);
  return parseCommunityConfig(community.config);
}

export async function getCommunityById(communityId: string) {
  const community = await findCommunityById(communityId);
  if (!community) throw new Error(`Community not found: ${communityId}`);
  return {
    ...community,
    parsedConfig: parseCommunityConfig(community.config),
  };
}

export async function listCommunities() {
  const communities = await findAllCommunities();
  return communities.map((c) => ({
    ...c,
    parsedConfig: parseCommunityConfig(c.config),
  }));
}
