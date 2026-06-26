import { Link } from "react-router-dom";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountBalance } from "@/hooks/useAccounts";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { AccountsTable } from "@/components/tables/AccountsTable";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/utils/format";
import { extractErrorMessage } from "@/utils/error";
import type { Account } from "@/types/account";

function BalanceCard({ account }: { account: Account }) {
  const { data, isLoading } = useAccountBalance(account._id);
  return (
    <Link
      to={ROUTES.ACCOUNT_DETAIL(account._id)}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-brand-300"
    >
      <p className="text-xs uppercase tracking-wider text-gray-500">{account.currency} account</p>
      <p className="mt-1 font-mono text-xs text-gray-500">{account._id}</p>
      <p className="mt-3 text-2xl font-semibold text-gray-900">
        {isLoading ? "…" : data ? formatCurrency(data.balance, account.currency) : "—"}
      </p>
      <p className="mt-1 text-xs text-gray-500">{account.status}</p>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useAccounts();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.name}
        </h1>
        <p className="text-sm text-gray-500">Here's a snapshot of your accounts.</p>
      </header>

      {isLoading && <FullPageSpinner label="Loading accounts..." />}

      {error && (
        <ErrorState
          message={extractErrorMessage(error)}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && (data?.accounts?.length ?? 0) === 0 && (
        <EmptyState
          title="No accounts yet"
          description="Create an account to start tracking balances and transactions."
          action={
            <Link to={ROUTES.ACCOUNTS}>
              <Button>Create your first account</Button>
            </Link>
          }
        />
      )}

      {!isLoading && !error && (data?.accounts?.length ?? 0) > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data!.accounts.map((a) => (
              <BalanceCard key={a._id} account={a} />
            ))}
          </div>

          <Card title="Your accounts" actions={
            <Link to={ROUTES.SEND_MONEY}>
              <Button>Send money</Button>
            </Link>
          }>
            <AccountsTable accounts={data!.accounts} />
          </Card>

          <Card title="Recent activity">
            <EmptyState
              title="Transaction history isn't available yet"
              description="The backend currently exposes create endpoints only. Add a GET /api/transactions endpoint to populate this list with real data."
            />
          </Card>
        </>
      )}
    </div>
  );
}