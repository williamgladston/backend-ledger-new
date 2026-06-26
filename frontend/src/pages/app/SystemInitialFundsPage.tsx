import { InitialFundsForm } from "@/components/forms/InitialFundsForm";

export function SystemInitialFundsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">System initial funds</h1>
        <p className="text-sm text-gray-500">
          Seed an account from the system user. The backend enforces this with <code>authSystemUserMiddleware</code>.
        </p>
      </header>
      <InitialFundsForm />
    </div>
  );
}