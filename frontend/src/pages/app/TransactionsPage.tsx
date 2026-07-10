import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { TransactionsTable } from "@/components/tables/TransactionsTable";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import type { TransactionStatus } from "@/types/transaction";

const STATUS_OPTIONS: { value: TransactionStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" },
];

export function TransactionsPage() {
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "ALL">(
    "ALL",
  );

  const { data: accountsData } = useAccounts();
  const accounts = accountsData?.accounts ?? [];

  const params = {
    accountId: accountFilter === "ALL" ? undefined : accountFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  };
  const { data, isLoading, isError, error, refetch } = useTransactions(params);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500">
          All transactions across your accounts.
        </p>
      </header>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Account
              </span>
              <select
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
              >
                <option value="ALL">All accounts</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a._id} ({a.currency})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-gray-700">
                Status
              </span>
              <select
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as TransactionStatus | "ALL")
                }
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {data && (
            <p className="text-xs text-gray-500">
              Showing {data.transactions.length} of {data.total}
            </p>
          )}
        </div>
      </Card>

      {isLoading && (
        <Card>
          <Spinner label="Loading transactions..." />
        </Card>
      )}

      {isError && (
        <ErrorState
          message={
            (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to load transactions."
          }
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && data && data.transactions.length === 0 && (
        <Card>
          <EmptyState
            title="No transactions yet"
            description="When you send money or receive initial funds, they'll show up here."
          />
        </Card>
      )}

      {!isLoading && !isError && data && data.transactions.length > 0 && (
        <TransactionsTable transactions={data.transactions} />
      )}
    </div>
  );
}
