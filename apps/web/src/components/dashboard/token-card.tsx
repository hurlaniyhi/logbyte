"use client";

import { useState } from "react";
import { Copy, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TokenSummary } from "@/components/dashboard/token-context";
import { useTokens } from "@/components/dashboard/token-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function maskToken(token: string): string {
  if (token.length <= 12) return token;
  return `${token.slice(0, 7)}${"•".repeat(10)}${token.slice(-4)}`;
}

export function TokenCard({ token }: { token: TokenSummary }) {
  const { deleteToken } = useTokens();
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(token.token);
    setCopied(true);
    toast.success("Token copied to clipboard.");
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleDelete() {
    setDeleting(true);
    const ok = await deleteToken(token.id);
    setDeleting(false);
    if (ok) setConfirmOpen(false);
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-4 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{token.alias}</span>
          </div>
          <code className="mt-1 block truncate text-xs text-muted-foreground">{maskToken(token.token)}</code>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {new Date(token.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy token">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmOpen(true)}
            aria-label="Delete token"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{token.alias}&quot;?</DialogTitle>
            <DialogDescription>
              This permanently deletes the token and every log sent under it. Any app still using this token will stop
              being able to send logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
