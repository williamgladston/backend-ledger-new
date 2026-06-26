export const QUERY_KEYS = {
  accounts: ["accounts"] as const,
  accountBalance: (accountId: string) =>
    ["accounts", accountId, "balance"] as const,
} as const;