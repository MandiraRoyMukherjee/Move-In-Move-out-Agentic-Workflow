/**
 * Move-Out page — entry point for the AI-assisted move-out workflow.
 * The actual chat/form UI is built in Phase 6.
 */
import Link from "next/link";
import { findAllCommunities } from "@/lib/db/repositories/community.repository";
import { findResidentsByCommunity } from "@/lib/db/repositories/resident.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Bot } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MoveOutPage() {
  const communities = await findAllCommunities();
  const community = communities[0];
  const residents = community
    ? await findResidentsByCommunity(community.id)
    : [];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LogOut className="w-6 h-6 text-indigo-600" />
          Move-Out Request
        </h1>
        <p className="text-gray-500 mt-1">
          Use the AI assistant to create a move-out request.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            AI Move-Out Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-6">
            Our AI assistant will guide you through the move-out process,
            check the notice period, and validate your request against community
            rules.
          </p>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Select your resident profile:
            </p>
            {residents.map((r) => (
              <Link
                key={r.id}
                href={`/resident/move-out/${r.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group">
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-sm text-gray-500">
                      Apt {r.apartmentNumber} · {r.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="group-hover:border-indigo-400 group-hover:text-indigo-600"
                  >
                    Start →
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
