import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LogLevel } from "@/models/Log";

const levelConfig: Record<LogLevel, { label: string; icon: typeof Info; className: string }> = {
  info: { label: "Info", icon: Info, className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
};

export function LevelBadge({ level }: { level: LogLevel }) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
