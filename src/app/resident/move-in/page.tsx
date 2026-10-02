/**
 * Move-In page — entry point for the AI-assisted move-in workflow.
 * The actual chat/form UI is built in Phase 5.
 * This page provides the resident selector and context.
 */
import Link from "next/link";
import { findAllCommunities } from "@/lib/db/repositories/community.repository";
import { findResidentsByCommunity } from "@/lib/db/repositories/resident.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Bot } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MoveInPage() {
  const communities = await findAllCommunities();
  const community = communities[0];
  const residents = community
    ? await findResidentsByCommunity(community.id)
    : [];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LogIn className="w-6 h-6 text-blue-600" />
          Move-In Request
        </h1>
        <p className="text-gray-500 mt-1">
          Use the AI assistant to create a move-in request.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            AI Move-In Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6">
            Our AI assistant will guide you through the move-in process,
            validate your request against community rules, and collect any
            missing information.
          </p>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Select your resident profile:
            </p>
            {residents.map((r) => (
              <Link
                key={r.id}
                href={`/resident/move-in/${r.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group">
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-sm text-gray-500">
                      Apt {r.apartmentNumber} · {r.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group-hover:border-blue-400 group-hover:text-blue-600"
                  >
                    Start →
                  </Button>
                </div>
              </Link>
            ))}
            {residents.length === 0 && (
              <p className="text-sm text-gray-500">
                No residents found. Run{" "}
                <code className="bg-gray-100 px-1 rounded">npm run db:seed</code>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
