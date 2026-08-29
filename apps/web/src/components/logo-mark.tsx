import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * A stylized lowercase "lb" monoline monogram — l for log, b for byte —
 * with a single accent block nested between the letters as a nod to
 * "byte" (the pixel unit), set against the letters' soft curves.
 */
export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="8" fill={`url(#${gradientId})`} />

      {/* l */}
      <path
        d="M9 8 L9 19 Q9 23 13 23"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* byte accent block */}
      <rect x="13.7" y="13.2" width="2.6" height="2.6" rx="1" fill="#FBBF24" />

      {/* b */}
      <path
        d="M18 7 L18 23 M18 14 C22.5 14 24.5 16 24.5 18.5 C24.5 21 22.5 23 18 23"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B7FF7" />
          <stop offset="1" stopColor="#4C3FD1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
