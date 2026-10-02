/**
 * POST /api/admin/requests/[id]/view
 * Records an "admin opened request" audit log entry.
 * Called client-side when admin navigates to the request detail page.
 */
import { NextRequest, NextResponse } from "next/server";
import { findRequestById } from "@/lib/db/repositories/request.repository";
import { createAuditLog } from "@/lib/db/repositories/audit.repository";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const request = await findRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await createAuditLog({
      requestId: id,
      actorType: "ADMIN",
      actorId: "admin",
      action: "ADMIN_VIEWED_REQUEST",
      details: { status: request.status },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/requests/[id]/view]", err);
    return NextResponse.json({ error: "Failed to log view" }, { status: 500 });
  }
}
