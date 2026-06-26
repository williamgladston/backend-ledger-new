import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { tokenStorage, userStorage } from "@/services/tokenStorage";
import type { User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (user: User, token: string) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUser(): User | null {
  try {
    const raw = userStorage.get();
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readUser());
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());

  useEffect(() => {
    const storedToken = tokenStorage.get();
    const storedUser = readUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
  }, []);

  const setSession = useCallback((u: User, t: string) => {
    tokenStorage.set(t);
    userStorage.set(JSON.stringify(u));
    setUser(u);
    setToken(t);
  }, []);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      setSession,
      clearSession,
    }),
    [user, token, setSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}