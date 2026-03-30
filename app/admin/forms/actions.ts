"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveWorkerForm(formData: FormData) {
  await requireProfile("admin");
  const supabase = await createClient();
  const formId = textValue(formData, "form_id");
  const payload = {
    name: textValue(formData, "name"),
    version_label: textValue(formData, "version_label") || null,
    short_description: textValue(formData, "short_description"),
    content_text: textValue(formData, "content_text"),
    acknowledgment_label: textValue(formData, "acknowledgment_label") || "I acknowledge and agree to this form.",
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString()
  };

  if (!payload.name || !payload.short_description || !payload.content_text) return;

  if (formId) {
    await supabase.from("worker_forms").update(payload).eq("id", formId);
  } else {
    await supabase.from("worker_forms").insert(payload);
  }

  revalidatePath("/admin/forms");
  revalidatePath("/worker/forms");
}

export async function assignWorkerForm(formData: FormData) {
  await requireProfile("admin");
  const supabase = await createClient();
  const workerId = textValue(formData, "worker_id");
  const formId = textValue(formData, "form_id");

  if (!workerId || !formId) return;

  await supabase.from("worker_form_assignments").upsert(
    {
      worker_id: workerId,
      form_id: formId,
      status: "not_started",
      updated_at: new Date().toISOString()
    },
    { onConflict: "worker_id,form_id" }
  );

  revalidatePath("/admin/forms");
  revalidatePath("/worker/forms");
}
