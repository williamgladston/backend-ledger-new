import type { Transaction } from "@/types/transaction";
import { formatCurrency, formatDate, truncateId } from "@/utils/format";

interface TransactionsTableProps {
  transactions: Transaction[];
}

const statusStyles: Record<Transaction["status"], string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
  REVERSED: "bg-gray-200 text-gray-700",
};

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">From</th>
            <th className="px-4 py-3">To</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Idempotency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {transactions.map((t) => (
            <tr key={t._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
              <td className="px-4 py-3 font-mono text-xs">{truncateId(t.fromAccount)}</td>
              <td className="px-4 py-3 font-mono text-xs">{truncateId(t.toAccount)}</td>
              <td className="px-4 py-3 text-right font-medium">{formatCurrency(t.amount)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[t.status]}`}>
                  {t.status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{truncateId(t.idempotencyKey, 6, 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}