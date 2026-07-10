export type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED";

export type TransactionDirection = "DEBIT" | "CREDIT" | "INTERNAL";

export interface Transaction {
  _id: string;
  fromAccount: string;
  toAccount: string;
  status: TransactionStatus;
  amount: number;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  // Enrichment from GET /api/transactions
  direction?: TransactionDirection;
  counterpartyAccountId?: string;
  counterpartyUserName?: string | null;
  counterpartyUserEmail?: string | null;
}

export interface CreateTransactionPayload {
  fromAccount: string;
  toAccount: string;
  amount: number;
  idempotencyKey: string;
}

export interface CreateInitialFundsPayload {
  toAccount: string;
  amount: number;
  idempotencyKey: string;
}

export interface TransactionResponse {
  message: string;
  transaction: Transaction;
}

export interface GetTransactionsParams {
  accountId?: string;
  status?: TransactionStatus;
  limit?: number;
  skip?: number;
}

export interface GetTransactionsResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  skip: number;
}
