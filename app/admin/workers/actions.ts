"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function parseWageRateCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const amount = Number(raw);
  if (Number.isNaN(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

function getWorkerPayload(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    full_name: String(formData.get("full_name") ?? "").trim(),
    role: String(formData.get("role") ?? "worker"),
    employee_type: String(formData.get("employee_type") ?? "employee"),
    status: String(formData.get("status") ?? "active"),
    wage_rate_cents: parseWageRateCents(formData.get("wage_rate")),
    travel_wage_rate_cents: parseWageRateCents(formData.get("travel_wage_rate")),
    prep_wage_rate_cents: parseWageRateCents(formData.get("prep_wage_rate")),
    service_wage_rate_cents: parseWageRateCents(formData.get("service_wage_rate")),
    tip_eligible: formData.get("tip_eligible") === "on",
    notes: String(formData.get("notes") ?? "").trim() || null
  };
}

export async function createWorker(formData: FormData) {
  const { profile } = await requireProfile("admin");
  const supabase = await createClient();

  const payload = {
    ...getWorkerPayload(formData),
    created_by: profile.id
  };

  const { data, error } = await supabase
    .from("pending_worker_profiles")
    .insert(payload)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect(`/admin/workers/new?message=${encodeURIComponent(error?.message ?? "Unable to create worker")}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  redirect(`/admin/workers/pending-${data.id}?message=Worker%20saved.%20They%20can%20sign%20in%20with%20this%20email%20to%20activate%20their%20account.`);
}

export async function updateWorker(formData: FormData) {
  await requireProfile("admin");
  const supabase = await createClient();

  const source = String(formData.get("source") ?? "profile");
  const workerId = String(formData.get("worker_id") ?? "");
  const payload = getWorkerPayload(formData);

  if (source === "pending") {
    await supabase.from("pending_worker_profiles").update(payload).eq("id", workerId);
    revalidatePath("/admin/workers");
    redirect(`/admin/workers/pending-${workerId}?message=Worker%20updated`);
  }

  await supabase.from("profiles").update(payload).eq("id", workerId);
  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  revalidatePath(`/admin/workers/${workerId}`);
  redirect(`/admin/workers/${workerId}?message=Worker%20updated`);
}

export async function sendWorkerInvite(formData: FormData) {
  await requireProfile("admin");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const returnTo = String(formData.get("return_to") ?? "/admin/workers");

  if (!email) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}message=${encodeURIComponent("Worker email is required.")}`);
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`
    }
  });

  if (error) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/workers");
  redirect(
    `${returnTo}${returnTo.includes("?") ? "&" : "?"}message=${encodeURIComponent(`Invite sent to ${email}`)}`
  );
}
