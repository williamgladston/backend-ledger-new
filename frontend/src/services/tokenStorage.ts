const TOKEN_KEY = "ledger.token";
const USER_KEY = "ledger.user";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStorage = {
  get(): string | null {
    return localStorage.getItem(USER_KEY);
  },
  set(userJson: string): void {
    localStorage.setItem(USER_KEY, userJson);
  },
};