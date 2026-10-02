/**
 * Admin request detail — full review page.
 *
 * Shows:
 *  - Resident info
 *  - Request details
 *  - Community rules
 *  - AI assessment (summary + recommendation)
 *  - Admin action panel (approve / reject / request-more-info)
 *  - Audit timeline
 *
 * Admin actions are rendered as a client component (Phase 15 will wire
 * the actual API calls; here the UI shell is complete).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { findRequestById } from "@/lib/db/repositories/request.repository";
import { parseCommunityConfig } from "@/lib/db/repositories/community.repository";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline } from "@/components/ui/timeline";
import { AdminActionPanel } from "@/components/admin/admin-action-panel";
import { GenerateSummaryButton } from "@/components/admin/generate-summary-button";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Building2,
  Truck,
  Car,
  FileText,
  Bot,
  ShieldCheck,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminRequestDetailPage({ params }: Props) {
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

  const canAct = ["UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"].includes(
    request.status
  );

  // Extract the most recent resident-provided additional info from the audit log
  const residentInfoLog = request.auditLogs
    ?.filter((l) => l.action === "RESIDENT_PROVIDED_INFORMATION")
    .at(-1);
  const residentAdditionalInfo = residentInfoLog?.details
    ? (() => {
        try {
          const parsed = JSON.parse(residentInfoLog.details as string);
          return typeof parsed?.info === "string" ? parsed.info : null;
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      {/* Back */}
      <Link
        href="/admin/requests"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to requests
      </Link>

      {/* Header */}
      <div className="mb-5 sm:mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
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

      {/* Resident additional info banner */}
      {residentAdditionalInfo && (
        <div className="mb-5 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <MessageCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-0.5">
              Resident provided additional information
            </p>
            <p className="text-sm text-blue-700 whitespace-pre-wrap">
              {residentAdditionalInfo}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Left column — context */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Resident */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                Resident
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <InfoItem label="Name" value={request.resident?.name ?? "—"} />
              <InfoItem
                label="Email"
                value={request.resident?.email ?? "—"}
              />
              <InfoItem
                label="Phone"
                value={request.resident?.phone ?? "—"}
              />
              <InfoItem
                label="Apartment"
                value={request.resident?.apartmentNumber ?? "—"}
              />
            </CardContent>
          </Card>

          {/* Request details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <InfoItemIcon
                icon={<Calendar className="w-4 h-4" />}
                label="Move Date"
                value={request.moveDate ? formatDate(request.moveDate) : "—"}
              />
              <InfoItemIcon
                icon={<Clock className="w-4 h-4" />}
                label="Move Time"
                value={
                  request.moveTime ? formatTime(request.moveTime) : "—"
                }
              />
              <InfoItemIcon
                icon={<Building2 className="w-4 h-4" />}
                label="Apartment"
                value={request.apartmentNumber ?? "—"}
              />
              <InfoItemIcon
                icon={<Truck className="w-4 h-4" />}
                label="Moving Company"
                value={request.movingCompany ?? "—"}
              />
              <InfoItemIcon
                icon={<Car className="w-4 h-4" />}
                label="Vehicle"
                value={request.vehicleDetails ?? "—"}
              />
              {request.reason && (
                <InfoItemIcon
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
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-500" />
                  Community Rules —{" "}
                  {request.type === "MOVE_IN" ? "Move-In" : "Move-Out"}
                </CardTitle>
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
                <RuleRow
                  label="Community"
                  value={request.community?.name ?? "—"}
                />
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {request.auditLogs && request.auditLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={request.auditLogs} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — AI assessment + actions */}
        <div className="space-y-4 sm:space-y-5">
          {/* AI Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                AI Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.agentSummary ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Summary
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {request.agentSummary}
                    </p>
                  </div>
                  {request.agentRecommendation && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Recommendation
                      </p>
                      <StatusBadge status={request.agentRecommendation} />
                      <p className="text-xs text-gray-400 mt-2 italic">
                        This is an AI-generated suggestion. The final decision
                        rests with the administrator.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 italic mb-2">
                    No AI assessment yet.
                  </p>
                  <GenerateSummaryButton requestId={request.id} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin actions */}
          <AdminActionPanel
            requestId={request.id}
            requestStatus={request.status}
            canAct={canAct}
            existingNotes={request.adminNotes ?? ""}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function InfoItemIcon({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
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
