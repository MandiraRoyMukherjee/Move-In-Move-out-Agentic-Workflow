/**
 * Admin action API — POST /api/admin/requests/[id]/action
 *
 * Actions: approve | reject | more-info
 *
 * Full implementation in Phase 15. This stub returns a clear error
 * so the UI can be tested without the agent phases complete.
 */
import { NextRequest, NextResponse } from "next/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action, notes } = body as { action?: string; notes?: string };

  if (!action || !["approve", "reject", "more-info"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be: approve | reject | more-info" },
      { status: 400 }
    );
  }

  // Phase 15 will replace this stub with real service calls.
  // For now, return a clear message so the UI flow can be verified.
  return NextResponse.json(
    {
      message: `Admin action '${action}' received for request ${id}. Full implementation in Phase 15.`,
      requestId: id,
      action,
      notes,
    },
    { status: 200 }
  );
}
