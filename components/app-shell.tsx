import Link from "next/link";

type AppShellProps = {
  title: string;
  subtitle: string;
  nav: Array<{ href: string; label: string }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, nav, actions, children }: AppShellProps) {
  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <div className="brand">Rocket Ribs Workforce</div>
          <div className="muted">{subtitle}</div>
        </div>
        <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
          <nav className="nav" aria-label={`${title} navigation`}>
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          {actions}
        </div>
      </div>
      {children}
    </main>
  );
}
