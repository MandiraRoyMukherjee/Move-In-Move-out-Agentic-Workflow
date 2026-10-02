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

function NavItems({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
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
      <div className="px-5 py-4 border-t border-gray-100">
        <Link
          href="/resident"
          onClick={onNavigate}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Switch to Resident
        </Link>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const brand = (
    <div className="px-5 py-5 border-b border-gray-100">
      <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
        <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
        <span className="text-sm font-semibold text-gray-900">ANACITY</span>
      </Link>
      <p className="text-xs text-gray-500 mt-1 ml-9">Admin Portal</p>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <span className="text-sm font-semibold text-gray-900">ANACITY</span>
          <span className="text-xs text-gray-500">Admin</span>
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed top-14 left-0 bottom-0 z-20 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavItems pathname={pathname} onNavigate={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-white border-r border-gray-200 flex-col">
        {brand}
        <NavItems pathname={pathname} />
      </aside>
    </>
  );
}
