import { Alert } from "./Alert";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <Alert kind="error">
      <div className="flex flex-col gap-2">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm">{message}</p>
        </div>
        {onRetry && (
          <div>
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
}