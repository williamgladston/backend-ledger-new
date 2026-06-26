import { useToast } from "@/hooks/useToast";

const kindStyles: Record<"success" | "error" | "info", string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:right-4 sm:left-auto sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto w-full max-w-sm rounded-md border px-4 py-3 text-sm shadow-md ${kindStyles[t.kind]}`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-xs text-current opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}