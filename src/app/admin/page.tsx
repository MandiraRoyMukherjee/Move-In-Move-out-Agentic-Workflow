/**
 * Admin dashboard — stats overview + quick access request table.
 */
import Link from "next/link";
import {
  findAllRequests,
  countRequestsByStatus,
} from "@/lib/db/repositories/request.repository";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime } from "@/lib/utils";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogIn,
  LogOut,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, recentRequests] = await Promise.all([
    countRequestsByStatus(),
    findAllRequests(),
  ]);

  const pendingRequests = recentRequests.filter((r) =>
    ["SUBMITTED", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"].includes(
      r.status
    )
  );

  const moveInCount = recentRequests.filter(
    (r) => r.type === "MOVE_IN"
  ).length;
  const moveOutCount = recentRequests.filter(
    (r) => r.type === "MOVE_OUT"
  ).length;

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Green Valley Apartments · Move request management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Total Requests"
          value={stats.total}
          icon={<ClipboardList className="w-5 h-5" />}
          accent="blue"
        />
        <StatCard
          label="Under Review"
          value={stats.underReview}
          icon={<Clock className="w-5 h-5" />}
          accent="yellow"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={<CheckCircle className="w-5 h-5" />}
          accent="green"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={<XCircle className="w-5 h-5" />}
          accent="red"
        />
        <StatCard
          label="Needs Info"
          value={stats.moreInfo}
          icon={<AlertCircle className="w-5 h-5" />}
          accent="orange"
        />
        <StatCard
          label="Move-In / Out"
          value={`${moveInCount} / ${moveOutCount}`}
          icon={<LogIn className="w-5 h-5" />}
          accent="purple"
        />
      </div>

      {/* Pending requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Pending Review ({pendingRequests.length})
          </CardTitle>
          <Link
            href="/admin/requests"
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {pendingRequests.length === 0 ? (
            <EmptyState
              icon={<CheckCircle />}
              title="All caught up!"
              description="No requests pending review."
            />
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-100">
                {pendingRequests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/admin/requests/${req.id}`}
                    className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge status={req.status} />
                        <StatusBadge status={req.type} />
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{req.resident?.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Apt {req.resident?.apartmentNumber} · {req.moveDate ? formatDate(req.moveDate) : "Date TBD"}
                      </p>
                      <p className="font-mono text-xs text-gray-400 mt-0.5">{req.requestNumber}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 ml-3" />
                  </Link>
                ))}
              </div>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Request</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Resident</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Move Date</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{req.requestNumber}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{req.resident?.name}</p>
                          <p className="text-xs text-gray-500">Apt {req.resident?.apartmentNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {req.type === "MOVE_IN" ? (
                              <LogIn className="w-3.5 h-3.5 text-teal-500" />
                            ) : (
                              <LogOut className="w-3.5 h-3.5 text-indigo-500" />
                            )}
                            <StatusBadge status={req.type} />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {req.moveDate ? formatDate(req.moveDate) : "—"}
                          {req.moveTime ? ` · ${formatTime(req.moveTime)}` : ""}
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/requests/${req.id}`} className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium text-sm">
                            Review <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
