type WorkerPageShellProps = {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function WorkerPageShell({ title, subtitle, actions, children }: WorkerPageShellProps) {
  return (
    <>
      <section className="page-header">
        <div className="page-header__copy">
          <div className="eyebrow">Worker</div>
          <h1>{title}</h1>
          <p className="lead">{subtitle}</p>
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </section>
      {children}
    </>
  );
}
