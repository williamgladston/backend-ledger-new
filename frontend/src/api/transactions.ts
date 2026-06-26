import { apiClient } from "./client";
import type {
  CreateInitialFundsPayload,
  CreateTransactionPayload,
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