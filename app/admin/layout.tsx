import { AdminTopNav } from "@/components/admin-top-nav";
import { requireProfile } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireProfile("admin");

  return (
    <main className="shell">
      <AdminTopNav />
      {children}
    </main>
  );
}
