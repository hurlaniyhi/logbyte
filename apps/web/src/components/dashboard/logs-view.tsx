"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, RefreshCw, ScrollText, Search } from "lucide-react";
import { useTokens } from "@/components/dashboard/token-context";
import { LogRow, type LogEntry } from "@/components/dashboard/log-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LogLevel } from "@/models/Log";

const ALL_LEVELS: LogLevel[] = ["info", "warning", "error"];
const PAGE_SIZE = 25;
const AUTO_REFRESH_MS = 5000;

export function LogsView() {
  const { tokens, loading: tokensLoading } = useTokens();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedTokenId = searchParams.get("token") ?? tokens[0]?.id ?? "";

  const [levels, setLevels] = useState<LogLevel[]>(ALL_LEVELS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);

  function handleTokenChange(id: string | null) {
    if (!id) return;
    const params = new URLSearchParams(searchParams);
    params.set("token", id);
    router.replace(`/dashboard/logs?${params.toString()}`);
    setPage(1);
  }

  function toggleLevel(level: LogLevel) {
    setLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
    setPage(1);
  }

  const fetchLogs = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!selectedTokenId) return;
      if (!opts?.silent) setLoading(true);
      try {
        const params = new URLSearchParams({
          tokenId: selectedTokenId,
          page: String(page),
          pageSize: String(PAGE_SIZE),
        });
        if (levels.length && levels.length < ALL_LEVELS.length) params.set("levels", levels.join(","));
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/logs?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      } finally {
        setLoading(false);
      }
    },
    [selectedTokenId, page, levels, search],
  );

  useEffect(() => {
    // Fetches logs for the current token/filters/page; setState happens after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [fetchLogs]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchLogs({ silent: true }), AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchLogs]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  if (!tokensLoading && tokens.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
          <ScrollText className="h-6 w-6 text-accent-foreground" />
        </div>
        <h2 className="text-base font-medium">No tokens yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Head over to the Tokens tab to generate one, then start sending logs from your app.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
          <p className="text-sm text-muted-foreground">Viewing logs sent under the selected token.</p>
        </div>
        <Select value={selectedTokenId} onValueChange={handleTokenChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select a token">
              {(value: string | null) => tokens.find((t) => t.id === value)?.alias ?? "Select a token"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {tokens.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.alias}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by key or message..."
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-3">
          {ALL_LEVELS.map((level) => (
            <label key={level} className="flex cursor-pointer items-center gap-1.5 text-sm capitalize">
              <Checkbox checked={levels.includes(level)} onCheckedChange={() => toggleLevel(level)} />
              {level}
            </label>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            Auto-refresh
          </label>
          <Button variant="outline" size="icon" onClick={() => fetchLogs()} aria-label="Refresh">
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <h2 className="text-base font-medium">No logs yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {selectedToken
              ? `Send a log using the "${selectedToken.alias}" token to see it appear here.`
              : "Select a token to view its logs."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} &middot; {total} logs
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
