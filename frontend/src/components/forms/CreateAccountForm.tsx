import { Button } from "@/components/ui/Button";
import { useCreateAccount } from "@/hooks/useAccounts";
import { Alert } from "@/components/ui/Alert";

export function CreateAccountForm({ onDone }: { onDone?: () => void }) {
  const create = useCreateAccount();

  return (
    <div className="space-y-4">
      <Alert kind="info">
        New accounts are created in <strong>INR</strong> with status{" "}
        <strong>ACTIVE</strong> by the backend.
      </Alert>
      <Button
        loading={create.isPending}
        onClick={() => create.mutate(undefined, { onSuccess: () => onDone?.() })}
      >
        Create account
      </Button>
    </div>
  );
}