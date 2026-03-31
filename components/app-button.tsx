"use client";

import { useEffect, useRef, useState } from "react";

type AppButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  soundEnabled?: boolean;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement>
  ) => void | Promise<void>;
};

function playTapSound() {
  if (typeof window === "undefined") return;

  const AudioContextCtor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextCtor) return;

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 540;
  gainNode.gain.value = 0.025;

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + 0.06);

  window.setTimeout(() => {
    void context.close().catch(() => undefined);
  }, 120);
}

export function AppButton({
  children,
  className = "",
  disabled,
  fullWidth = false,
  loading = false,
  loadingText = "Working...",
  onClick,
  soundEnabled = false,
  type = "button",
  variant = "secondary",
  ...props
}: AppButtonProps) {
  const [pending, setPending] = useState(false);
  const [pressed, setPressed] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isLoading = loading || pending;

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!onClick || disabled || isLoading) return;

    if (soundEnabled) {
      playTapSound();
    }

    const result = onClick(event);
    if (!result || typeof (result as Promise<void>).then !== "function") {
      return;
    }

    setPending(true);

    try {
      await result;
    } finally {
      if (mountedRef.current) {
        setPending(false);
      }
    }
  }

  return (
    <button
      {...props}
      className={`app-button ${variant}${fullWidth ? " full-width" : ""}${pressed ? " is-pressed" : ""}${
        className ? ` ${className}` : ""
      }`}
      data-loading={isLoading ? "true" : "false"}
      disabled={disabled || isLoading}
      onClick={handleClick}
      onPointerCancel={() => setPressed(false)}
      onPointerDown={() => setPressed(true)}
      onPointerLeave={() => setPressed(false)}
      onPointerUp={() => setPressed(false)}
      type={type}
    >
      {isLoading ? (
        <>
          <span aria-hidden="true" className="app-button-spinner" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
