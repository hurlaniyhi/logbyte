"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { TokenProvider } from "@/components/dashboard/token-context";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/logo-mark";

export function DashboardShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <TokenProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
          <Link href="/dashboard/logs" className="flex items-center gap-2 px-5 py-5 text-base font-semibold tracking-tight">
            <LogoMark className="h-7 w-7" />
            logbyte
          </Link>
          <div className="flex-1 px-3">
            <SidebarNav />
          </div>
          <div className="border-t border-sidebar-border p-3">
            <div className="mb-2 flex items-center justify-between gap-2 px-2">
              <span className="truncate text-xs text-sidebar-foreground/60">{email}</span>
              <ThemeToggle className="text-sidebar-foreground/70 hover:text-sidebar-accent-foreground" />
            </div>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground">
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </form>
          </div>
        </aside>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
            <Link href="/dashboard/logs" className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <LogoMark className="h-7 w-7" />
              logbyte
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <form action={logout}>
                <Button type="submit" variant="ghost" size="icon">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </header>
          <div className="md:hidden border-b border-border px-4 py-2">
            <SidebarNav />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </TokenProvider>
  );
}
