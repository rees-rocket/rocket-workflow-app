"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function submitTradeRequest(formData: FormData) {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();

  const shiftAssignmentId = String(formData.get("shift_assignment_id") ?? "");
  const { data: assignment } = await supabase
    .from("shift_assignments")
    .select("id, worker_id")
    .eq("id", shiftAssignmentId)
    .maybeSingle();

  if (!assignment || assignment.worker_id !== profile.id) {
    redirect("/worker/schedule?message=Shift%20assignment%20not%20found");
  }

  const { error } = await supabase.from("shift_trade_requests").insert({
    shift_assignment_id: shiftAssignmentId,
    requested_by_worker_id: profile.id,
    target_worker_id: String(formData.get("target_worker_id") ?? "") || null,
    request_type: String(formData.get("request_type") ?? "trade"),
    reason: String(formData.get("reason") ?? "").trim() || null
  });

  revalidatePath("/worker/schedule");
  revalidatePath("/admin/schedule");
  if (error) {
    redirect(`/worker/schedule?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/worker/schedule?message=Trade%20request%20sent%20for%20admin%20review");
}
