/**
 * GET /api/communities — list all communities
 * GET /api/communities/[id] — get community config
 */
import { NextResponse } from "next/server";
import { findAllCommunities, parseCommunityConfig } from "@/lib/db/repositories/community.repository";

export async function GET() {
  try {
    const communities = await findAllCommunities();
    return NextResponse.json({
      communities: communities.map((c) => ({
        id: c.id,
        name: c.name,
        config: parseCommunityConfig(c.config),
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error("[GET /api/communities]", err);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 }
    );
  }
}
