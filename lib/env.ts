export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return { url, anonKey };
}

export function getSiteUrl(fallback = "https://rocket-workflow-app.vercel.app") {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? fallback;

  return siteUrl.replace(/\/$/, "");
}
