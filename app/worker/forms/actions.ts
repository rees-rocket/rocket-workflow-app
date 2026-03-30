"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function submitWorkerForm(formData: FormData) {
  const { profile } = await requireProfile("worker");
  const supabase = await createClient();
  const assignmentId = String(formData.get("assignment_id") ?? "");
  const formId = String(formData.get("form_id") ?? "");
  const formKey = String(formData.get("form_key") ?? "");
  const acknowledged = formData.get("acknowledged") === "on";
  const typedSignature = String(formData.get("typed_signature") ?? "").trim();

  if (!assignmentId || !formId || !acknowledged || !typedSignature) return;

  const isMinor = formData.get("is_minor") === "yes";
  const workerSignedAt = new Date().toISOString();
  const guardianSignature = String(formData.get("guardian_signature") ?? "").trim();
  const guardianSignedAt = guardianSignature ? workerSignedAt : null;

  if (formKey === "emergency-contact-safety-guardian") {
    const workerFullName = String(formData.get("worker_full_name") ?? "").trim();
    const workerPhone = String(formData.get("worker_phone") ?? "").trim();
    const workerEmail = String(formData.get("worker_email") ?? "").trim();
    const emergencyContactName = String(formData.get("emergency_contact_name") ?? "").trim();
    const emergencyContactRelationship = String(formData.get("emergency_contact_relationship") ?? "").trim();
    const emergencyContactPhone = String(formData.get("emergency_contact_phone") ?? "").trim();
    const guardianFullName = String(formData.get("guardian_full_name") ?? "").trim();
    const guardianRelationship = String(formData.get("guardian_relationship") ?? "").trim();
    const guardianPhone = String(formData.get("guardian_phone") ?? "").trim();

    if (
      !workerFullName ||
      !workerPhone ||
      !workerEmail ||
      !emergencyContactName ||
      !emergencyContactRelationship ||
      !emergencyContactPhone
    ) {
      return;
    }

    if (isMinor && (!guardianFullName || !guardianRelationship || !guardianPhone || !guardianSignature)) {
      return;
    }

    await supabase.from("worker_form_submissions").insert({
      assignment_id: assignmentId,
      worker_id: profile.id,
      form_id: formId,
      submission_data_json: {
        worker_full_name: workerFullName,
        worker_phone: workerPhone,
        worker_email: workerEmail,
        emergency_contact_name: emergencyContactName,
        emergency_contact_relationship: emergencyContactRelationship,
        emergency_contact_phone: emergencyContactPhone,
        safe_work_acknowledged: formData.get("safe_work_acknowledged") === "on",
        incident_reporting_acknowledged: formData.get("incident_reporting_acknowledged") === "on",
        is_minor: isMinor,
        guardian_full_name: isMinor ? guardianFullName : null,
        guardian_relationship: isMinor ? guardianRelationship : null,
        guardian_phone: isMinor ? guardianPhone : null,
        guardian_email: isMinor ? String(formData.get("guardian_email") ?? "").trim() || null : null
      },
      is_minor: isMinor,
      acknowledged: true,
      typed_signature: typedSignature,
      worker_signed_at: workerSignedAt,
      guardian_signature: isMinor ? guardianSignature : null,
      guardian_signed_at: isMinor ? guardianSignedAt : null,
      submitted_at: workerSignedAt
    });
  } else if (formKey === "independent-contractor-agreement") {
    const contractorFullName = String(formData.get("contractor_full_name") ?? "").trim();
    const contractorEmail = String(formData.get("contractor_email") ?? "").trim();
    const agreementEffectiveDate = String(formData.get("agreement_effective_date") ?? "").trim();
    const guardianFullName = String(formData.get("guardian_full_name") ?? "").trim();

    if (!contractorFullName || !contractorEmail || !agreementEffectiveDate) {
      return;
    }

    if (isMinor && (!guardianFullName || !guardianSignature)) {
      return;
    }

    await supabase.from("worker_form_submissions").insert({
      assignment_id: assignmentId,
      worker_id: profile.id,
      form_id: formId,
      submission_data_json: {
        contractor_full_name: contractorFullName,
        contractor_email: contractorEmail,
        agreement_effective_date: agreementEffectiveDate,
        is_minor: isMinor,
        guardian_full_name: isMinor ? guardianFullName : null
      },
      is_minor: isMinor,
      acknowledged: true,
      typed_signature: typedSignature,
      worker_signed_at: workerSignedAt,
      guardian_signature: isMinor ? guardianSignature : null,
      guardian_signed_at: isMinor ? guardianSignedAt : null,
      submitted_at: workerSignedAt
    });
  } else if (formKey === "employee-handbook-acknowledgment") {
    const workerFullName = String(formData.get("worker_full_name") ?? "").trim();
    const handbookVersion = String(formData.get("handbook_version") ?? "").trim();
    const guardianFullName = String(formData.get("guardian_full_name") ?? "").trim();
    const guardianRelationship = String(formData.get("guardian_relationship") ?? "").trim();
    const guardianPhone = String(formData.get("guardian_phone") ?? "").trim();

    if (!workerFullName || !handbookVersion) {
      return;
    }

    if (isMinor && (!guardianFullName || !guardianRelationship || !guardianPhone || !guardianSignature)) {
      return;
    }

    await supabase.from("worker_form_submissions").insert({
      assignment_id: assignmentId,
      worker_id: profile.id,
      form_id: formId,
      submission_data_json: {
        worker_full_name: workerFullName,
        handbook_version: handbookVersion,
        is_minor: isMinor,
        guardian_full_name: isMinor ? guardianFullName : null,
        guardian_relationship: isMinor ? guardianRelationship : null,
        guardian_phone: isMinor ? guardianPhone : null
      },
      is_minor: isMinor,
      acknowledged: true,
      typed_signature: typedSignature,
      worker_signed_at: workerSignedAt,
      guardian_signature: isMinor ? guardianSignature : null,
      guardian_signed_at: isMinor ? guardianSignedAt : null,
      submitted_at: workerSignedAt
    });
  } else {
    await supabase.from("worker_form_submissions").insert({
      assignment_id: assignmentId,
      worker_id: profile.id,
      form_id: formId,
      submission_data_json: null,
      is_minor: false,
      acknowledged: true,
      typed_signature: typedSignature,
      worker_signed_at: workerSignedAt,
      guardian_signature: null,
      guardian_signed_at: null,
      submitted_at: workerSignedAt
    });
  }

  await supabase
    .from("worker_form_assignments")
    .update({
      status: "completed",
      updated_at: new Date().toISOString()
    })
    .eq("id", assignmentId)
    .eq("worker_id", profile.id);

  revalidatePath("/worker/forms");
  revalidatePath(`/worker/forms/${assignmentId}`);
}
