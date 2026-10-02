/**
 * Timeline — visual audit log / status history component.
 */
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  action: string;
  actorType: string;
  actorId: string;
  details?: string | null;
  createdAt: Date | string;
}

const ACTION_LABELS: Record<string, string> = {
  REQUEST_CREATED: "Request created",
  REQUEST_UPDATED: "Request updated",
  AGENT_VALIDATED: "Agent validated request",
  STATUS_CHANGED_TO_SUBMITTED: "Submitted for review",
  STATUS_CHANGED_TO_UNDER_REVIEW: "Under review",
  STATUS_CHANGED_TO_APPROVED: "Approved",
  STATUS_CHANGED_TO_REJECTED: "Rejected",
  STATUS_CHANGED_TO_MORE_INFORMATION_REQUIRED: "More information requested",
  STATUS_CHANGED_TO_COMPLETED: "Completed",
  MORE_INFORMATION_REQUESTED: "Admin requested more information",
  AGENT_SUMMARY_GENERATED: "AI summary generated",
};

const ACTION_COLORS: Record<string, string> = {
  REQUEST_CREATED: "bg-blue-500",
  STATUS_CHANGED_TO_SUBMITTED: "bg-blue-500",
  STATUS_CHANGED_TO_UNDER_REVIEW: "bg-yellow-500",
  STATUS_CHANGED_TO_APPROVED: "bg-green-500",
  STATUS_CHANGED_TO_REJECTED: "bg-red-500",
  STATUS_CHANGED_TO_MORE_INFORMATION_REQUIRED: "bg-orange-500",
  STATUS_CHANGED_TO_COMPLETED: "bg-purple-500",
  MORE_INFORMATION_REQUESTED: "bg-orange-400",
  AGENT_VALIDATED: "bg-indigo-400",
  AGENT_SUMMARY_GENERATED: "bg-indigo-400",
  REQUEST_UPDATED: "bg-gray-400",
};

const ACTOR_LABELS: Record<string, string> = {
  RESIDENT: "Resident",
  ADMIN: "Admin",
  AGENT: "AI Agent",
  SYSTEM: "System",
};

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <ol className={cn("relative border-l border-gray-200 ml-3", className)}>
      {events.map((event, idx) => {
        const label = ACTION_LABELS[event.action] ?? event.action;
        const color = ACTION_COLORS[event.action] ?? "bg-gray-400";
        const actor = ACTOR_LABELS[event.actorType] ?? event.actorType;
        const isLast = idx === events.length - 1;

        let detailObj: Record<string, unknown> | null = null;
        try {
          if (event.details) detailObj = JSON.parse(event.details);
        } catch {
          /* not JSON — ignore */
        }

        return (
          <li key={event.id} className={cn("ml-4", !isLast && "mb-6")}>
            <span
              className={cn(
                "absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white",
                color
              )}
            />
            <p className="text-sm font-medium text-gray-900">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {actor} · {formatDateTime(event.createdAt)}
            </p>
            {detailObj?.message != null && (
              <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 border border-gray-100">
                &quot;{String(detailObj.message)}&quot;
              </p>
            )}
            {detailObj?.notes != null && (
              <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 border border-gray-100">
                &quot;{String(detailObj.notes)}&quot;
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
