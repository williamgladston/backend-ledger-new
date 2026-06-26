import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccounts } from "@/hooks/useAccounts";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { AccountsTable } from "@/components/tables/AccountsTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CreateAccountForm } from "@/components/forms/CreateAccountForm";
import { ROUTES } from "@/constants/routes";
import { extractErrorMessage } from "@/utils/error";

export function AccountsPage() {
  const { data, isLoading, error, refetch } = useAccounts();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500">All accounts owned by your user.</p>
        </div>
        <Button onClick={() => setOpen(true)}>New account</Button>
      </header>

      {isLoading && <FullPageSpinner />}
      {error && <ErrorState message={extractErrorMessage(error)} onRetry={() => refetch()} />}

      {!isLoading && !error && (data?.accounts?.length ?? 0) === 0 && (
        <EmptyState
          title="No accounts yet"
          description="Create one to start using the ledger."
          action={<Button onClick={() => setOpen(true)}>Create account</Button>}
        />
      )}

      {!isLoading && !error && (data?.accounts?.length ?? 0) > 0 && (
        <Card>
          <AccountsTable accounts={data!.accounts} />
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a new account"
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <CreateAccountForm onDone={() => setOpen(false)} />
      </Modal>

      <div>
        <Link to={ROUTES.DASHBOARD} className="text-sm text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}