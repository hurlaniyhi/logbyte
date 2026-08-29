import { verifySession } from "@/lib/dal";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  return <DashboardShell email={session.email}>{children}</DashboardShell>;
}
