import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className = "", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      {...rest}
      className={`block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 ${
        invalid
          ? "border-red-400 focus:border-red-500 focus:ring-red-200"
          : "border-gray-300 focus:border-brand-500 focus:ring-brand-200"
      } ${className}`}
    />
  );
});