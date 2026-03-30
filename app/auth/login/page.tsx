import { AppShell } from "@/components/app-shell";
import { sendMagicLink, redirectIfSignedIn } from "@/app/auth/login/actions";

type LoginPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfSignedIn();
  const params = (await searchParams) ?? {};

  return (
    <AppShell
      title="Login"
      subtitle="Magic-link auth keeps worker sign-in simple"
      nav={[
        { href: "/", label: "Overview" },
        { href: "/auth/login", label: "Login" }
      ]}
    >
      <section className="card stack" style={{ maxWidth: 480 }}>
        <div className="eyebrow">Magic Link</div>
        <h2>Passwordless worker sign-in</h2>
        <p className="muted">
          Workers enter their email, receive a secure sign-in link, and return directly into
          the mobile dashboard. Admins use the same flow.
        </p>
        {params.message ? <div className="pill">{params.message}</div> : null}
        <form action={sendMagicLink} className="stack">
          <label className="stack">
            <span>Email address</span>
            <input
              name="email"
              type="email"
              placeholder="worker@rocketribs.com"
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "#fff"
              }}
              required
            />
          </label>
          <div className="button-row">
            <button className="btn primary" type="submit">
              Send magic link
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
