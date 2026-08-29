import type { Metadata } from "next";
import { TokensView } from "@/components/dashboard/tokens-view";

export const metadata: Metadata = { title: "Tokens — logbyte" };

export default function TokensPage() {
  return <TokensView />;
}
