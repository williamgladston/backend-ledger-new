import { Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-700">Backend Ledger</h1>
          <p className="mt-1 text-sm text-gray-500">Banking &amp; ledger, end to end.</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}