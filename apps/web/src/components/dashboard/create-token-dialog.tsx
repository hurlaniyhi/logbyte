"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTokens } from "@/components/dashboard/token-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateTokenDialog() {
  const { createToken } = useTokens();
  const [open, setOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alias.trim()) return;
    setSubmitting(true);
    const created = await createToken(alias.trim());
    setSubmitting(false);
    if (created) {
      setAlias("");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Generate token
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Generate a new token</DialogTitle>
            <DialogDescription>
              Give it a name for the environment it represents, e.g. <span className="font-medium">staging</span> or{" "}
              <span className="font-medium">production</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="alias">Alias</Label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="production"
              autoFocus
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting || !alias.trim()}>
              {submitting ? "Generating..." : "Generate token"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
