/**
 * Stat card — numeric metric display for dashboards.
 */
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accent?: "blue" | "yellow" | "green" | "red" | "orange" | "purple";
  className?: string;
}

const ACCENTS = {
  blue: "text-blue-600 bg-blue-50",
  yellow: "text-yellow-600 bg-yellow-50",
  green: "text-green-600 bg-green-50",
  red: "text-red-600 bg-red-50",
  orange: "text-orange-600 bg-orange-50",
  purple: "text-purple-600 bg-purple-50",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "blue",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
            ACCENTS[accent]
          )}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
