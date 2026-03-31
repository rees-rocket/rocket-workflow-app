type FormSignatureSummaryProps = {
  title: string;
  signerLabel: string;
  signature: string;
  signedAt: string;
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function FormSignatureSummary({
  title,
  signerLabel,
  signature,
  signedAt
}: FormSignatureSummaryProps) {
  return (
    <section className="signature-block preview signature-block--signed">
      <div className="signature-heading">{title}</div>
      <div className="signature-status-grid">
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">{signerLabel}</span>
          <strong>{signature}</strong>
        </div>
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">Signed on</span>
          <strong>{formatTimestamp(signedAt)}</strong>
        </div>
      </div>
    </section>
  );
}
