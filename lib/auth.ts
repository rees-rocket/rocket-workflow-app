import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, ProfileRow } from "@/lib/types";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null as ProfileRow | null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, employee_type, status, wage_rate_cents, travel_wage_rate_cents, prep_wage_rate_cents, service_wage_rate_cents, tip_eligible, notes")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  return { user, profile: profile ?? null };
}

export async function requireProfile(role?: AppRole) {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/auth/login");
  }

  if (!profile) {
    redirect("/auth/login?message=Account%20not%20set%20up");
  }

  if (profile.status !== "active") {
    redirect("/auth/login?message=Your%20account%20is%20inactive");
  }

  if (role && profile.role !== role) {
    redirect(profile.role === "admin" ? "/admin" : "/worker");
  }

  return { user, profile };
}
