/**
 * Badge — status badge component with colour-coded variants.
 */
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "draft"
  | "submitted"
  | "under_review"
  | "more_info"
  | "approved"
  | "rejected"
  | "completed"
  | "move_in"
  | "move_out";

const VARIANTS: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  more_info: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-purple-100 text-purple-700",
  move_in: "bg-teal-100 text-teal-700",
  move_out: "bg-indigo-100 text-indigo-700",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  MORE_INFORMATION_REQUIRED: "Info Required",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  MOVE_IN: "Move In",
  MOVE_OUT: "Move Out",
};

const STATUS_VARIANT: Record<string, Variant> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  MORE_INFORMATION_REQUIRED: "more_info",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
  MOVE_IN: "move_in",
  MOVE_OUT: "move_out",
};

interface BadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  const variant = STATUS_VARIANT[status] ?? "default";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {label}
    </span>
  );
}

interface CustomBadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: CustomBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
