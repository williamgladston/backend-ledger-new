import type { LabelHTMLAttributes } from "react";

export function Label({ children, className = "", ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...rest}
      className={`mb-1 block text-sm font-medium text-gray-700 ${className}`}
    >
      {children}
    </label>
  );
}