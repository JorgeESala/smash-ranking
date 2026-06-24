import { PublicNav } from "@/components/nav/public-nav";
import { requireMember } from "@/lib/auth/require-member";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireMember redirects to /login if not authenticated
  await requireMember();

  return (
    <>
      <PublicNav />
      <div className="flex-1">{children}</div>
    </>
  );
}
