import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar: zero-width on mobile, 224px on desktop */}
      <AdminSidebar />
      {/* Main: full width on mobile (sidebar is not in flow), offset on desktop */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
