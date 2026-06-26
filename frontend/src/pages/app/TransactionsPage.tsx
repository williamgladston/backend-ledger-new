import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export function TransactionsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
        <p className="text-sm text-gray-500">All transactions across your accounts.</p>
      </header>
      <Card>
        <EmptyState
          title="Transaction history isn't available yet"
          description="The backend does not currently expose a read endpoint for transactions. Add GET /api/transactions (and a controller following the existing style) to populate this view with real data."
        />
      </Card>
    </div>
  );
}