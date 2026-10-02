/**
 * GET /api/requests — list requests (with optional filters)
 */
import { NextRequest, NextResponse } from "next/server";
import { findAllRequests } from "@/lib/db/repositories/request.repository";
import type { RequestStatus, RequestType } from "@/types/request";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") as RequestStatus | null;
    const type = searchParams.get("type") as RequestType | null;

    const requests = await findAllRequests({
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    });

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("[GET /api/requests]", err);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
