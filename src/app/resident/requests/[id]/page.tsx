/**
 * Resident request detail — shows full request context + status timeline.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { findRequestById } from "@/lib/db/repositories/request.repository";
import { parseCommunityConfig } from "@/lib/db/repositories/community.repository";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline } from "@/components/ui/timeline";
import { ResubmitPanel } from "@/components/resident/resubmit-panel";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  AlertCircle,
  Calendar,
  Clock,
  Building2,
  Truck,
  Car,
  Bot,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResidentRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await findRequestById(id);
  if (!request) notFound();

  const communityConfig = request.community
    ? parseCommunityConfig(request.community.config)
    : null;

  const rules = communityConfig
    ? request.type === "MOVE_IN"
      ? communityConfig.moveIn
      : communityConfig.moveOut
    : null;

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <Link
        href="/resident/requests"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to requests
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">
              {request.type === "MOVE_IN" ? "Move-In" : "Move-Out"} Request
            </h1>
            <StatusBadge status={request.status} />
            <StatusBadge status={request.type} />
          </div>
          <p className="font-mono text-xs text-gray-500 mt-1">
            {request.requestNumber}
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Created {formatDateTime(request.createdAt)}
        </p>
      </div>

      {/* Resubmit panel — shown when admin requests more info */}
      {request.status === "MORE_INFORMATION_REQUIRED" && request.adminNotes && (
        <div className="mb-6">
          <ResubmitPanel
            requestId={request.id}
            residentId={request.residentId}
            adminMessage={request.adminNotes}
          />
        </div>
      )}

      {/* Approved banner */}
      {request.status === "APPROVED" && (
        <div className="mb-6 flex gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              Request Approved!
            </p>
            {request.adminNotes && (
              <p className="text-sm text-green-700 mt-1">
                &ldquo;{request.adminNotes}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Request details */}
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              icon={<Calendar className="w-4 h-4" />}
              label="Move Date"
              value={request.moveDate ? formatDate(request.moveDate) : "—"}
            />
            <DetailRow
              icon={<Clock className="w-4 h-4" />}
              label="Move Time"
              value={request.moveTime ? formatTime(request.moveTime) : "—"}
            />
            <DetailRow
              icon={<Building2 className="w-4 h-4" />}
              label="Apartment"
              value={request.apartmentNumber ?? "—"}
            />
            <DetailRow
              icon={<Truck className="w-4 h-4" />}
              label="Moving Company"
              value={request.movingCompany ?? "—"}
            />
            <DetailRow
              icon={<Car className="w-4 h-4" />}
              label="Vehicle"
              value={request.vehicleDetails ?? "—"}
            />
            {request.reason && (
              <DetailRow
                icon={<AlertCircle className="w-4 h-4" />}
                label="Reason"
                value={request.reason}
              />
            )}
          </CardContent>
        </Card>

        {/* Community rules */}
        {rules && (
          <Card>
            <CardHeader>
              <CardTitle>Community Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <RuleRow
                label="Allowed days"
                value={rules.allowedDays
                  .map((d) => d.slice(0, 3))
                  .join(", ")}
              />
              {"startTime" in rules && rules.startTime && (
                <RuleRow
                  label="Allowed hours"
                  value={`${formatTime(rules.startTime)} – ${formatTime(rules.endTime ?? "18:00")}`}
                />
              )}
              <RuleRow
                label="Notice period"
                value={`${rules.noticePeriodDays} day${rules.noticePeriodDays !== 1 ? "s" : ""}`}
              />
            </CardContent>
          </Card>
        )}

        {/* AI summary */}
        {request.agentSummary && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{request.agentSummary}</p>
              {request.agentRecommendation && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    AI Recommendation:
                  </span>
                  <StatusBadge status={request.agentRecommendation} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {request.auditLogs && request.auditLogs.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={request.auditLogs} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  );
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
