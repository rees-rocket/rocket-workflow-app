import { AdminPageShell } from "@/components/admin-page-shell";
import AdminEditHoursPay from "@/components/admin-edit-hours-pay";
import { requireProfile } from "@/lib/auth";

export default async function AdminTimeEditPage() {
  await requireProfile("admin");

  return (
    <AdminPageShell title="Edit Time" subtitle="Adjust a worker's hours and pay from one responsive screen">
      <AdminEditHoursPay />
    </AdminPageShell>
  );
}
