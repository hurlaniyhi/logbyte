"use client";

import { KeyRound } from "lucide-react";
import { useTokens } from "@/components/dashboard/token-context";
import { CreateTokenDialog } from "@/components/dashboard/create-token-dialog";
import { TokenCard } from "@/components/dashboard/token-card";
import { Skeleton } from "@/components/ui/skeleton";

export function TokensView() {
  const { tokens, loading } = useTokens();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tokens</h1>
          <p className="text-sm text-muted-foreground">
            Create a token per environment, then pass it to the logbyte SDK to start sending logs.
          </p>
        </div>
        <CreateTokenDialog />
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : tokens.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <KeyRound className="h-6 w-6 text-accent-foreground" />
          </div>
          <h2 className="text-base font-medium">No tokens yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Generate your first token to start sending logs from your app — give it an alias like{" "}
            <span className="font-medium text-foreground">staging</span> or{" "}
            <span className="font-medium text-foreground">production</span>.
          </p>
          <div className="mt-6">
            <CreateTokenDialog />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}
