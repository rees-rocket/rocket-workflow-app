"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { formatMagicLinkErrorMessage, formatMagicLinkSuccessMessage } from "@/lib/magic-link";
import { cookies } from "next/headers";

const WORKER_SESSION_DAY_COOKIE = "rr-worker-session-day";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/auth/login?message=Enter%20your%20email");
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
    redirect(`/auth/login?message=${encodeURIComponent(formatMagicLinkErrorMessage(error.message))}`);
  }

  redirect(`/auth/login?message=${encodeURIComponent(formatMagicLinkSuccessMessage())}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(WORKER_SESSION_DAY_COOKIE);
  redirect("/auth/login");
}

export async function redirectIfSignedIn() {
  const { profile } = await getCurrentProfile();

  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/worker");
  }
}
