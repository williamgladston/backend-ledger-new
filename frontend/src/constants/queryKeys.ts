export const QUERY_KEYS = {
  accounts: ["accounts"] as const,
  accountBalance: (accountId: string) =>
    ["accounts", accountId, "balance"] as const,
  transactions: (params: Record<string, unknown> = {}) =>
    ["transactions", params] as const,
} as const;