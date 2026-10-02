/**
 * GET /api/requests/[id] — fetch single request (resident view)
 * PATCH /api/requests/[id] — update draft request data
 */
import { NextRequest, NextResponse } from "next/server";
import { findRequestById } from "@/lib/db/repositories/request.repository";
import { updateRequestData } from "@/lib/services/request.service";
import type { MoveRequestData } from "@/lib/validation/request.validation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const request = await findRequestById(id);
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  return NextResponse.json({ request });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { residentId, data } = body as {
      residentId: string;
      data: Partial<MoveRequestData>;
    };

    if (!residentId) {
      return NextResponse.json(
        { error: "residentId is required" },
        { status: 400 }
      );
    }

    const existing = await findRequestById(id);
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (existing.residentId !== residentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await updateRequestData(id, data, residentId);
    return NextResponse.json({ request: updated });
  } catch (err) {
    console.error("[PATCH /api/requests/[id]]", err);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
