import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function HomePage() {
  const { profile } = await getCurrentProfile();

  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/worker");
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="eyebrow">MVP Blueprint</div>
        <h1>Rocket Ribs employee portal, reduced to the practical first release.</h1>
        <p className="lead">
          This starter is shaped around magic-link login, worker clock in and clock out,
          simple admin controls, and lightweight training compliance. It is designed as a
          PWA-first foundation so the worker experience stays fast on iPhone and Android
          while the admin view remains comfortable on desktop.
        </p>
        <div className="button-row">
          <Link className="btn primary" href="/worker">
            Open worker MVP
          </Link>
          <Link className="btn secondary" href="/admin">
            Open admin MVP
          </Link>
        </div>
      </section>
    </main>
  );
}
