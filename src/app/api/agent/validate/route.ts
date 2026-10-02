/**
 * POST /api/agent/validate
 *
 * Server-side deterministic validation of a partial request.
 * Used by client to check validity before submission.
 *
 * Body: { type, communityId, data }
 * Returns: { valid, missingFields, errors, suggestedAlternative }
 */
import { NextRequest, NextResponse } from "next/server";
import {
  detectMissingFields,
  validateAgainstCommunityRules,
  type MoveRequestData,
} from "@/lib/validation/request.validation";
import { getCommunityConfig } from "@/lib/services/community.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, communityId, data } = body as {
      type: "MOVE_IN" | "MOVE_OUT";
      communityId: string;
      data: Partial<MoveRequestData>;
    };

    if (!["MOVE_IN", "MOVE_OUT"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!communityId) {
      return NextResponse.json(
        { error: "communityId is required" },
        { status: 400 }
      );
    }

    const config = await getCommunityConfig(communityId);
    const moveConfig = type === "MOVE_IN" ? config.moveIn : config.moveOut;
    const missingFields = detectMissingFields(data, type);
    const validation = validateAgainstCommunityRules(data, moveConfig, type);

    return NextResponse.json({
      valid: validation.valid && missingFields.length === 0,
      missingFields,
      errors: validation.errors,
      warnings: validation.warnings,
      suggestedAlternative: validation.suggestedAlternative ?? null,
    });
  } catch (err) {
    console.error("[POST /api/agent/validate]", err);
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 500 }
    );
  }
}
