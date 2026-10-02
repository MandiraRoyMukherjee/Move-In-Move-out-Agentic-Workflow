/**
 * GET /api/admin/requests/[id]/audit — fetch audit log for a request
 */
import { NextRequest, NextResponse } from "next/server";
import { findAuditLogsByRequest } from "@/lib/db/repositories/audit.repository";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const logs = await findAuditLogsByRequest(id);
    return NextResponse.json({ logs });
  } catch (err) {
    console.error("[GET /api/admin/requests/[id]/audit]", err);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
