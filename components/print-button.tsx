"use client";

import { AppButton } from "@/components/app-button";

type PrintButtonProps = {
  label?: string;
};

export function PrintButton({ label = "Print report" }: PrintButtonProps) {
  return (
    <AppButton onClick={() => window.print()} variant="secondary">
      {label}
    </AppButton>
  );
}
