/**
 * Admin sidebar navigation.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, Users } from "lucide-react";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/requests",
    label: "Requests",
    icon: ClipboardList,
    exact: false,
  },
  {
    href: "/admin/community",
    label: "Community",
    icon: Users,
    exact: false,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <span className="text-sm font-semibold text-gray-900">ANACITY</span>
        </Link>
        <p className="text-xs text-gray-500 mt-1 ml-9">Admin Portal</p>
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
                  ? "bg-purple-50 text-purple-700 font-medium"
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
          href="/resident"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Switch to Resident
        </Link>
      </div>
    </aside>
  );
}
