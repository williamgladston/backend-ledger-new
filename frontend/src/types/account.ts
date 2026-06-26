export type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";

export interface Account {
  _id: string;
  user: string;
  status: AccountStatus;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface AccountResponse {
  account: Account;
}

export interface AccountBalanceResponse {
  accountId: string;
  balance: number;
}