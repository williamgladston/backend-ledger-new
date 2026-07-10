import { apiClient } from "./client";
import type {
  CreateInitialFundsPayload,
  CreateTransactionPayload,
  GetTransactionsParams,
  GetTransactionsResponse,
  TransactionResponse,
} from "@/types/transaction";

export async function createTransaction(
  payload: CreateTransactionPayload,
): Promise<TransactionResponse> {
  const { data } = await apiClient.post<TransactionResponse>(
    "/api/transactions",
    payload,
  );
  return data;
}

export async function createInitialFunds(
  payload: CreateInitialFundsPayload,
): Promise<TransactionResponse> {
  const { data } = await apiClient.post<TransactionResponse>(
    "/api/transactions/system/initial-funds",
    payload,
  );
  return data;
}

/**
 * Fetch the authenticated user's transaction history.
 * Pass `accountId` to scope to one of the caller's accounts.
 */
export async function getTransactions(
  params: GetTransactionsParams = {},
): Promise<GetTransactionsResponse> {
  const { data } = await apiClient.get<GetTransactionsResponse>(
    "/api/transactions",
    { params },
  );
  return data;
}
