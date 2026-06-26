import { Link, useParams } from "react-router-dom";
import { useAccountBalance, useAccounts } from "@/hooks/useAccounts";
import { Card } from "@/components/ui/Card";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, truncateId } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { extractErrorMessage } from "@/utils/error";

export function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const accounts = useAccounts();
  const balance = useAccountBalance(accountId);

  const account = accounts.data?.accounts.find((a) => a._id === accountId);

  if (accounts.isLoading || balance.isLoading) return <FullPageSpinner />;

  if (accounts.error)
    return <ErrorState message={extractErrorMessage(accounts.error)} onRetry={() => accounts.refetch()} />;

  if (!account)
    return (
      <EmptyState
        title="Account not found"
        description="This account doesn't exist or doesn't belong to your user."
        action={
          <Link to={ROUTES.ACCOUNTS}>
            <Button variant="secondary">Back to accounts</Button>
          </Link>
        }
      />
    );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Account {truncateId(account._id, 10, 6)}
          </h1>
          <p className="text-sm text-gray-500">Currency: {account.currency} · Status: {account.status}</p>
        </div>
        <Link to={ROUTES.SEND_MONEY}>
          <Button>Send money</Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card title="Balance">
          <p className="text-3xl font-semibold text-gray-900">
            {balance.data ? formatCurrency(balance.data.balance, account.currency) : "—"}
          </p>
        </Card>
        <Card title="Metadata">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Created</dt>
              <dd>{formatDate(account.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Updated</dt>
              <dd>{formatDate(account.updatedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Account ID</dt>
              <dd className="font-mono text-xs">{truncateId(account._id, 12, 6)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="Transactions for this account">
        <EmptyState
          title="Transaction history isn't available yet"
          description="The backend does not expose a GET /api/transactions endpoint. Add one to populate this view with real ledger data."
        />
      </Card>

      <div>
        <Link to={ROUTES.ACCOUNTS} className="text-sm text-brand-600 hover:underline">
          ← Back to accounts
        </Link>
      </div>
    </div>
  );
}