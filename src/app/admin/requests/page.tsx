/**
 * Admin requests list — filterable table of all move requests.
 */
import Link from "next/link";
import { findAllRequests } from "@/lib/db/repositories/request.repository";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { ClipboardList, ArrowRight, LogIn, LogOut } from "lucide-react";
import type { RequestStatus, RequestType } from "@/types/request";
import { AdminRequestsFilter } from "@/components/admin/admin-requests-filter";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    status?: string;
    type?: string;
  }>;
}

export default async function AdminRequestsPage({ searchParams }: Props) {
  const { status, type } = await searchParams;

  const requests = await findAllRequests({
    status: status as RequestStatus | undefined,
    type: type as RequestType | undefined,
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-5 sm:mb-6 flex items-start justify-between flex-wrap gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            All Requests
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {requests.length} request{requests.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <AdminRequestsFilter currentStatus={status} currentType={type} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <EmptyState
              icon={<ClipboardList />}
              title="No requests match this filter"
              description="Try adjusting the filters above."
            />
          ) : (
            <>
              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-100">
                {requests.map((req) => (
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
                        Apt {req.apartmentNumber ?? req.resident?.apartmentNumber ?? "—"} · {req.moveDate ? formatDate(req.moveDate) : "Date TBD"}
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
                      {["Request ID","Resident","Apartment","Type","Move Date","Status","Created",""].map((h) => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{req.requestNumber}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{req.resident?.name}</p>
                          <p className="text-xs text-gray-500">{req.resident?.email}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{req.apartmentNumber ?? req.resident?.apartmentNumber ?? "—"}</td>
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
                        <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                          {req.moveDate ? formatDate(req.moveDate) : "—"}
                          {req.moveTime ? ` · ${formatTime(req.moveTime)}` : ""}
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                        <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(req.createdAt)}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link href={`/admin/requests/${req.id}`} className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium">
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
