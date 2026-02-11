import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";

type ToastRecord = {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
};

type ToastContextValue = {
  showToast: (options: Partial<Omit<ToastRecord, "id" | "duration">> & { title?: string; description?: string; variant?: ToastVariant; duration?: number }) => void;
  dismissToast: (id: string) => void;
};

const DEFAULT_DURATION = 3000;
const ToastContext = createContext<ToastContextValue | null>(null);

const iconByVariant: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

const baseStylesByVariant: Record<ToastVariant, string> = {
  success: "bg-emerald-500/10 border-emerald-400/40 text-emerald-100",
  error: "bg-rose-500/10 border-rose-400/40 text-rose-100",
  info: "bg-sky-500/10 border-sky-400/40 text-sky-100",
  warning: "bg-amber-500/10 border-amber-400/40 text-amber-100",
};

const darkTextByVariant: Record<ToastVariant, string> = {
  success: "text-emerald-900",
  error: "text-rose-900",
  info: "text-sky-900",
  warning: "text-amber-900",
};

type ToastContainerProps = {
  children: ReactNode;
  toasts: ToastRecord[];
  dismissToast: (id: string) => void;
};

type ToastProviderProps = {
  children: ReactNode;
};

const ToastContainer = ({ children, toasts, dismissToast }: ToastContainerProps) => {
  const [mounted, setMounted] = useState(false);
  const portalContainer = useRef<HTMLElement | null>(null);

  useEffect(() => {
    portalContainer.current = document.body;
    setMounted(true);
  }, []);

  if (!mounted || !portalContainer.current) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed top-6 right-6 z-[999] flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>,
        portalContainer.current,
      )}
    </>
  );
};

type ToastItemProps = {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
};

const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
  const [visible, setVisible] = useState(false);
  const Icon = iconByVariant[toast.variant];
  const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const variantStyles = prefersDark ? baseStylesByVariant[toast.variant] : `${baseStylesByVariant[toast.variant]} ${darkTextByVariant[toast.variant]}`;
  const descriptionClass = prefersDark ? "text-white/80" : "text-slate-600";
  const iconBackground = prefersDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600";
  const closeButtonClass = prefersDark
    ? "border-white/10 text-white/80 hover:bg-white/10"
    : "border-slate-200 text-slate-500 hover:bg-slate-100";

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);
    return () => window.clearTimeout(timeout);
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => onDismiss(toast.id), 200);
  }, [onDismiss, toast.id]);

  return (
    <div
      className={`pointer-events-auto overflow-hidden rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${variantStyles}`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBackground}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {toast.title ? <strong className="text-sm font-semibold leading-tight">{toast.title}</strong> : null}
          {toast.description ? <p className={`text-sm leading-tight ${descriptionClass}`}>{toast.description}</p> : null}
        </div>
        <button
          type="button"
          aria-label="Fechar toast"
          onClick={handleDismiss}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs transition ${closeButtonClass}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue["showToast"]>((options) => {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const nextToast: ToastRecord = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? "info",
      duration: options.duration ?? DEFAULT_DURATION,
    };

    setToasts((current) => [...current, nextToast]);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastContainer toasts={toasts} dismissToast={dismissToast}>
        {children}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser utilizado dentro de um ToastProvider");
  }
  return context;
};
