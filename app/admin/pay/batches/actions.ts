"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updatePayBatchStatus(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const periodId = String(formData.get("period_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!periodId || !["open", "ready", "paid"].includes(status)) {
    return;
  }

  await supabase
    .from("pay_periods")
    .update({
      status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
      paid_by: status === "paid" ? profile.id : null
    })
    .eq("id", periodId);

  revalidatePath("/admin");
  revalidatePath("/admin/pay");
  revalidatePath("/admin/pay/batches");
  revalidatePath(`/admin/pay/batches/${periodId}`);
  revalidatePath("/admin/workers");
}
