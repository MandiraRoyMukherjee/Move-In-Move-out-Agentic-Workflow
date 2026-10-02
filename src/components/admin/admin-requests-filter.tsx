/**
 * Admin requests filter — client-side filter bar using URL search params.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Info Required", value: "MORE_INFORMATION_REQUIRED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Submitted", value: "SUBMITTED" },
];

const TYPE_FILTERS = [
  { label: "All Types", value: "" },
  { label: "Move In", value: "MOVE_IN" },
  { label: "Move Out", value: "MOVE_OUT" },
];

interface Props {
  currentStatus?: string;
  currentType?: string;
}

export function AdminRequestsFilter({ currentStatus, currentType }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/requests?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Type filter */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
        {TYPE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => updateFilter("type", value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              (currentType ?? "") === value
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => updateFilter("status", value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              (currentStatus ?? "") === value
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
