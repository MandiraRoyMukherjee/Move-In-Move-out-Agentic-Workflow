/**
 * Resident picker — demo "login" page that lets users select a resident
 * from the seeded list. In production this would be real authentication.
 */
import { findResidentsByCommunity } from "@/lib/db/repositories/resident.repository";
import { findAllCommunities } from "@/lib/db/repositories/community.repository";
import { ResidentDashboardClient } from "@/components/resident/resident-dashboard-client";

export const dynamic = "force-dynamic";

export default async function ResidentPage() {
  const communities = await findAllCommunities();
  const community = communities[0]; // Green Valley for demo

  if (!community) {
    return (
      <div className="p-8 text-gray-500">
        No community found. Run{" "}
        <code className="bg-gray-100 px-1 rounded">npm run db:seed</code> first.
      </div>
    );
  }

  const residents = await findResidentsByCommunity(community.id);

  return (
    <ResidentDashboardClient
      residents={residents}
      community={{ id: community.id, name: community.name }}
    />
  );
}
