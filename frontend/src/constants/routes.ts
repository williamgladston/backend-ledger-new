export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/",
  ACCOUNTS: "/accounts",
  ACCOUNT_NEW: "/accounts/new",
  ACCOUNT_DETAIL: (id: string) => `/accounts/${id}`,
  TRANSACTIONS: "/transactions",
  SEND_MONEY: "/transactions/send",
  SYSTEM_INITIAL_FUNDS: "/system/initial-funds",
} as const;