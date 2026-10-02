/**
 * Move-Out with resident ID — full AI agent chat interface.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { findResidentById } from "@/lib/db/repositories/resident.repository";
import { findCommunityById } from "@/lib/db/repositories/community.repository";
import { parseCommunityConfig } from "@/lib/db/repositories/community.repository";
import { AgentChat } from "@/components/resident/agent-chat";
import { ArrowLeft, Info } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ residentId: string }>;
}

export default async function MoveOutResidentPage({ params }: Props) {
  const { residentId } = await params;
  const resident = await findResidentById(residentId);
  if (!resident) notFound();

  const community = await findCommunityById(resident.communityId);
  if (!community) notFound();

  const config = parseCommunityConfig(community.config);
  const noticeDays = config.moveOut.noticePeriodDays;

  return (
    <div className="p-4 sm:p-8">
      <Link
        href="/resident/move-out"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Notice period info banner */}
      <div className="mb-4 flex gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" />
        <span>
          <strong>{community.name}</strong> requires{" "}
          <strong>{noticeDays} days</strong> notice for move-outs. The agent
          will validate your requested date automatically.
        </span>
      </div>

      <AgentChat
        type="MOVE_OUT"
        residentId={resident.id}
        residentName={resident.name}
        apartmentNumber={resident.apartmentNumber}
        communityName={community.name}
        initialMessage={`Hi! I'd like to submit a move-out request for apartment ${resident.apartmentNumber}.`}
      />
    </div>
  );
}
