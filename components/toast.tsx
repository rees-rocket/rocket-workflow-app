"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type ToastTone = "success" | "info";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
  duration: number;
};

type ToastOptions = {
  duration?: number;
  tone?: ToastTone;
};

type ToastContextValue = {
  pushToast: (message: string, options?: ToastOptions) => void;
  removeToast: (id: number) => void;
  toasts: ToastItem[];
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message: string, options?: ToastOptions) => {
    const toast: ToastItem = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      message,
      tone: options?.tone ?? "success",
      duration: options?.duration ?? 2600
    };

    setToasts((current) => [...current, toast]);
  }, []);

  const value = useMemo(
    () => ({
      pushToast,
      removeToast,
      toasts
    }),
    [pushToast, removeToast, toasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider.");
  }

  return context;
}

function ToastItemView({
  id,
  message,
  tone,
  duration
}: ToastItem & { duration: number }) {
  const { removeToast } = useToast();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      removeToast(id);
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [duration, id, removeToast]);

  return (
    <div className={`app-toast ${tone}`} role="status">
      <div className="app-toast-copy">
        <strong>{tone === "success" ? "Success" : "Notice"}</strong>
        <span>{message}</span>
      </div>
      <button
        aria-label="Dismiss notification"
        className="app-toast-close"
        onClick={() => removeToast(id)}
        type="button"
      >
        Close
      </button>
    </div>
  );
}

export function ToastViewport() {
  const { toasts } = useToast();

  return (
    <div aria-live="polite" aria-atomic="true" className="app-toast-viewport">
      {toasts.map((toast) => (
        <ToastItemView key={toast.id} {...toast} />
      ))}
    </div>
  );
}
