// Server-side guard: require an authenticated user whose ID is in
// ADMIN_USER_IDS env var. Use for /admin/* routes.
import { requireMember } from "./require-member";

export async function requireAdmin() {
  const ctx = await requireMember("/admin");
  const allow = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!allow.includes(ctx.userId)) {
    throw new Error("Forbidden");
  }
  return ctx;
}
