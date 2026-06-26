import type { ReactNode } from "react";

type AlertKind = "info" | "success" | "error" | "warning";

const styles: Record<AlertKind, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
};

interface AlertProps {
  kind?: AlertKind;
  children: ReactNode;
}

export function Alert({ kind = "info", children }: AlertProps) {
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${styles[kind]}`} role="alert">
      {children}
    </div>
  );
}