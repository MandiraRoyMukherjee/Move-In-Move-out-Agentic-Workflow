/**
 * Agent chat API — POST /api/agent/chat
 *
 * Request body:
 *   userMessage   string
 *   type          "MOVE_IN" | "MOVE_OUT"
 *   residentId    string
 *   communityId   string
 *   state         ConversationState (client sends current state each turn)
 *   requestId?    string  (existing draft request ID, if already created)
 *
 * Response:
 *   agentMessage  string
 *   updatedState  ConversationState
 *   requestId?    string
 *   isComplete    boolean
 *   readyToSubmit boolean
 *   validationErrors string[]
 *   suggestedAlternative? string
 */

import { NextRequest, NextResponse } from "next/server";
import { orchestrate } from "@/lib/agent/orchestrator";
import { findResidentById } from "@/lib/db/repositories/resident.repository";
import { findCommunityById } from "@/lib/db/repositories/community.repository";
import {
  createDraftRequest,
  updateRequestData,
} from "@/lib/services/request.service";
import type { ConversationState } from "@/types/agent";
import { createAuditLog } from "@/lib/db/repositories/audit.repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userMessage,
      type,
      residentId,
      state: clientState,
      requestId: existingRequestId,
    } = body as {
      userMessage: string;
      type: "MOVE_IN" | "MOVE_OUT";
      residentId: string;
      state: ConversationState;
      requestId?: string;
    };

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!userMessage?.trim()) {
      return NextResponse.json(
        { error: "userMessage is required" },
        { status: 400 }
      );
    }
    if (!["MOVE_IN", "MOVE_OUT"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!residentId) {
      return NextResponse.json(
        { error: "residentId is required" },
        { status: 400 }
      );
    }

    // ── Load resident + community ────────────────────────────────────────────
    const resident = await findResidentById(residentId);
    if (!resident) {
      return NextResponse.json(
        { error: "Resident not found" },
        { status: 404 }
      );
    }

    const community = await findCommunityById(resident.communityId);
    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // ── Ensure a draft request exists ────────────────────────────────────────
    let requestId = existingRequestId;
    if (!requestId) {
      const draft = await createDraftRequest({
        type,
        residentId,
        communityId: resident.communityId,
        apartmentNumber: resident.apartmentNumber,
      });
      requestId = draft.id;
    }

    // ── Run agent orchestration ──────────────────────────────────────────────
    const existingState: ConversationState = clientState ?? {
      requestId,
      requestType: type,
      collectedData: { apartmentNumber: resident.apartmentNumber },
      messages: [],
      isComplete: false,
      readyToSubmit: false,
    };

    // Pre-populate apartment number from resident profile if not set
    if (!existingState.collectedData.apartmentNumber) {
      existingState.collectedData.apartmentNumber = resident.apartmentNumber;
    }

    const result = await orchestrate({
      userMessage,
      type,
      residentId,
      communityId: resident.communityId,
      residentName: resident.name,
      communityName: community.name,
      existingState,
    });

    // ── Persist collected data to draft request ──────────────────────────────
    const { collectedData } = result.updatedState;
    await updateRequestData(
      requestId,
      {
        ...(collectedData.moveDate ? { moveDate: collectedData.moveDate } : {}),
        ...(collectedData.moveTime ? { moveTime: collectedData.moveTime } : {}),
        ...(collectedData.apartmentNumber
          ? { apartmentNumber: collectedData.apartmentNumber }
          : {}),
        ...(collectedData.movingCompany
          ? { movingCompany: collectedData.movingCompany }
          : {}),
        ...(collectedData.vehicleDetails
          ? { vehicleDetails: collectedData.vehicleDetails }
          : {}),
        ...(collectedData.reason ? { reason: collectedData.reason } : {}),
        conversationState: JSON.stringify(result.updatedState),
        ...(result.agentSummary ? { agentSummary: result.agentSummary } : {}),
        ...(result.agentRecommendation
          ? { agentRecommendation: result.agentRecommendation }
          : {}),
      },
      residentId
    );

    // Audit: log agent validation when complete
    if (result.response.isComplete) {
      await createAuditLog({
        requestId,
        actorType: "AGENT",
        actorId: "agent",
        action: "AGENT_VALIDATED",
        details: {
          result: "VALID",
          summary: result.agentSummary?.slice(0, 100),
        },
      });
    }

    // ── Return response ──────────────────────────────────────────────────────
    return NextResponse.json({
      agentMessage: result.response.message,
      updatedState: {
        ...result.updatedState,
        requestId,
      },
      requestId,
      isComplete: result.response.isComplete,
      readyToSubmit: result.response.readyToSubmit ?? false,
      validationErrors: result.response.validationErrors,
      suggestedAlternative: result.response.suggestedAlternative ?? null,
    });
  } catch (err) {
    console.error("[/api/agent/chat] Error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        agentMessage:
          "Something went wrong on our end. Your progress is saved — please try again.",
      },
      { status: 500 }
    );
  }
}
