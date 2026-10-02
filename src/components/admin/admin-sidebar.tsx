/**
 * Admin sidebar navigation — responsive with mobile drawer.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, Users, Menu, X } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/requests", label: "Requests", icon: ClipboardList, exact: false },
  { href: "/admin/community", label: "Community", icon: Users, exact: false },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile top bar (only visible < lg) ── */}
      <div className="lg:hidden fixed inset-x-0 top-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xs font-bold">A</div>
          <span className="text-sm font-semibold text-gray-900">ANACITY</span>
          <span className="text-xs text-gray-400 ml-1">Admin</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Toggle navigation"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile slide-in drawer ── */}
      <div
        className={cn(
          "lg:hidden fixed top-14 left-0 bottom-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        <div className="px-5 py-4 border-t border-gray-100">
          <Link href="/resident" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
            ← Switch to Resident
          </Link>
        </div>
      </div>

      {/* ── Desktop sidebar (only visible ≥ lg) ── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-white border-r border-gray-200">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xs font-bold">A</div>
            <span className="text-sm font-semibold text-gray-900">ANACITY</span>
          </Link>
          <p className="text-xs text-gray-500 mt-1 ml-9">Admin Portal</p>
        </div>
        <NavLinks pathname={pathname} />
        <div className="px-5 py-4 border-t border-gray-100">
          <Link href="/resident" className="text-xs text-gray-400 hover:text-gray-600">
            ← Switch to Resident
          </Link>
        </div>
      </aside>
    </>
  );
}
