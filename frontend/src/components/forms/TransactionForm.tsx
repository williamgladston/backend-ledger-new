import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { useCreateTransaction } from "@/hooks/useAccounts";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountBalance } from "@/hooks/useAccounts";
import { uuid } from "@/utils/uuid";
import { formatCurrency, truncateId } from "@/utils/format";
import { Alert } from "@/components/ui/Alert";

const schema = z.object({
  fromAccount: z.string().min(1, "Choose an account"),
  toAccount: z.string().min(1, "Destination account is required"),
  amount: z
    .number({ invalid_type_error: "Amount is required" })
    .positive("Amount must be greater than zero"),
});
type FormValues = z.infer<typeof schema>;

export function TransactionForm() {
  const { data, isLoading } = useAccounts();
  const create = useCreateTransaction();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const fromAccount = watch("fromAccount");
  const balanceQuery = useAccountBalance(fromAccount);

  const accounts = data?.accounts ?? [];

  return (
    <Card title="Send money">
      <form
        className="space-y-4"
        onSubmit={handleSubmit((v) =>
          create.mutate({ ...v, idempotencyKey: uuid() }),
        )}
        noValidate
      >
        {accounts.length === 0 && !isLoading && (
          <Alert kind="warning">You need at least one account before sending money.</Alert>
        )}

        <div>
          <Label htmlFor="fromAccount">From account</Label>
          <select
            id="fromAccount"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            disabled={isLoading || accounts.length === 0}
            {...register("fromAccount")}
          >
            <option value="">Select an account</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.currency} · {truncateId(a._id)} ({a.status})
              </option>
            ))}
          </select>
          {errors.fromAccount && <p className="mt-1 text-xs text-red-600">{errors.fromAccount.message}</p>}
          {fromAccount && balanceQuery.data && (
            <p className="mt-1 text-xs text-gray-500">
              Balance: {formatCurrency(balanceQuery.data.balance)}
            </p>
          )}
        </div>

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
            placeholder="0.00"
            invalid={!!errors.amount}
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>

        <Button
          type="submit"
          loading={create.isPending}
          disabled={accounts.length === 0}
          className="w-full"
        >
          Send
        </Button>
      </form>
    </Card>
  );
}