import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function HomePage() {
  const { profile } = await getCurrentProfile();

  if (profile) {
    redirect(profile.role === "admin" ? "/admin" : "/worker");
  }

  return (
    <main className="home-shell">
      <section className="home-card">
        <header className="home-header">
          <div className="home-kicker">Rocket Ribs &amp; BBQ</div>
          <h1>Team Portal</h1>
        </header>

        <p className="home-description">
          Clock in, check your schedule, and track your hours.
        </p>

        <div className="home-actions">
          <Link className="btn primary big home-primary-btn" href="/auth/login">
            Clock In / Enter Portal
          </Link>
          <Link className="btn secondary home-secondary-btn" href="/auth/login">
            Admin Login
          </Link>
        </div>

        <div className="home-features" aria-label="Portal features">
          <div className="home-feature-pill">
            <span aria-hidden="true">⏱</span>
            <span>Clock In</span>
          </div>
          <div className="home-feature-pill">
            <span aria-hidden="true">📅</span>
            <span>Schedule</span>
          </div>
          <div className="home-feature-pill">
            <span aria-hidden="true">💵</span>
            <span>Pay</span>
          </div>
        </div>

        <footer className="home-footer">Secure login via email</footer>
      </section>
    </main>
  );
}
