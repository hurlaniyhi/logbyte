import type { Metadata } from "next";
import { Suspense } from "react";
import { LogsView } from "@/components/dashboard/logs-view";

export const metadata: Metadata = { title: "Logs — logbyte" };

export default function LogsPage() {
  return (
    <Suspense>
      <LogsView />
    </Suspense>
  );
}
