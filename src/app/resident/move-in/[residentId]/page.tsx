/**
 * Move-In with resident ID — full AI agent chat interface.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { findResidentById } from "@/lib/db/repositories/resident.repository";
import { findCommunityById } from "@/lib/db/repositories/community.repository";
import { AgentChat } from "@/components/resident/agent-chat";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ residentId: string }>;
}

export default async function MoveInResidentPage({ params }: Props) {
  const { residentId } = await params;
  const resident = await findResidentById(residentId);
  if (!resident) notFound();

  const community = await findCommunityById(resident.communityId);
  if (!community) notFound();

  return (
    <div className="p-4 sm:p-8">
      <Link
        href="/resident/move-in"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 sm:mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <AgentChat
        type="MOVE_IN"
        residentId={resident.id}
        residentName={resident.name}
        apartmentNumber={resident.apartmentNumber}
        communityName={community.name}
      />
    </div>
  );
}
