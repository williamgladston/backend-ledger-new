import { Link, NavLink } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

const links = [
  { to: ROUTES.DASHBOARD, label: "Dashboard" },
  { to: ROUTES.ACCOUNTS, label: "Accounts" },
  { to: ROUTES.TRANSACTIONS, label: "Transactions" },
  { to: ROUTES.SEND_MONEY, label: "Send Money" },
  { to: ROUTES.SYSTEM_INITIAL_FUNDS, label: "Initial Funds" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white px-4 py-6 md:block">
      <Link to={ROUTES.DASHBOARD} className="mb-8 block text-lg font-semibold text-brand-700">
        Ledger
      </Link>
      <nav className="space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === ROUTES.DASHBOARD}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}