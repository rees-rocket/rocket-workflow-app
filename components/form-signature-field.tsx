type FormSignatureFieldProps = {
  title: string;
  help: string;
  inputName: string;
  inputLabel?: string;
  defaultValue?: string;
  required?: boolean;
  signatureLineLabel: string;
};

function formatSigningDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function FormSignatureField({
  title,
  help,
  inputName,
  inputLabel = "Typed full name",
  defaultValue,
  required = false,
  signatureLineLabel
}: FormSignatureFieldProps) {
  const signingDateText = formatSigningDate(new Date());

  return (
    <div className="signature-block">
      <div className="signature-heading">{title}</div>
      <div className="signature-help">{help}</div>
      <div className="signature-date-preview">
        <span className="eyebrow">Signing date</span>
        <strong>{signingDateText}</strong>
        <span className="muted">Recorded automatically when the form is submitted.</span>
      </div>
      <label className="field">
        <span>{inputLabel}</span>
        <input className="signature-input" defaultValue={defaultValue} name={inputName} required={required} type="text" />
      </label>
      <div className="signature-meta">
        <span className="signature-line">{signatureLineLabel}</span>
        <span className="signature-line">Date recorded on submission</span>
      </div>
    </div>
  );
}
