"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/logs", label: "Logs", icon: ScrollText },
  { href: "/dashboard/tokens", label: "Tokens", icon: KeyRound },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
