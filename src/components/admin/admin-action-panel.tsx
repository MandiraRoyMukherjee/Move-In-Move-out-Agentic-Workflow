/**
 * Admin action panel — approve / reject / request-more-info.
 *
 * The actual API calls are wired in Phase 15.
 * This phase provides the complete UI shell with proper states.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, MessageSquare, Lock } from "lucide-react";
import type { RequestStatus } from "@/types/request";

interface Props {
  requestId: string;
  requestStatus: string;
  canAct: boolean;
  existingNotes: string;
}

export function AdminActionPanel({
  requestId,
  requestStatus,
  canAct,
  existingNotes,
}: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(existingNotes);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: "approve" | "reject" | "more-info") {
    if (action === "more-info" && !notes.trim()) {
      toast.error("Please enter a message for the resident.");
      return;
    }

    setLoading(action);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Action failed");
      }

      const messages: Record<string, string> = {
        approve: "Request approved successfully.",
        reject: "Request rejected.",
        "more-info": "Information request sent to resident.",
      };
      toast.success(messages[action]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  const statusLabel: Record<string, string> = {
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Admin Actions
          {!canAct && <Lock className="w-3.5 h-3.5 text-gray-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canAct ? (
          <div className="text-sm text-gray-500 italic">
            This request is{" "}
            <strong>
              {statusLabel[requestStatus as RequestStatus] ?? requestStatus}
            </strong>{" "}
            — no further action required.
          </div>
        ) : (
          <>
            {/* Notes textarea */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Admin notes / message to resident
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add a note or message for the resident…"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full bg-green-600 hover:bg-green-700 focus-visible:ring-green-500"
                loading={loading === "approve"}
                disabled={loading !== null}
                onClick={() => handleAction("approve")}
              >
                <CheckCircle className="w-4 h-4" />
                Approve Request
              </Button>

              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                loading={loading === "more-info"}
                disabled={loading !== null}
                onClick={() => handleAction("more-info")}
              >
                <MessageSquare className="w-4 h-4" />
                Request More Information
              </Button>

              <Button
                variant="danger"
                className="w-full"
                loading={loading === "reject"}
                disabled={loading !== null}
                onClick={() => handleAction("reject")}
              >
                <XCircle className="w-4 h-4" />
                Reject Request
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              All actions are logged and cannot be undone.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
