"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LevelBadge } from "@/components/dashboard/level-badge";
import type { LogLevel } from "@/models/Log";

export type LogMeta = Record<string, unknown> | unknown[] | string | number | boolean | null;

export interface LogEntry {
  id: string;
  key: string;
  level: LogLevel;
  message: string;
  meta: LogMeta;
  createdAt: string;
}

export function LogRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasMeta =
    log.meta !== null &&
    log.meta !== undefined &&
    (typeof log.meta !== "object" || Object.keys(log.meta).length > 0);
  const isError = log.level === "error";

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        isError
          ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
          : "border-border bg-card",
      )}
    >
      <button
        type="button"
        onClick={() => hasMeta && setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left",
          hasMeta && "cursor-pointer",
        )}
      >
        {hasMeta ? (
          <ChevronRight className={cn("mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        ) : (
          <span className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={log.level} />
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{log.key}</span>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="mt-1.5 break-words text-sm text-foreground">{log.message}</p>
        </div>
      </button>
      {expanded && hasMeta && (
        <pre className="overflow-x-auto border-t border-border/60 bg-muted/40 px-4 py-3 font-mono text-xs text-muted-foreground">
          {JSON.stringify(log.meta, null, 2)}
        </pre>
      )}
    </div>
  );
}
