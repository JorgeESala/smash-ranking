import Link from "next/link";
import { Trophy, History, LogIn, LogOut, User, Sparkles } from "lucide-react";
import { getOptionalMember } from "@/lib/auth/require-member";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { InboxBell } from "./inbox-bell";

export async function PublicNav() {
  const ctx = await getOptionalMember();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-tight text-neon-primary"
        >
          YOSHOS<span className="text-secondary">/</span>RANKING
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink href="/leaderboard" icon={<Trophy className="size-4" />}>
            Ranking
          </NavLink>
          <NavLink href="/matches" icon={<History className="size-4" />}>
            Partidas
          </NavLink>

          {ctx ? (
            <>
              <InboxBell playerId={ctx.player.id} />
              <NavLink href="/players/me" icon={<User className="size-4" />}>
                {ctx.player.nickname}
              </NavLink>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="size-4" />
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Demo link — visitors only. Signed-in members get the
                  real data on their own leaderboard. */}
              <NavLink href="/season/demo" icon={<Sparkles className="size-4 text-secondary" />}>
                Demo
              </NavLink>
              <Button render={<Link href="/login" />} variant="ghost" size="sm">
                <LogIn className="size-4" />
                Entrar
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
