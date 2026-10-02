/**
 * Generate AI assessment button — shown when agentSummary is missing.
 * Calls /api/agent/summary and refreshes the page.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Bot, RefreshCw } from "lucide-react";

interface Props {
  requestId: string;
}

export function GenerateSummaryButton({ requestId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed");
      toast.success("AI assessment generated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      loading={loading}
      onClick={generate}
      className="mt-2 border-blue-200 text-blue-700 hover:bg-blue-50"
    >
      <Bot className="w-3.5 h-3.5" />
      {loading ? "Generating…" : "Generate AI Assessment"}
      {!loading && <RefreshCw className="w-3 h-3 opacity-60" />}
    </Button>
  );
}
