/**
 * POST /api/requests/[id]/resubmit
 *
 * Resident resubmits a request that was in MORE_INFORMATION_REQUIRED status.
 * Transitions: MORE_INFORMATION_REQUIRED → UNDER_REVIEW
 */
import { NextRequest, NextResponse } from "next/server";
import { findRequestById } from "@/lib/db/repositories/request.repository";
import { transitionStatus } from "@/lib/services/request.service";
import { createAuditLog } from "@/lib/db/repositories/audit.repository";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { residentId, additionalInfo } = body as {
      residentId?: string;
      additionalInfo?: string;
    };

    if (!residentId) {
      return NextResponse.json(
        { error: "residentId is required" },
        { status: 400 }
      );
    }

    const request = await findRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (request.residentId !== residentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (request.status !== "MORE_INFORMATION_REQUIRED") {
      return NextResponse.json(
        { error: `Cannot resubmit a request with status: ${request.status}` },
        { status: 409 }
      );
    }

    if (additionalInfo) {
      await createAuditLog({
        requestId: id,
        actorType: "RESIDENT",
        actorId: residentId,
        action: "RESIDENT_PROVIDED_INFORMATION",
        details: { info: additionalInfo },
      });
    }

    const updated = await transitionStatus(
      id,
      "UNDER_REVIEW",
      "RESIDENT",
      residentId
    );

    return NextResponse.json({
      success: true,
      request: { id: updated.id, status: updated.status },
    });
  } catch (err) {
    console.error("[POST /api/requests/[id]/resubmit]", err);
    return NextResponse.json(
      { error: "Failed to resubmit request" },
      { status: 500 }
    );
  }
}
