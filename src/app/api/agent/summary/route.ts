/**
 * POST /api/agent/summary
 * Generates (or regenerates) the AI summary and recommendation for a request.
 * Called by admin review page when summary is missing or stale.
 */
import { NextRequest, NextResponse } from "next/server";
import { generateAdminRecommendation } from "@/lib/services/agent.service";
import { updateMoveRequest } from "@/lib/db/repositories/request.repository";
import { createAuditLog } from "@/lib/db/repositories/audit.repository";
import { findRequestById } from "@/lib/db/repositories/request.repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId } = body as { requestId?: string };

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    const request = await findRequestById(requestId);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const { summary, recommendation } =
      await generateAdminRecommendation(requestId);

    await updateMoveRequest(requestId, {
      agentSummary: summary,
      agentRecommendation: recommendation,
    });

    await createAuditLog({
      requestId,
      actorType: "AGENT",
      actorId: "agent",
      action: "AGENT_SUMMARY_GENERATED",
      details: { recommendation },
    });

    return NextResponse.json({ summary, recommendation });
  } catch (err) {
    console.error("[POST /api/agent/summary]", err);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
