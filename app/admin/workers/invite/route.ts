import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

async function buildRedirect(request: Request, returnTo: string, message: string) {
  const origin = new URL(request.url).origin;
  const baseUrl = getSiteUrl(origin);
  const target = new URL(returnTo || "/admin/workers", baseUrl);
  target.searchParams.set("message", message);
  return NextResponse.redirect(target);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const returnTo = String(formData.get("return_to") ?? "/admin/workers");
  const origin = new URL(request.url).origin;
  const baseUrl = getSiteUrl(origin);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", baseUrl));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle<{ role: "admin" | "worker"; status: "active" | "inactive" }>();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return NextResponse.redirect(new URL("/auth/login?message=Unauthorized", baseUrl));
  }

  if (!email) {
    return buildRedirect(request, returnTo, "Worker email is required.");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`
    }
  });

  if (error) {
    return buildRedirect(request, returnTo, error.message);
  }

  return buildRedirect(request, returnTo, `Invite sent to ${email}`);
}
