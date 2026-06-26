import { apiClient } from "./client";
import type {
  AccountBalanceResponse,
  AccountResponse,
  AccountsResponse,
} from "@/types/account";

export async function listAccounts(): Promise<AccountsResponse> {
  const { data } = await apiClient.get<AccountsResponse>("/api/accounts");
  return data;
}

export async function createAccount(): Promise<AccountResponse> {
  const { data } = await apiClient.post<AccountResponse>("/api/accounts");
  return data;
}

export async function getAccountBalance(
  accountId: string,
): Promise<AccountBalanceResponse> {
  const { data } = await apiClient.get<AccountBalanceResponse>(
    `/api/accounts/balance/${accountId}`,
  );
  return data;
}