import { Link } from "react-router-dom";
import type { Account } from "@/types/account";
import { formatCurrency, formatDate, truncateId } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

interface AccountsTableProps {
  accounts: Account[];
  showBalance?: (accountId: string) => number | undefined;
}

export function AccountsTable({ accounts, showBalance }: AccountsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Currency</th>
            <th className="px-4 py-3">Status</th>
            {showBalance && <th className="px-4 py-3">Balance</th>}
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {accounts.map((a) => (
            <tr key={a._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-700">
                {truncateId(a._id, 8, 6)}
              </td>
              <td className="px-4 py-3">{a.currency}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : a.status === "FROZEN"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {a.status}
                </span>
              </td>
              {showBalance && (
                <td className="px-4 py-3 font-medium text-gray-900">
                  {(() => {
                    const b = showBalance(a._id);
                    return b === undefined ? "—" : formatCurrency(b, a.currency);
                  })()}
                </td>
              )}
              <td className="px-4 py-3 text-gray-500">{formatDate(a.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={ROUTES.ACCOUNT_DETAIL(a._id)}
                  className="text-brand-600 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}