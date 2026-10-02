/**
 * Resident dashboard — client component.
 * Shows the resident selector (demo auth), then the dashboard for
 * the selected resident.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, ClipboardList, ChevronDown, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  apartmentNumber: string;
  communityId: string;
}

interface Props {
  residents: Resident[];
  community: { id: string; name: string };
}

export function ResidentDashboardClient({ residents, community }: Props) {
  const [selected, setSelected] = useState<Resident | null>(
    residents[0] ?? null
  );
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{selected ? `, ${selected.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-gray-500 mt-1">{community.name}</p>
        </div>

        {/* Resident selector (demo auth) */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {selected ? selected.name : "Select resident"}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {residents.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelected(r);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">Apt {r.apartmentNumber}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resident info card */}
      {selected && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {selected.name[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{selected.name}</p>
            <p className="text-sm text-gray-600">
              Apartment {selected.apartmentNumber} · {selected.email}
            </p>
          </div>
        </div>
      )}

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <Link
          href={selected ? `/resident/move-in/${selected.id}` : "/resident/move-in"}
        >
          <Card className="group hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <LogIn className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                Move In
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Start an AI-guided move-in request
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link
          href={selected ? `/resident/move-out/${selected.id}` : "/resident/move-out"}
        >
          <Card className="group hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <LogOut className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                Move Out
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Start an AI-guided move-out request
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/resident/requests">
          <Card className="group hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="pt-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <ClipboardList className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                My Requests
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Track the status of your requests
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Demo notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>Demo mode:</strong> Use the dropdown above to switch between
        residents. In production this would be replaced with real authentication.
      </div>
    </div>
  );
}
