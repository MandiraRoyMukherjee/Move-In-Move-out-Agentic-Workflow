/**
 * Admin community page — view community configuration and rules.
 */
import { findAllCommunities } from "@/lib/db/repositories/community.repository";
import { parseCommunityConfig } from "@/lib/db/repositories/community.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { Users, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage() {
  const communities = await findAllCommunities();

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          Community Configuration
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Community-specific rules that drive the agent validation logic.
        </p>
      </div>

      {communities.map((community) => {
        const config = parseCommunityConfig(community.config);

        return (
          <div key={community.id} className="space-y-5">
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
              <p className="font-semibold text-gray-900">{community.name}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                ID: {community.id}
              </p>
            </div>

            {/* Move-In rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Move-In Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ConfigRow
                  label="Allowed Days"
                  value={config.moveIn.allowedDays.join(", ")}
                />
                {config.moveIn.startTime && (
                  <ConfigRow
                    label="Allowed Hours"
                    value={`${formatTime(config.moveIn.startTime)} – ${formatTime(config.moveIn.endTime ?? "18:00")}`}
                  />
                )}
                <ConfigRow
                  label="Notice Period"
                  value={`${config.moveIn.noticePeriodDays} day${config.moveIn.noticePeriodDays !== 1 ? "s" : ""}`}
                />
              </CardContent>
            </Card>

            {/* Move-Out rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Move-Out Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ConfigRow
                  label="Allowed Days"
                  value={config.moveOut.allowedDays.join(", ")}
                />
                <ConfigRow
                  label="Notice Period"
                  value={`${config.moveOut.noticePeriodDays} day${config.moveOut.noticePeriodDays !== 1 ? "s" : ""}`}
                />
              </CardContent>
            </Card>

            {/* Raw config */}
            <Card>
              <CardHeader>
                <CardTitle>Raw Configuration (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto text-gray-700 border border-gray-100">
                  {JSON.stringify(config, null, 2)}
                </pre>
                <p className="text-xs text-gray-400 mt-3">
                  These rules are stored in the database and loaded at runtime
                  by the agent — no business rules are hardcoded in agent logic.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-xs">
        {value}
      </span>
    </div>
  );
}
