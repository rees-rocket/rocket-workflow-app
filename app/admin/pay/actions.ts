"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getPayPeriodForDate } from "@/lib/data/pay-batches";
import { createClient } from "@/lib/supabase/server";

function parseMoneyToCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return 0;
  }

  const amount = Number(raw);
  return Number.isNaN(amount) ? 0 : Math.round(amount * 100);
}

export async function saveTipRecord(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const tipId = String(formData.get("tip_id") ?? "").trim();
  const workerId = String(formData.get("worker_id") ?? "").trim();
  const tipDate = String(formData.get("tip_date") ?? "").trim();
  const shiftId = String(formData.get("shift_id") ?? "").trim() || null;
  const eventName = String(formData.get("event_name") ?? "").trim() || null;
  const cashTipCents = parseMoneyToCents(formData.get("cash_tip"));
  const onlineTipCents = parseMoneyToCents(formData.get("online_tip"));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const payPeriodId = String(formData.get("pay_period_id") ?? "").trim();

  if (!workerId || !tipDate) {
    redirect(`/admin/pay?message=${encodeURIComponent("Worker and date are required.")}`);
  }

  const payPeriod = await getPayPeriodForDate(tipDate);

  const payload = {
    worker_id: workerId,
    tip_date: tipDate,
    pay_period_id: payPeriod?.id ?? null,
    shift_id: shiftId,
    event_name: eventName,
    cash_tip_cents: cashTipCents,
    online_tip_cents: onlineTipCents,
    notes,
    updated_by: profile.id
  };

  if (tipId) {
    await supabase.from("tip_records").update(payload).eq("id", tipId);
  } else {
    await supabase.from("tip_records").insert({
      ...payload,
      created_by: profile.id
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pay");
  revalidatePath("/admin/workers");
  revalidatePath(`/admin/workers/${workerId}`);
  redirect(
    `/admin/pay?${new URLSearchParams({
      ...(payPeriodId ? { period: payPeriodId } : {}),
      ...(payPeriod?.id ? { period: payPeriod.id } : {}),
      worker: workerId,
      message: "Tip record saved"
    }).toString()}`
  );
}
