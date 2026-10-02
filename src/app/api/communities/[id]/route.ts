/**
 * GET /api/communities/[id] — get single community with parsed config
 */
import { NextRequest, NextResponse } from "next/server";
import { findCommunityById, parseCommunityConfig } from "@/lib/db/repositories/community.repository";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const community = await findCommunityById(id);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }
    return NextResponse.json({
      community: {
        id: community.id,
        name: community.name,
        config: parseCommunityConfig(community.config),
        createdAt: community.createdAt,
      },
    });
  } catch (err) {
    console.error("[GET /api/communities/[id]]", err);
    return NextResponse.json(
      { error: "Failed to fetch community" },
      { status: 500 }
    );
  }
}
