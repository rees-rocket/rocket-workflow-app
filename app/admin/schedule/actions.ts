"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function parseMoneyToCents(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value) {
    return null;
  }
  const amount = Number(value);
  return Number.isNaN(amount) ? null : Math.round(amount * 100);
}

export async function createShift(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const shiftDate = String(formData.get("shift_date") ?? "");
  const payload = {
    shift_date: shiftDate,
    location_name: String(formData.get("location_name") ?? "").trim(),
    start_at: combineDateAndTime(shiftDate, String(formData.get("start_time") ?? "")),
    end_at: combineDateAndTime(shiftDate, String(formData.get("end_time") ?? "")),
    notes: String(formData.get("notes") ?? "").trim() || null,
    status: String(formData.get("status") ?? "draft"),
    created_by: profile.id
  };

  const { data, error } = await supabase.from("shifts").insert(payload).select("id").single<{ id: string }>();
  if (error || !data) {
    redirect(`/admin/schedule/new?message=${encodeURIComponent(error?.message ?? "Unable to create shift")}`);
  }

  await syncAssignments(supabase, data.id, formData);

  revalidatePath("/admin");
  revalidatePath("/admin/schedule");
  redirect(`/admin/schedule/${data.id}?message=Shift%20created`);
}

export async function updateShift(formData: FormData) {
  await requireProfile("admin");
  const supabase = await createClient();
  const shiftId = String(formData.get("shift_id") ?? "");
  const shiftDate = String(formData.get("shift_date") ?? "");

  await supabase
    .from("shifts")
    .update({
      shift_date: shiftDate,
      location_name: String(formData.get("location_name") ?? "").trim(),
      start_at: combineDateAndTime(shiftDate, String(formData.get("start_time") ?? "")),
      end_at: combineDateAndTime(shiftDate, String(formData.get("end_time") ?? "")),
      notes: String(formData.get("notes") ?? "").trim() || null,
      status: String(formData.get("status") ?? "draft")
    })
    .eq("id", shiftId);

  await syncAssignments(supabase, shiftId, formData);

  revalidatePath("/admin");
  revalidatePath("/admin/schedule");
  redirect(`/admin/schedule/${shiftId}?message=Shift%20updated`);
}

export async function deleteShift(formData: FormData) {
  await requireProfile("admin");
  const supabase = await createClient();
  const shiftId = String(formData.get("shift_id") ?? "");

  if (!shiftId) {
    redirect("/admin/schedule?message=Shift%20not%20found");
  }

  await supabase.from("shifts").delete().eq("id", shiftId);

  revalidatePath("/admin");
  revalidatePath("/admin/schedule");
  redirect("/admin/schedule?message=Shift%20deleted");
}

export async function approveTradeRequest(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const tradeId = String(formData.get("trade_id") ?? "");
  const shiftId = String(formData.get("shift_id") ?? "");
  const replacementWorkerId = String(formData.get("replacement_worker_id") ?? "");

  const { data: trade } = await supabase
    .from("shift_trade_requests")
    .select("*")
    .eq("id", tradeId)
    .maybeSingle();

  if (!trade) {
    redirect(`/admin/schedule/${shiftId}?message=Trade%20request%20not%20found`);
  }

  const nextWorkerId = trade.target_worker_id ?? replacementWorkerId ?? null;

  if (!nextWorkerId) {
    redirect(`/admin/schedule/${shiftId}?message=Choose%20a%20replacement%20worker%20before%20approval`);
  }

  if (nextWorkerId) {
    await supabase
      .from("shift_assignments")
      .update({ worker_id: nextWorkerId })
      .eq("id", trade.shift_assignment_id);
  }

  await supabase
    .from("shift_trade_requests")
    .update({
      status: "approved",
      target_worker_id: nextWorkerId,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", tradeId);

  revalidatePath("/admin/schedule");
  revalidatePath("/worker/schedule");
  redirect(`/admin/schedule/${shiftId}?message=Trade%20request%20approved`);
}

export async function denyTradeRequest(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();
  const tradeId = String(formData.get("trade_id") ?? "");
  const shiftId = String(formData.get("shift_id") ?? "");

  await supabase
    .from("shift_trade_requests")
    .update({
      status: "denied",
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", tradeId);

  revalidatePath("/admin/schedule");
  revalidatePath("/worker/schedule");
  redirect(`/admin/schedule/${shiftId}?message=Trade%20request%20denied`);
}

async function syncAssignments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shiftId: string,
  formData: FormData
) {
  const assignmentIds = formData.getAll("assignment_id").map((value) => String(value));
  const workerIds = formData.getAll("assignment_worker_id").map((value) => String(value));
  const roles = formData.getAll("assignment_role").map((value) => String(value));
  const payOverrides = formData.getAll("assignment_pay_rate_override");

  const rows = workerIds
    .map((workerId, index) => ({
      assignmentId: assignmentIds[index] || null,
      worker_id: workerId,
      role: roles[index] || "service",
      pay_rate_override_cents: parseMoneyToCents(payOverrides[index] ?? null)
    }))
    .filter((row) => row.worker_id);

  const keptIds = rows.flatMap((row) => (row.assignmentId ? [row.assignmentId] : []));
  let deleteQuery = supabase.from("shift_assignments").delete().eq("shift_id", shiftId);

  if (keptIds.length > 0) {
    deleteQuery = deleteQuery.not("id", "in", `(${keptIds.join(",")})`);
  }

  await deleteQuery;

  for (const row of rows) {
    if (row.assignmentId) {
      await supabase
        .from("shift_assignments")
        .update({
          worker_id: row.worker_id,
          role: row.role,
          pay_rate_override_cents: row.pay_rate_override_cents
        })
        .eq("id", row.assignmentId)
        .eq("shift_id", shiftId);
    } else {
      await supabase.from("shift_assignments").insert({
        shift_id: shiftId,
        worker_id: row.worker_id,
        role: row.role,
        pay_rate_override_cents: row.pay_rate_override_cents
      });
    }
  }
}
