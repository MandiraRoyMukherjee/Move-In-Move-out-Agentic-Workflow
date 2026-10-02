/**
 * Resident section layout — shared sidebar + main content area.
 * Also provides the "active resident" context via URL search params (demo auth).
 */
import { ResidentSidebar } from "@/components/resident/resident-sidebar";

export default function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <ResidentSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
