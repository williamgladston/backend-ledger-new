interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

export function Spinner({ size = "md", label }: SpinnerProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-500">
      <span
        className={`inline-block animate-spin rounded-full border-gray-300 border-t-brand-600 ${sizeMap[size]}`}
        role="status"
        aria-label="Loading"
      />
      {label && <span>{label}</span>}
    </div>
  );
}

export function FullPageSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}