import { PublicNav } from "@/components/nav/public-nav";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNav />
      <div className="flex-1">{children}</div>
    </>
  );
}
