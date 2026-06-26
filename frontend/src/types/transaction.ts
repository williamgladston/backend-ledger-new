export type TransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED";

export interface Transaction {
  _id: string;
  fromAccount: string;
  toAccount: string;
  status: TransactionStatus;
  amount: number;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
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