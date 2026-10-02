/**
 * Resubmit panel — shown on resident request detail when status is
 * MORE_INFORMATION_REQUIRED. Lets resident provide the requested info
 * and resubmit to UNDER_REVIEW.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, AlertCircle } from "lucide-react";

interface Props {
  requestId: string;
  residentId: string;
  adminMessage: string;
}

export function ResubmitPanel({ requestId, residentId, adminMessage }: Props) {
  const router = useRouter();
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResubmit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ residentId, additionalInfo: info.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed");
      toast.success("Request resubmitted for review.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-orange-200">
      <CardHeader className="bg-orange-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="w-4 h-4" />
          Admin needs more information
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
          &ldquo;{adminMessage}&rdquo;
        </div>
        <textarea
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          rows={3}
          placeholder="Provide the requested information here…"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
        <Button
          onClick={handleResubmit}
          loading={loading}
          disabled={!info.trim()}
          className="w-full bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-500"
        >
          <Send className="w-4 h-4" />
          Submit Additional Information
        </Button>
      </CardContent>
    </Card>
  );
}
