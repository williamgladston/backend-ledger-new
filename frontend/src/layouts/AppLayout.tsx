import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

const titleByPath: Record<string, string> = {
  "/": "Dashboard",
  "/accounts": "Accounts",
  "/accounts/new": "New account",
  "/transactions": "Transactions",
  "/transactions/send": "Send money",
  "/system/initial-funds": "System initial funds",
};

export function AppLayout() {
  const { pathname } = useLocation();
  const title =
    Object.entries(titleByPath).find(([p]) => pathname === p)?.[1] ??
    (pathname.startsWith("/accounts/") ? "Account detail" : "Ledger");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}