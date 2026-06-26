// Root proxy: refreshes the Supabase auth session on every request
// and gates member/admin route groups. Also enforces the invite-code cookie.
//
// In Next.js 16 the `middleware` file is renamed to `proxy`. Same API, new name.
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

// /matches and /matches/[id] are intentionally NOT in this list — they're
// public so recruiters and visitors can browse the demo + recent activity
// without signing in. The match detail page only renders the approve /
// dispute / cancel action buttons for participants, and the server
// actions re-check auth anyway.
const MEMBER_PREFIXES = ["/inbox", "/report", "/players/me", "/settings"];
const ADMIN_PREFIXES = ["/admin"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Skip static, image, manifest, and service-worker routes
  const path = request.nextUrl.pathname;
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api/") ||
    path.startsWith("/icons/") ||
    path === "/manifest.webmanifest" ||
    path === "/sw.js" ||
    path === "/favicon.ico"
  ) {
    return response;
  }

  // Create a Supabase client wired to request/response cookies
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touch the session (refreshes the token if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Member gate
  if (MEMBER_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  // Admin gate (env allowlist)
  if (ADMIN_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    const allow = (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!allow.includes(user.id)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, manifest, sw
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
