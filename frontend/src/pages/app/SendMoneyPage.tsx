import { TransactionForm } from "@/components/forms/TransactionForm";

export function SendMoneyPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Send money</h1>
        <p className="text-sm text-gray-500">
          Transfers require both accounts to be ACTIVE and the sender to have sufficient balance.
        </p>
      </header>
      <TransactionForm />
    </div>
  );
}