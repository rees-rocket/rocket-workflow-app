"use client";

type PrintButtonProps = {
  label?: string;
};

export function PrintButton({ label = "Print report" }: PrintButtonProps) {
  return (
    <button
      className="btn secondary"
      onClick={() => window.print()}
      type="button"
    >
      {label}
    </button>
  );
}
