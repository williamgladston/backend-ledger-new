import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { useCreateInitialFunds } from "@/hooks/useAccounts";
import { uuid } from "@/utils/uuid";
import { Alert } from "@/components/ui/Alert";

const schema = z.object({
  toAccount: z.string().min(1, "Destination account is required"),
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .positive("Amount must be greater than zero"),
});
type FormValues = z.infer<typeof schema>;

export function InitialFundsForm() {
  const send = useCreateInitialFunds();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <Card
      title="System: seed initial funds"
      subtitle="Only system users can call this endpoint."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((v) =>
          send.mutate({ ...v, idempotencyKey: uuid() }),
        )}
        noValidate
      >
        <Alert kind="info">
          The backend will return <strong>403</strong> if the logged-in user is
          not flagged as <code>systemUser</code>.
        </Alert>
        <div>
          <Label htmlFor="toAccount">Destination account ID</Label>
          <Input id="toAccount" placeholder="65f..." invalid={!!errors.toAccount} {...register("toAccount")} />
          {errors.toAccount && <p className="mt-1 text-xs text-red-600">{errors.toAccount.message}</p>}
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            invalid={!!errors.amount}
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>
        <Button type="submit" loading={send.isPending} className="w-full">
          Send initial funds
        </Button>
      </form>
    </Card>
  );
}