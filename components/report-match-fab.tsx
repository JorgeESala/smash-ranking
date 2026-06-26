"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords } from "lucide-react";
import { cn } from "@/lib/utils";

// Routes where the FAB should NOT be shown. The FAB is the primary
// action for signed-in members, so we hide it on routes where:
//   - The user is already on the report flow (/report)
//   - The user is in an auth flow (/login, /join, /onboarding, etc.)
//   - The user is doing admin work (/admin)
const HIDDEN_PREFIXES = [
  "/report",
  "/login",
  "/join",
  "/onboarding",
  "/auth",
  "/admin",
  "/forgot-password",
  "/reset-password",
];

type Props = {
  isAuthenticated: boolean;
};

export function ReportMatchFab({ isAuthenticated }: Props) {
  const pathname = usePathname();

  if (!isAuthenticated) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <Link
      href="/report"
      aria-label="Reportar partida"
      className={cn(
        // Position — bottom-right, clear of the iOS home indicator via
        // safe-area-inset-bottom. The 1.5rem is the same as bottom-6.
        "fixed right-6 z-[55] print:hidden",
        "bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",

        // Layout
        "inline-flex items-center justify-center",
        "h-14 rounded-full",
        "bg-primary text-primary-foreground font-semibold text-sm",
        "shadow-neon-primary select-none",

        // Extended FAB on mobile (pill with text), icon-only on sm+
        "gap-2 px-5",
        "sm:gap-0 sm:px-0 sm:w-14",

        // Motion
        "transition-all duration-200 ease-out",
        "hover:scale-105 hover:shadow-neon-primary",
        "active:scale-95",

        // Focus
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <Swords className="size-5 shrink-0" aria-hidden="true" />
      <span className="sm:hidden whitespace-nowrap">Reportar</span>
    </Link>
  );
}
