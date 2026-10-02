/**
 * Move-In with resident ID — placeholder shell.
 * Full AI chat UI is implemented in Phase 5.
 */
import { notFound } from "next/navigation";
import { findResidentById } from "@/lib/db/repositories/resident.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ residentId: string }>;
}

export default async function MoveInResidentPage({ params }: Props) {
  const { residentId } = await params;
  const resident = await findResidentById(residentId);
  if (!resident) notFound();

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Move-In Request
      </h1>
      <p className="text-gray-500 mb-6">
        Hi <strong>{resident.name}</strong> · Apt {resident.apartmentNumber}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-blue-600" />
            AI Move-In Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
            🚧 AI chat interface coming in Phase 5. The agent orchestration,
            natural-language processing, and community rule validation will be
            wired here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
