/**
 * Resident requests list — shows all requests for every resident
 * (demo mode). In production filtered by authenticated resident.
 */
import Link from "next/link";
import { findAllRequests } from "@/lib/db/repositories/request.repository";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime } from "@/lib/utils";
import { ClipboardList, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResidentRequestsPage() {
  const requests = await findAllRequests();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-purple-600" />
          My Requests
        </h1>
        <p className="text-gray-500 mt-1">
          Track the status of all your move requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <EmptyState
              icon={<ClipboardList />}
              title="No requests yet"
              description="Start a move-in or move-out request from the dashboard."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  href={`/resident/requests/${req.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-500">
                          {req.requestNumber}
                        </span>
                        <StatusBadge status={req.type} />
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {req.resident?.name} · Apt {req.apartmentNumber ?? req.resident?.apartmentNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {req.moveDate ? formatDate(req.moveDate) : "Date TBD"}
                        {req.moveTime ? ` at ${formatTime(req.moveTime)}` : ""}
                        {" · "}
                        Submitted {formatDate(req.createdAt)}
                      </p>
                      {req.adminNotes &&
                        req.status === "MORE_INFORMATION_REQUIRED" && (
                          <p className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 mt-1 inline-block">
                            Admin: &ldquo;{req.adminNotes}&rdquo;
                          </p>
                        )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 shrink-0 ml-4" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
