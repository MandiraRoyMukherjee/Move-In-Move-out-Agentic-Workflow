/**
 * Move-Out with resident ID — placeholder shell.
 * Full AI chat UI is implemented in Phase 6.
 */
import { notFound } from "next/navigation";
import { findResidentById } from "@/lib/db/repositories/resident.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ residentId: string }>;
}

export default async function MoveOutResidentPage({ params }: Props) {
  const { residentId } = await params;
  const resident = await findResidentById(residentId);
  if (!resident) notFound();

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Move-Out Request
      </h1>
      <p className="text-gray-500 mb-6">
        Hi <strong>{resident.name}</strong> · Apt {resident.apartmentNumber}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            AI Move-Out Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-indigo-50 rounded-lg text-sm text-indigo-800">
            🚧 AI chat interface coming in Phase 6. The agent orchestration,
            notice period validation, and community rule checks will be wired
            here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
