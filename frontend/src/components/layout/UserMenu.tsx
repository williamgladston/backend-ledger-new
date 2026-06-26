import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@/hooks/useAccounts";

export function UserMenu() {
  const { user } = useAuth();
  const logout = useLogout();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right text-sm sm:block">
        <p className="font-medium text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
      <button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {logout.isPending ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}