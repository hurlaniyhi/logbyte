import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/logo-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_45%),radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_40%)]"
      />
      <ThemeToggle className="absolute top-4 right-4" />
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-semibold tracking-tight">
        <LogoMark className="h-8 w-8" />
        logbyte
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
