/**
 * Admin action API — POST /api/admin/requests/[id]/action
 *
 * Actions: approve | reject | more-info
 * Full implementation — replaces the Phase 4 stub.
 *
 * Security: validates that transition is allowed server-side.
 * The LLM can never call this endpoint — only admin clicking a button triggers it.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  approveMoveRequest,
  rejectMoveRequest,
  requestMoreInformation,
} from "@/lib/services/agent.service";
import { findRequestById } from "@/lib/db/repositories/request.repository";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { action, notes } = body as { action?: string; notes?: string };

    if (!action || !["approve", "reject", "more-info"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be: approve | reject | more-info" },
        { status: 400 }
      );
    }

    // Load request and validate it can be acted upon
    const request = await findRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const actableStatuses = ["UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"];
    if (!actableStatuses.includes(request.status)) {
      return NextResponse.json(
        {
          error: `Cannot perform action on a request with status: ${request.status}`,
        },
        { status: 409 }
      );
    }

    // Demo: admin ID is "admin" — production would use real auth session
    const adminId = "admin";

    let updated;
    if (action === "approve") {
      updated = await approveMoveRequest(id, adminId, notes);
    } else if (action === "reject") {
      if (!notes?.trim()) {
        return NextResponse.json(
          { error: "A reason is required when rejecting a request." },
          { status: 400 }
        );
      }
      updated = await rejectMoveRequest(id, adminId, notes);
    } else {
      // more-info
      if (!notes?.trim()) {
        return NextResponse.json(
          { error: "A message is required when requesting more information." },
          { status: 400 }
        );
      }
      updated = await requestMoreInformation(id, adminId, notes);
    }

    return NextResponse.json({
      success: true,
      request: { id: updated.id, status: updated.status },
    });
  } catch (err) {
    console.error("[POST /api/admin/requests/[id]/action]", err);
    const message =
      err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
