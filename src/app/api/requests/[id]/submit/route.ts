/**
 * Request submit API — POST /api/requests/[id]/submit
 *
 * Validates ownership, transitions DRAFT → SUBMITTED → UNDER_REVIEW,
 * creates audit logs. The LLM never calls this — the resident clicks
 * "Confirm & Submit" which triggers this endpoint.
 */
import { NextRequest, NextResponse } from "next/server";
import { submitRequest } from "@/lib/services/request.service";
import { findRequestById } from "@/lib/db/repositories/request.repository";
import { detectMissingFields } from "@/lib/validation/request.validation";
import type { MoveRequestData } from "@/lib/validation/request.validation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { residentId } = body as { residentId?: string };

    if (!residentId) {
      return NextResponse.json(
        { error: "residentId is required" },
        { status: 400 }
      );
    }

    // Load request and validate ownership
    const request = await findRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (request.residentId !== residentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (request.status !== "DRAFT") {
      return NextResponse.json(
        {
          error: `Cannot submit a request with status: ${request.status}`,
        },
        { status: 409 }
      );
    }

    // Server-side completeness check — never trust client-side state
    const data: Partial<MoveRequestData> = {
      moveDate: request.moveDate ?? undefined,
      moveTime: request.moveTime ?? undefined,
      apartmentNumber: request.apartmentNumber ?? undefined,
      movingCompany: request.movingCompany ?? undefined,
      vehicleDetails: request.vehicleDetails ?? undefined,
    };

    const missing = detectMissingFields(
      data,
      request.type as "MOVE_IN" | "MOVE_OUT"
    );
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Request is incomplete",
          missingFields: missing,
        },
        { status: 422 }
      );
    }

    // Transition status
    const submitted = await submitRequest(id, residentId);

    return NextResponse.json({
      success: true,
      request: {
        id: submitted.id,
        requestNumber: submitted.requestNumber,
        status: submitted.status,
      },
    });
  } catch (err) {
    console.error("[/api/requests/[id]/submit] Error:", err);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
