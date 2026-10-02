/**
 * Resident sidebar navigation.
 * Simplified auth: resident is selected from a dropdown (demo mode).
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, LogIn, LogOut, ClipboardList } from "lucide-react";

const NAV = [
  { href: "/resident", label: "Dashboard", icon: Home, exact: true },
  { href: "/resident/move-in", label: "Move In", icon: LogIn, exact: false },
  { href: "/resident/move-out", label: "Move Out", icon: LogOut, exact: false },
  {
    href: "/resident/requests",
    label: "My Requests",
    icon: ClipboardList,
    exact: false,
  },
];

export function ResidentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <span className="text-sm font-semibold text-gray-900">ANACITY</span>
        </Link>
        <p className="text-xs text-gray-500 mt-1 ml-9">Resident Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100">
        <Link
          href="/admin"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Switch to Admin →
        </Link>
      </div>
    </aside>
  );
}
