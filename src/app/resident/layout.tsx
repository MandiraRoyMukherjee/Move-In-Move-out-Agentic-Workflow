/**
 * Resident section layout — shared sidebar + main content area.
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
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
