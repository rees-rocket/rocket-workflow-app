type AdminPageShellProps = {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AdminPageShell({ title, subtitle, actions, children }: AdminPageShellProps) {
  return (
    <>
      <section className="page-header">
        <div className="page-header__copy">
          <div className="eyebrow">Admin</div>
          <h1>{title}</h1>
          <p className="lead">{subtitle}</p>
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </section>
      {children}
    </>
  );
}
